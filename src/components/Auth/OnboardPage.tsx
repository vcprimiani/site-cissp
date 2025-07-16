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
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
    setName(params.get('name') || '');
    setRef(params.get('ref') || '');
  }, []);

  // Validate referral code if provided
  useEffect(() => {
    const validateReferralCode = async () => {
      if (!ref) {
        setReferralCodeValid(null); // No code provided, not an error
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('referral_codes')
          .select('id, is_active, partner_name')
          .eq('code', ref)
          .single();
          
        if (error || !data) {
          setReferralCodeValid(false);
          setError(`Invalid referral code: ${ref}. Please contact support.`);
          return;
        }
        
        if (!data.is_active) {
          setReferralCodeValid(false);
          setError(`Referral code ${ref} is no longer active. Please contact support.`);
          return;
        }
        
        setReferralCodeValid(true);
        setPartnerName(data.partner_name || '');
        setError(null);
      } catch (err) {
        setReferralCodeValid(false);
        setError('Error validating referral code. Please contact support.');
      }
    };

    if (ref) {
      validateReferralCode();
    }
  }, [ref]);

  const handleStartOnboarding = async () => {
    if (!email) {
      setError('Missing email. Please contact support.');
      setStatus('error');
      return;
    }

    // If referral code is invalid, don't proceed
    if (ref && referralCodeValid === false) {
      return;
    }

    setStatus('creating');
    setError(null);

    try {
      // Check if user already exists by trying to sign up first
      const password = Math.random().toString(36).slice(-10) + 'A1!'; // Generate a strong random password
      const signUpResult = await authHelpers.signUp(email, password, name || email.split('@')[0]);
      
      if (signUpResult.error) {
        // If user already exists, try to sign in with magic link instead
        if (signUpResult.error.message.toLowerCase().includes('user already registered')) {
          // Send magic link for existing user
          const { error: magicLinkError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/onboard?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&ref=${encodeURIComponent(ref)}`
          });
          if (magicLinkError) {
            setError('Failed to send magic link. Please try again.');
            setStatus('error');
            return;
          }
          setError('An account with this email already exists. Please check your email for a magic link to continue.');
          setStatus('error');
          return;
        } else {
          setError(signUpResult.error.message);
          setStatus('error');
          return;
        }
      }
      
      // User was created successfully, set flag for password setup
      localStorage.setItem('needs_password_setup', 'true');
      
      // Store referral code in user_referrals table if valid
      if (ref && signUpResult.data.user && referralCodeValid) {
        try {
          await supabase.from('user_referrals').upsert({
            user_id: signUpResult.data.user.id,
            ref_code: ref
          }, { onConflict: 'user_id' });
        } catch (e) {
          console.warn('Failed to store referral tracking:', e);
          // Don't fail the onboarding for referral tracking errors
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
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome to CISSP.app!</h2>
        <p className="mb-2">We detected you are coming from LearnWorlds.</p>
        <div className="mb-4">
          <div><b>Email:</b> {email || <span className="text-red-500">(missing)</span>}</div>
          <div><b>Name:</b> {name || <span className="text-gray-400">(not provided)</span>}</div>
          <div><b>Referral Code:</b> {ref || <span className="text-gray-400">(none)</span>}</div>
          {partnerName && <div><b>Partner:</b> {partnerName}</div>}
        </div>
        
        {/* Referral code validation status */}
        {ref && (
          <div className="mb-4">
            {referralCodeValid === null && (
              <div className="text-blue-600 text-sm">Validating referral code...</div>
            )}
            {referralCodeValid === true && (
              <div className="text-green-600 text-sm">✓ Valid referral code</div>
            )}
            {referralCodeValid === false && (
              <div className="text-red-600 text-sm">✗ Invalid referral code</div>
            )}
          </div>
        )}

        {status === 'init' && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartOnboarding}
            disabled={!email || (ref && referralCodeValid === false)}
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