import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { trackPurchase, trackSignup, trackBeginCheckout, trackPageView } from '../../utils/googleAds';

export const GoogleAdsTest: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testPurchase = () => {
    if (!user?.email) {
      addTestResult('❌ No user email available for purchase test');
      return;
    }

    try {
      trackPurchase('test-session-123', 15.99, 'USD', {
        email: user.email
      });
      addTestResult('✅ Purchase conversion tracked with Enhanced Conversions');
    } catch (error) {
      addTestResult(`❌ Purchase test failed: ${error}`);
    }
  };

  const testSignup = () => {
    if (!user?.email) {
      addTestResult('❌ No user email available for signup test');
      return;
    }

    try {
      trackSignup({
        email: user.email
      });
      addTestResult('✅ Signup conversion tracked with Enhanced Conversions');
    } catch (error) {
      addTestResult(`❌ Signup test failed: ${error}`);
    }
  };

  const testBeginCheckout = () => {
    if (!user?.email) {
      addTestResult('❌ No user email available for checkout test');
      return;
    }

    try {
      trackBeginCheckout(
        15.99,
        [{
          item_id: 'test-product',
          item_name: 'Test Product',
          price: 15.99,
          quantity: 1
        }],
        'USD',
        {
          email: user.email
        }
      );
      addTestResult('✅ Begin checkout tracked with Enhanced Conversions');
    } catch (error) {
      addTestResult(`❌ Checkout test failed: ${error}`);
    }
  };

  const testPageView = () => {
    if (!user?.email) {
      addTestResult('❌ No user email available for page view test');
      return;
    }

    try {
      trackPageView(
        'Google Ads Test Page',
        window.location.href,
        {
          email: user.email
        }
      );
      addTestResult('✅ Page view tracked with Enhanced Conversions');
    } catch (error) {
      addTestResult(`❌ Page view test failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Google Ads Enhanced Conversions Test</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p><strong>Email:</strong> {user?.email || 'Not authenticated'}</p>
              <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
              <p><strong>GTAG Available:</strong> {typeof window !== 'undefined' && typeof window.gtag === 'function' ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={testPurchase}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Purchase Conversion
              </button>
              
              <button
                onClick={testSignup}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Test Signup Conversion
              </button>
              
              <button
                onClick={testBeginCheckout}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test Begin Checkout
              </button>
              
              <button
                onClick={testPageView}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Test Page View
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Clear Results
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">How to Verify</h3>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• Open browser Developer Tools (F12)</li>
              <li>• Go to Network tab</li>
              <li>• Filter by "google" or "googletagmanager"</li>
              <li>• Run a test and look for requests to Google</li>
              <li>• Check that user_data.email is included in the request</li>
              <li>• Verify in Google Ads that Enhanced Conversions coverage improves</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 