import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

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