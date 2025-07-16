import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authHelpers } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { stripeProducts } from '../../stripe-config';
import { createCheckoutSession } from '../../services/stripe';
import { supabase } from '../../lib/supabase';

export const OnboardPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate ? useNavigate() : (url: string) => { window.location.href = url; };
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [ref, setRef] = useState('');
  const [status, setStatus] = useState<'init' | 'creating' | 'created' | 'redirecting' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
    setName(params.get('name') || '');
    setRef(params.get('ref') || '');
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Already logged in, redirect to main app
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const validateReferralCode = async () => {
      if (!ref) {
        setError('Missing referral code. Please contact support.');
        setStatus('error');
        return;
      }
      const { data, error } = await supabase
        .from('referral_codes')
        .select('id, is_active, partner_name')
        .eq('code', ref)
        .single();
      if (error || !data) {
        setError('Invalid referral code. Please contact support.');
        setStatus('error');
        return;
      }
      if (!data.is_active) {
        setError('This referral code is no longer active. Please contact support.');
        setStatus('error');
        return;
      }
      setPartnerName(data.partner_name || '');
      setStatus('creating');
      setError(null);
      if (!email) {
        setError('Missing email. Please contact support.');
        setStatus('error');
        return;
      }
      try {
        // Try to sign in first
        let signInResult = await authHelpers.signIn(email, ''); // Empty password, will fail if not magic link
        if (signInResult.error) {
          // If user not found, sign up
          if (signInResult.error.message.toLowerCase().includes('invalid login credentials')) {
            const password = Math.random().toString(36).slice(-10) + 'A1!'; // Generate a strong random password
            const signUpResult = await authHelpers.signUp(email, password, name || email.split('@')[0]);
            if (signUpResult.error) {
              setError(signUpResult.error.message);
              setStatus('error');
              return;
            }
            // Set flag for password setup
            localStorage.setItem('needs_password_setup', 'true');
          } else {
            setError(signInResult.error.message);
            setStatus('error');
            return;
          }
        }
        // Optionally, store referral code in user_referrals table
        if (ref && user) {
          try {
            await supabase.from('user_referrals').upsert({
              user_id: user.id,
              ref_code: ref
            }, { onConflict: 'user_id' });
          } catch (e) {
            // Ignore referral tracking errors
          }
        }
        setStatus('redirecting');
        // Redirect to Stripe checkout
        const product = stripeProducts[0];
        if (!product) {
          setError('No product configured.');
          setStatus('error');
          return;
        }
        const session = await createCheckoutSession({
          priceId: product.priceId,
          mode: product.mode,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/`,
          couponCode: undefined,
          promotionCode: undefined,
        });
        if (session && session.url) {
          window.location.href = session.url;
        } else {
          setError('Failed to create Stripe checkout session.');
          setStatus('error');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        setStatus('error');
      }
    };
    validateReferralCode();
  }, [ref, email, name]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome to the App!</h2>
        <p className="mb-2">We detected you are coming from LearnWorlds.</p>
        <div className="mb-4">
          <div><b>Email:</b> {email || <span className="text-red-500">(missing)</span>}</div>
          <div><b>Name:</b> {name || <span className="text-red-500">(missing)</span>}</div>
          <div><b>Referral Code:</b> {ref || <span className="text-gray-400">(none)</span>}</div>
        </div>
        {status === 'init' && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            onClick={() => setStatus('creating')}
            disabled={!email}
          >
            Start Onboarding & Payment
          </button>
        )}
        {status === 'creating' && (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Creating user and redirecting to payment...</span>
          </div>
        )}
        {status === 'redirecting' && (
          <div className="text-blue-600 font-semibold text-center">
            Redirecting to payment...
          </div>
        )}
        {status === 'error' && (
          <div className="text-red-600 font-semibold text-center">
            {error}
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500 text-center">
          This onboarding is only for users coming from LearnWorlds.<br/>
          Existing users and normal signups are not affected.
          <br/>
          This is the production onboarding URL for LearnWorlds integration.
        </div>
      </div>
    </div>
  );
}; 