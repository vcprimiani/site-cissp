import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle, ArrowRight, Lock, Zap, Shield, Target, Brain, Database, Loader, Tag, BarChart2 } from 'lucide-react';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';
import { useAuth } from '../../hooks/useAuth';
import { QuestionCard } from '../UI/QuestionCard';
import { useQuestions } from '../../hooks/useQuestions';
import { analyzeCISSPKeywords } from '../../services/keywordAnalysis';
import { Question } from '../../types';

export const PaywallPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);
  const [randomQuestion, setRandomQuestion] = useState<Question | null>(null);
  const [questionKeywords, setQuestionKeywords] = useState<string[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  // Get the first (and only) product from our stripe config
  const product = stripeProducts[0];

  // Select a random question and analyze its keywords
  useEffect(() => {
    if (!questionsLoading && questions.length > 0 && !randomQuestion) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      const selectedQuestion = questions[randomIndex];
      setRandomQuestion(selectedQuestion);

      // Analyze keywords for the selected question
      const fetchKeywords = async () => {
        setKeywordsLoading(true);
        try {
          const result = await analyzeCISSPKeywords(selectedQuestion.question);
          if (result.keywords && !result.error) {
            setQuestionKeywords(result.keywords);
          }
        } catch (error) {
          console.error('Error analyzing keywords:', error);
        } finally {
          setKeywordsLoading(false);
        }
      };
      fetchKeywords();
    }
  }, [questions, questionsLoading, randomQuestion]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // This shouldn't happen since we check auth before showing this page
      return;
    }

    if (!product) {
      setError('Product configuration not found');
      return;
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

  const handleViewPricing = () => {
    window.location.href = '/pricing';
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Practice',
      description: 'Endless CISSP questions generated and explained by advanced AI—never run out of fresh material.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Target,
      title: 'Smart Quiz Mode',
      description: 'Unlimited quizzes with instant feedback, detailed results, and progress tracking.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BarChart2,
      title: 'Track Your Progress',
      description: 'Visualize your improvement over time with beautiful charts and performance analytics.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Shield,
      title: 'Full Domain Coverage',
      description: 'Master all 8 CISSP domains with expertly crafted questions and explanations.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Zap,
      title: 'Personalized Study Tools',
      description: 'Bookmark, review, and focus on your weak areas for efficient, targeted prep.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Display for Questions Fetch */}
        {questionsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-red-800 font-medium">Database Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{questionsError}</p>
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Your CISSP Success
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get unlimited access to AI-powered question generation, comprehensive study tools, 
            and everything you need to ace your CISSP certification.
          </p>
          
          {/* Subscription Required Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Lock className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Subscription Required</h3>
            </div>
            <p className="text-orange-800">
              This application requires an active subscription to access all features. 
              Subscribe now to unlock unlimited AI question generation and study tools.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Pricing Highlight */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Crown className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Premium Subscription</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              ${product?.price?.toFixed(2) || '15.99'}
            </div>
            <div className="text-gray-600 mb-6">per month</div>
            
            <div className="space-y-3 mb-8">
              {[
                'Unlimited AI question generation',
                'All 8 CISSP domains covered',
                'Advanced question customization',
                'Detailed explanations and insights',
                'Progress tracking and analytics',
                'Cancel anytime - no commitment'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center justify-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="mb-6">
              {!showCouponField ? (
                <button
                  onClick={() => setShowCouponField(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mx-auto"
                >
                  <Tag className="w-4 h-4" />
                  <span>Have a coupon code?</span>
                </button>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">Enter Coupon Code</span>
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
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Coupon will be applied at checkout
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Subscribe Button */}
            <div className="space-y-3">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full max-w-md mx-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Crown className="w-5 h-5" />
                )}
                <span>
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </span>
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              {/* Alternative: View Pricing Details */}
              <button
                onClick={handleViewPricing}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
              >
                View detailed pricing information
              </button>
            </div>
          </div>
        </div>

        {/* Why Subscribe Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Our AI Question Generator?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h4>
              <p className="text-gray-600 text-sm">
                Advanced AI creates realistic CISSP exam questions tailored to your study needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Comprehensive</h4>
              <p className="text-gray-600 text-sm">
                All 8 CISSP domains covered with varying difficulty levels and question types
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Exam-Focused</h4>
              <p className="text-gray-600 text-sm">
                Questions designed to match real CISSP exam patterns and difficulty
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            🔒 Secure payments powered by Stripe • Cancel anytime • No long-term commitment
          </p>
        </div>
      </div>
    </div>
  );
};