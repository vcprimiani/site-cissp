import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for session
    supabase.auth.getSession().then(({ data, error }) => {
      setSession(data?.session || null);
    });
    // Try to get email from localStorage or query params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || localStorage.getItem('onboard_email') || '';
    setEmail(emailParam);
  }, []);

  const handleSendMagicLink = async () => {
    if (!email) {
      setError('No email found. Please return to onboarding.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || !confirm) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    // Immediately sign in with the new password
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('Password updated, but failed to sign in: ' + signInError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Set Your Password</h2>
          <div className="text-red-700 font-semibold mb-4">Your session has expired. Please log in again to set your password.</div>
          {magicSent ? (
            <div className="text-green-700 mb-4">Magic link sent! Check your email to log in.</div>
          ) : (
            <>
              <button
                onClick={handleSendMagicLink}
                className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg mb-2"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
              {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm mt-2">{error}</div>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Your Password</h2>
        {success ? (
          <div className="text-green-700 text-center font-semibold mb-4">Password updated! Redirecting...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg text-lg font-mono border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg text-lg font-mono border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              minLength={8}
              required
            />
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Set Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordPage; 