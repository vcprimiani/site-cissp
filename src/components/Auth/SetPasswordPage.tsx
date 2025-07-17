import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to get email from localStorage or query params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || localStorage.getItem('onboard_email') || '';
    setEmail(emailParam);
    
    console.log('SetPasswordPage: Email from params/storage:', emailParam);
  }, []);

  const handleSendMagicLink = async () => {
    if (!email) {
      setError('No email found. Please return to onboarding.');
      return;
    }
    setError(null);
    setLoading(true);
    console.log('SetPasswordPage: Sending magic link to:', email);
    
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      console.error('SetPasswordPage: Magic link error:', error);
      setError(error.message);
    } else {
      console.log('SetPasswordPage: Magic link sent successfully');
      setMagicSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowMagic(false);
    
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
    console.log('SetPasswordPage: Updating password for user');
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) {
        console.error('SetPasswordPage: Password update error:', updateError);
        setLoading(false);
        setError(updateError.message);
        return;
      }
      
      console.log('SetPasswordPage: Password updated successfully');
      
      // Don't try to sign in immediately - just redirect to success
      setSuccess(true);
      setLoading(false);
      
      // Clear the needs_password_setup flag
      localStorage.removeItem('needs_password_setup');
      
      // Redirect after a short delay
      setTimeout(() => {
        console.log('SetPasswordPage: Redirecting to main app');
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('SetPasswordPage: Unexpected error:', err);
      setLoading(false);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Set Your Password</h2>
        {success ? (
          <div className="text-center">
            <div className="text-green-700 font-semibold mb-4">✅ Password updated successfully!</div>
            <div className="text-gray-600 text-sm mb-4">Redirecting you to the main application...</div>
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : showMagic ? (
          <>
            <div className="text-red-700 font-semibold mb-4">Your session has expired or sign-in failed. Please log in again to set your password.</div>
            {magicSent ? (
              <div className="text-green-700 mb-4">Magic link sent! Check your email to log in.</div>
            ) : (
              <button
                onClick={handleSendMagicLink}
                className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg mb-2"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            )}
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm mt-2">{error}</div>}
          </>
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