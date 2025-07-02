import React from 'react';
import { stripeProducts } from '../../stripe-config';
import { PricingCard } from './PricingCard';
import { useSubscription } from '../../hooks/useSubscription';
import { Loader, CreditCard, Shield, Zap } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { subscription, loading, isActive } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your CISSP Study Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock unlimited AI-powered question generation and advanced study tools 
            to accelerate your CISSP certification journey.
          </p>
        </div>

        {/* Current Subscription Status */}
        {isActive && subscription && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-900">Active Subscription</h3>
              </div>
              <p className="text-green-800">
                You have an active subscription to our AI Question Generator. 
                Enjoy unlimited access to all premium features!
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8 justify-center">
            {stripeProducts.map((product, index) => (
              <div key={product.id} className="flex justify-center">
                <div className="w-full max-w-md">
                  <PricingCard
                    product={product}
                    isPopular={index === 0}
                    currentPriceId={subscription?.price_id}
                    isActive={isActive}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Question Generator?
            </h2>
            <p className="text-lg text-gray-600">
              Advanced features designed specifically for CISSP exam preparation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">
                Advanced AI creates realistic CISSP exam questions tailored to your study needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comprehensive Coverage</h3>
              <p className="text-gray-600">
                All 8 CISSP domains covered with varying difficulty levels and question types
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Billing</h3>
              <p className="text-gray-600">
                Cancel anytime with no long-term commitment. Secure payments via Stripe
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access 
                to premium features until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How many questions can I generate?
              </h3>
              <p className="text-gray-600">
                With a premium subscription, you get unlimited question generation. Create as many 
                practice questions as you need for your CISSP study sessions.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are the questions similar to the real CISSP exam?
              </h3>
              <p className="text-gray-600">
                Our AI is trained to generate questions that follow CISSP exam patterns and style, 
                covering all domains with realistic scenarios and appropriate difficulty levels.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                Yes, all payments are processed securely through Stripe, a leading payment processor. 
                We never store your payment information on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};