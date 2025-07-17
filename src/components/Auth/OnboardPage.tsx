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
  const [status, setStatus] = useState<'init' | 'creating' | 'redirecting' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
    setName(params.get('name') || '');
    setRef(params.get('ref') || '');
  }, []);

  const handleStartOnboarding = async () => {
      if (!email) {
        setError('Missing email. Please contact support.');
        setStatus('error');
        return;
      }

    setStatus('creating');
    setError(null);

      try {
      // Generate a strong random password
      const password = Math.random().toString(36).slice(-10) + 'A1!';
      
      // Try to sign up the user
        const signUpResult = await authHelpers.signUp(email, password, name || email.split('@')[0]);
        
        if (signUpResult.error) {
        // If user already exists, send magic link
          if (signUpResult.error.message.toLowerCase().includes('user already registered')) {
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
        
      // User was created successfully
        localStorage.setItem('needs_password_setup', 'true');
        
      // Store referral info if provided (simple approach)
        if (ref && signUpResult.data.user) {
          try {
            await supabase.from('user_referrals').upsert({
              user_id: signUpResult.data.user.id,
              ref_code: ref
            }, { onConflict: 'user_id' });
          } catch (e) {
          console.warn('Failed to store referral tracking:', e);
          // Don't fail onboarding for referral errors
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
        <p className="mb-4 text-center text-gray-600">Complete your onboarding and start studying.</p>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm">
          <div><b>Email:</b> {email || <span className="text-red-500">(missing)</span>}</div>
            <div><b>Name:</b> {name || <span className="text-gray-400">(not provided)</span>}</div>
            <div><b>Referral:</b> {ref || <span className="text-gray-400">(none)</span>}</div>
          </div>
        </div>

        {status === 'init' && (
          <button
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStartOnboarding}
            disabled={!email}
          >
            Start Onboarding & Payment
          </button>
        )}
        
        {status === 'creating' && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Creating account and redirecting to payment...</span>
          </div>
        )}
        
        {status === 'redirecting' && (
          <div className="text-center">
            <div className="text-blue-600 font-semibold mb-2">Redirecting to payment...</div>
            <div className="text-sm text-gray-500">Please wait while we redirect you to complete your purchase.</div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-600 font-semibold mb-2">Error</div>
            <div className="text-sm text-gray-600">{error}</div>
            <button
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              onClick={() => setStatus('init')}
            >
              Try Again
            </button>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          This onboarding is for users coming from LearnWorlds.<br/>
          You'll be redirected to set up your password after payment.
        </div>
      </div>
    </div>
  );
}; 