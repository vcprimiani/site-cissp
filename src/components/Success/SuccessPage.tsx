import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const SuccessPage: React.FC = () => {
  const { subscription, loading, refreshSubscription, productName } = useSubscription();
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [conversionTracked, setConversionTracked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to set-password if needed
    if (typeof window !== 'undefined' && localStorage.getItem('needs_password_setup') === 'true') {
      localStorage.removeItem('needs_password_setup');
      navigate('/set-password', { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Refresh subscription data when the page loads
    if (!hasRefreshed) {
      refreshSubscription();
      setHasRefreshed(true);
    }
  }, [refreshSubscription, hasRefreshed]);

  // Track conversion when page loads (only once)
  useEffect(() => {
    if (!conversionTracked && typeof window !== 'undefined' && window.gtag) {
      // Get session ID from URL for transaction tracking
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id') || '';
      
      // Fire conversion tracking
      window.gtag('event', 'conversion', {
        'send_to': 'AW-17287675778/ndgYCOGS1OcaEIL_s7NA',
        'value': 15.99, // Monthly subscription price
        'currency': 'USD',
        'transaction_id': sessionId
      });
      
      setConversionTracked(true);
      console.log('Conversion tracked for session:', sessionId);
    }
  }, [conversionTracked]);

  const handleContinue = () => {
    // Clear the URL parameters and redirect to the main app
    window.history.replaceState({}, '', '/');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for subscribing to our AI Question Generator. 
            You now have access to unlimited question generation and all premium features.
          </p>

          {/* Subscription Details */}
          {subscription && productName && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-1">Active Subscription</h3>
              <p className="text-green-800 text-sm">{productName}</p>
              <p className="text-green-700 text-xs mt-1">
                Status: {subscription.subscription_status}
              </p>
            </div>
          )}

          {/* Features List */}
          <div className="text-left mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Unlimited AI question generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Advanced question customization</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>All 8 CISSP domains covered</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Detailed explanations</span>
              </li>
            </ul>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            <span>Continue to Question Bank</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Support Info */}
          <p className="text-xs text-gray-500 mt-6">
            Need help? Contact us at support@cisspstudygroup.com
          </p>
        </div>
      </div>
    </div>
  );
};