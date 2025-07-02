import React, { useState } from 'react';
import { Check, Loader, Crown, Tag } from 'lucide-react';
import { StripeProduct } from '../../stripe-config';
import { redirectToCheckout } from '../../services/stripe';
import { useAuth } from '../../hooks/useAuth';

interface PricingCardProps {
  product: StripeProduct;
  isPopular?: boolean;
  currentPriceId?: string | null;
  isActive?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  product, 
  isPopular = false, 
  currentPriceId,
  isActive = false 
}) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);

  const isCurrentPlan = currentPriceId === product.priceId;
  const isSubscribed = isActive && isCurrentPlan;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // Redirect to login or show login modal
      return;
    }

    if (isSubscribed) {
      return; // Already subscribed
    }

    setLoading(true);
    setError(null);

    try {
      const checkoutParams: any = {
        priceId: product.priceId,
        mode: product.mode,
      };

      // Add coupon code if provided
      if (couponCode.trim()) {
        checkoutParams.couponCode = couponCode.trim();
      }

      await redirectToCheckout(checkoutParams);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    if (!product.price) return 'Contact us';
    
    const price = product.price.toFixed(2);
    const interval = product.interval ? `/${product.interval}` : '';
    return `$${price}${interval}`;
  };

  const getButtonText = () => {
    if (isSubscribed) return 'Current Plan';
    if (loading) return 'Processing...';
    if (!isAuthenticated) return 'Sign In to Subscribe';
    return product.mode === 'subscription' ? 'Subscribe Now' : 'Purchase Now';
  };

  const getButtonStyle = () => {
    if (isSubscribed) {
      return 'bg-green-600 text-white cursor-default';
    }
    if (isPopular) {
      return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700';
    }
    return 'bg-gray-900 text-white hover:bg-gray-800';
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl p-8 ${
      isPopular ? 'ring-2 ring-blue-600 scale-105' : ''
    } ${isSubscribed ? 'ring-2 ring-green-500' : ''}`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      {isSubscribed && (
        <div className="absolute -top-4 right-4">
          <div className="bg-green-500 text-white p-2 rounded-full">
            <Crown className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {formatPrice()}
        </div>
        <p className="text-gray-600">{product.description}</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">Unlimited AI question generation</span>
        </div>
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">Advanced question customization</span>
        </div>
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">All 8 CISSP domains covered</span>
        </div>
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">Detailed explanations</span>
        </div>
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">Progress tracking</span>
        </div>
        <div className="flex items-center space-x-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-gray-700">Cancel anytime</span>
        </div>
      </div>

      {/* Coupon Code Section */}
      {!isSubscribed && (
        <div className="mb-6">
          {!showCouponField ? (
            <button
              onClick={() => setShowCouponField(true)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Tag className="w-4 h-4" />
              <span>Have a coupon code?</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Coupon Code</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => {
                    setShowCouponField(false);
                    setCouponCode('');
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
              {couponCode && (
                <p className="text-xs text-green-600">
                  ✓ Coupon will be applied at checkout
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubscribe}
        disabled={loading || isSubscribed}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${getButtonStyle()}`}
      >
        {loading && <Loader className="w-4 h-4 animate-spin" />}
        {isSubscribed && <Crown className="w-4 h-4" />}
        <span>{getButtonText()}</span>
      </button>

      {product.mode === 'subscription' && !isSubscribed && (
        <p className="text-center text-gray-500 text-sm mt-4">
          Cancel anytime. No long-term commitment.
        </p>
      )}
    </div>
  );
};