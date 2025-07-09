import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setStatus('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }
    setLoading(true);
    setStatus('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) setStatus('Error: ' + error.message);
    else {
      setStatus('Password updated! You can now log in. Redirecting...');
      setResetComplete(true);
      setTimeout(() => {
        window.location.href = '/'; // Redirect to login/landing page
      }, 2000);
    }
  };

  if (!isAuthenticated) {
    return <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow">Invalid or expired reset link, or session expired. Please request a new password reset.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <div className="flex flex-col items-center mb-6">
        <img src="/Untitled design-7.png" alt="CISSP Study Group Logo" className="w-16 h-16 mb-2 rounded-xl" />
        <h1 className="text-xl font-bold text-gray-900">CISSP Study Group</h1>
        <p className="text-xs text-gray-600">AI-Powered CISSP Practice</p>
      </div>
      <h2 className="text-2xl font-bold mb-4">Set a New Password</h2>
      {status && <div className="mb-4 text-sm text-center text-red-600">{status}</div>}
      <form onSubmit={handleReset} className="space-y-4" style={{ opacity: resetComplete ? 0.5 : 1, pointerEvents: resetComplete ? 'none' : 'auto' }}>
        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={8}
            required
            disabled={resetComplete}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            minLength={8}
            required
            disabled={resetComplete}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading || resetComplete}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword; 