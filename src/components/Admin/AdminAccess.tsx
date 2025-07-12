import React, { useState } from 'react';
import { Lock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { FlagReview } from './FlagReview';

interface AdminAccessProps {
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

const ADMIN_CODE = '12561';

export const AdminAccess: React.FC<AdminAccessProps> = ({
  hasActiveSubscription,
  subscriptionLoading
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError('Access temporarily locked. Please wait before trying again.');
      return;
    }

    if (code === ADMIN_CODE) {
      setIsAuthenticated(true);
      setError(null);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setError('Too many failed attempts. Access locked for 5 minutes.');
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
          setError(null);
        }, 300000); // 5 minutes
      } else {
        setError(`Incorrect code. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCode('');
    setError(null);
    setAttempts(0);
  };

  if (isAuthenticated) {
    return (
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-purple-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-gray-600">Flagged Questions Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Exit Admin
          </button>
        </div>

        {/* Admin Content */}
        <FlagReview 
          hasActiveSubscription={hasActiveSubscription}
          subscriptionLoading={subscriptionLoading}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-600">Enter the admin code to access flagged questions management</p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-code" className="block text-sm font-medium text-gray-700 mb-2">
              Admin Code
            </label>
            <input
              id="admin-code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLocked}
              className={`w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-mono tracking-widest ${
                isLocked 
                  ? 'border-gray-300 bg-gray-100 text-gray-500' 
                  : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              }`}
              placeholder="•••••"
              maxLength={5}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLocked || code.length !== 5}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isLocked || code.length !== 5
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-purple-600 text-white hover:from-red-700 hover:to-purple-700 shadow-lg'
            }`}
          >
            {isLocked ? 'Access Locked' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p>This area contains sensitive administrative functions. Access is logged and monitored.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 