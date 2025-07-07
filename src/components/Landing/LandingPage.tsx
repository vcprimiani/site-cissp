import React, { useState } from 'react';
import { 
  Brain, 
  Target, 
  Database, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Star, 
  Users, 
  Zap, 
  BookOpen,
  Crown,
  Play,
  ChevronRight,
  Award,
  TrendingUp,
  Lock,
  Tag,
  Clock,
  BarChart3,
  Lightbulb,
  MessageSquare,
  Calendar,
  Briefcase,
  Share2,
  Bookmark,
  RefreshCw,
  Eye,
  UserCheck,
  Sparkles,
  GraduationCap,
  Rocket
} from 'lucide-react';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';
import { SocialShareButtons } from '../UI/SocialShareButtons';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponField, setShowCouponField] = useState(false);

  // Get the first (and only) product from our stripe config
  const product = stripeProducts[0];

  const handleGetStarted = async () => {
    if (!product) {
      // Fallback to signup if no product configured
      onGetStarted();
      return;
    }

    setLoading(true);
    try {
      const checkoutParams: any = {
        priceId: product.priceId,
        mode: product.mode,
      };

      // Add coupon code if provided
      if (couponCode.trim()) {
        checkoutParams.couponCode = couponCode.trim();
      }

      // Redirect directly to Stripe checkout
      await redirectToCheckout(checkoutParams);
    } catch (error) {
      console.error('Checkout error:', error);
      // Fallback to signup on error
      onGetStarted();
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'Casey - AI Cybersecurity Expert',
      description: 'Your personal CISSP study assistant available 24/7',
      details: 'Ask Casey anything about CISSP concepts, get instant explanations, and receive personalized guidance for your study journey.',
      color: 'from-purple-600 to-blue-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: Target,
      title: 'Interactive Quiz Mode',
      description: 'Take quizzes with detailed scoring and progress tracking',
      details: 'Practice with timed quizzes, get instant feedback, track your progress across all domains, and review detailed explanations.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: Database,
      title: 'Question Bank Management',
      description: 'Organize and manage your CISSP question collection',
      details: 'Build a comprehensive database of practice questions with smart categorization, search capabilities, and bookmarking features.',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: Lightbulb,
      title: 'AI Question Generator',
      description: 'Generate unlimited CISSP practice questions with advanced AI',
      details: 'Create realistic exam-style questions across all 8 CISSP domains with customizable difficulty and focus areas.',
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      icon: Briefcase,
      title: 'Manager\'s Perspective',
      description: 'Learn strategic thinking for CISSP leadership questions',
      details: 'Get insights into how senior security professionals approach management and strategic decisions in real-world scenarios.',
      color: 'from-teal-600 to-green-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track your study progress and identify weak areas',
      details: 'Comprehensive analytics showing your performance across domains, difficulty levels, and study sessions with actionable insights.',
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  const allFeatures = [
    {
      icon: Brain,
      title: 'Casey AI Assistant',
      description: 'Your personal cybersecurity study expert available 24/7'
    },
    {
      icon: Target,
      title: 'Interactive Quizzes',
      description: 'Timed practice quizzes with instant feedback and detailed explanations'
    },
    {
      icon: Database,
      title: 'Question Bank Management',
      description: 'Organize, categorize, and search your growing collection of practice questions'
    },
    {
      icon: Lightbulb,
      title: 'AI Question Generator',
      description: 'Generate unlimited practice questions across all 8 CISSP domains'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track performance across domains, identify weak areas, and monitor improvement'
    },
    {
      icon: Clock,
      title: 'Session Tracking',
      description: 'Smart session management prevents question repetition during study sessions'
    },
    {
      icon: Briefcase,
      title: 'Manager\'s Perspective',
      description: 'Strategic insights for leadership and management-focused CISSP questions'
    },
    {
      icon: Award,
      title: 'Keyword Highlighting',
      description: 'AI-powered keyword analysis highlights critical CISSP terms in questions'
    },
    {
      icon: Bookmark,
      title: 'Bookmark System',
      description: 'Save important questions and concepts for later review'
    },
    {
      icon: Users,
      title: 'Study Group Tools',
      description: 'Participant tallies and presentation features for group study sessions'
    },
    {
      icon: Calendar,
      title: 'Daily Free Quiz',
      description: 'Free daily practice quiz for all users with 3 questions'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your study data is securely stored and protected with enterprise-grade security'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Security Architect',
      company: 'Meridian Technologies',
      content: 'Casey helped me understand complex concepts I was struggling with. The explanations are incredibly detailed and the questions feel just like the real exam. Passed CISSP on my first try!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'IT Security Manager',
      company: 'Pinnacle Financial Group',
      content: 'Best CISSP study tool I\'ve used. The AI question generator creates realistic scenarios, and Casey\'s explanations are game-changing. It\'s like having a personal tutor available 24/7.',
      rating: 5
    },
    {
      name: 'Jennifer Park',
      role: 'Cybersecurity Consultant',
      company: 'Apex Security Solutions',
      content: 'The manager\'s perspective feature is brilliant for leadership questions. The keyword highlighting and bookmark system help me focus on my weak areas. Highly recommended!',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Questions Generated' },
    { number: '500+', label: 'Study Leaders' },
    { number: '95%', label: 'Pass Rate' },
    { number: '8', label: 'CISSP Domains' }
  ];

  const benefits = [
    'Unlimited AI question generation',
    'Casey AI assistant available 24/7',
    'All 8 CISSP domains covered',
    'Advanced question customization',
    'Detailed explanations and insights',
    'Progress tracking and analytics',
    'Manager\'s perspective insights',
    'Keyword highlighting feature',
    'Bookmark and save questions',
    'Daily free quiz for all users',
    'Session tracking and persistence',
    'Cancel anytime - no commitment'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                <img 
                  src="/Untitled design-7.png" 
                  alt="CISSP Study Group" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CISSP Study Group</h1>
                <p className="text-xs text-gray-600">AI-Powered Study Platform</p>
              </div>
            </div>
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  #1 AI-Powered CISSP Study Platform
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master CISSP with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Casey AI </span>
                & Unlimited Practice
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Meet Casey, your personal cybersecurity study expert. Generate unlimited CISSP questions, 
                get instant explanations, and track your progress across all 8 domains with AI-powered insights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  <span>{loading ? 'Loading...' : 'Start Free Trial'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="flex items-center justify-center space-x-2 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold">
                  <BookOpen className="w-5 h-5" />
                  <span>Try Daily Quiz</span>
                </button>
              </div>

              {/* Coupon Code Section */}
              <div className="mb-8">
                {!showCouponField ? (
                  <button
                    onClick={() => setShowCouponField(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Have a coupon code? Click here</span>
                  </button>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => {
                          setShowCouponField(false);
                          setCouponCode('');
                        }}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700"
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
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free daily quiz included</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Instant access</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Integrated Social Share Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Share with Your Network</h3>
                    <p className="text-sm text-gray-600">Help others discover this amazing CISSP study platform</p>
                  </div>
                  <Share2 className="w-6 h-6 text-blue-600" />
                </div>
                <SocialShareButtons
                  title="CISSP Study Group - AI-Powered Study Platform"
                  text="🚀 Found an amazing AI-powered CISSP study platform with Casey AI assistant! Generate unlimited practice questions and master cybersecurity concepts. Perfect for CISSP certification! site.cisspstudygroup.com #CISSP #Cybersecurity #StudyGroup #AI"
                  hashtags={['CISSP', 'Cybersecurity', 'StudyGroup', 'AI']}
                  variant="compact"
                  size="md"
                />
              </div>
            </div>
            
            {/* Hero Image/Demo */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Casey AI Assistant</h3>
                  <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-800">Online</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">24/7 Expert Help</p>
                      <p className="text-xs text-gray-600">Ask anything about CISSP</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Personalized Guidance</p>
                      <p className="text-xs text-gray-600">Tailored to your needs</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Exam-Focused</p>
                      <p className="text-xs text-gray-600">CISSP-specific insights</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💬 Chat with Casey</h4>
                  <p className="text-blue-800 text-sm">
                    "Hi! I'm Casey, your cybersecurity study expert. Ask me anything about CISSP concepts, exam strategies, or get help with practice questions."
                  </p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                ✨ AI Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                🎯 Exam Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Complete CISSP Study Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to pass CISSP in one comprehensive, AI-powered platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Advanced Study Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our most powerful features designed specifically for CISSP success
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      activeFeature === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.bgColor}`}>
                        <Icon className={`w-6 h-6 ${feature.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 mb-2">{feature.description}</p>
                        {activeFeature === index && (
                          <p className="text-sm text-blue-600 font-medium">{feature.details}</p>
                        )}
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        activeFeature === index ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-r ${features[activeFeature].color}`}>
                {React.createElement(features[activeFeature].icon, { className: "w-8 h-8 text-white" })}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{features[activeFeature].title}</h3>
              <p className="text-gray-600 mb-6">{features[activeFeature].details}</p>
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
              >
                <span>{loading ? 'Loading...' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by CISSP Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of security professionals who've achieved CISSP success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Everything you need to pass CISSP, in one affordable package
          </p>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Crown className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Premium Subscription</h3>
            </div>
            
            <div className="text-5xl font-bold text-blue-600 mb-2">
              ${product?.price?.toFixed(2) || '15.99'}
            </div>
            <div className="text-gray-600 mb-8">per month</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="w-full max-w-md mx-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
            >
              <Crown className="w-5 h-5" />
              <span>{loading ? 'Loading...' : 'Subscribe Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              🔒 Secure payments • Cancel anytime • No long-term commitment
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Ace Your CISSP Exam?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of security professionals who've achieved certification success with our AI-powered platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleGetStarted}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              <span>{loading ? 'Loading...' : 'Start Free Trial'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="flex items-center justify-center space-x-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 font-semibold">
              <BookOpen className="w-5 h-5" />
              <span>Try Daily Quiz</span>
            </button>
          </div>

          {/* Share Your Success Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Share2 className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Share with Your Network</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">Help others discover this amazing CISSP study platform</p>
            <SocialShareButtons
              title="CISSP Study Group - AI-Powered Study Platform"
              text="🚀 Found an amazing AI-powered CISSP study platform with Casey AI assistant! Generate unlimited practice questions and master cybersecurity concepts. Perfect for CISSP certification! site.cisspstudygroup.com #CISSP #Cybersecurity #StudyGroup #AI"
              hashtags={['CISSP', 'Cybersecurity', 'StudyGroup', 'AI', 'Certification', 'InfoSec']}
              variant="icon-only"
              size="lg"
              className="justify-center"
            />
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-blue-100 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Free daily quiz included</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                  <img 
                    src="/Untitled design-7.png" 
                    alt="CISSP Study Group" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <span className="text-lg font-bold">CISSP Study Group</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered CISSP study platform with Casey AI assistant helping security professionals achieve certification success.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Daily Quiz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Casey AI</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Study Guides</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy-policy.html" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/terms-of-service.html" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 CISSP Study Group. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};