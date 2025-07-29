import React, { useState, useEffect } from 'react';
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
  Rocket,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  XCircle,
  Timer,
  BarChart,
  BrainCircuit,
  TargetIcon,
  CheckSquare,
  AlertTriangle
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

  // Load Stripe pricing table script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize the pricing table after script loads
      const pricingTableElement = document.getElementById('stripe-pricing-table');
      if (pricingTableElement && (window as any).Stripe) {
        const stripe = (window as any).Stripe('pk_live_51PONTuFZjU9QP2AzUbdSaPSPfPzObDwFZb868pklh0rEcxEOUEW9DieYgYS9bAkHKB0AH7l03yXMVH8qQLeay4Cx00jdMJcB6c');
        stripe.loadStripePricingTable({
          pricingTableId: 'prctbl_1Rq3IgFZjU9QP2AzIqWnKOpS',
          element: pricingTableElement
        });
      }
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

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

  const mockExamFeatures = [
    {
      icon: BrainCircuit,
      title: 'AI-Powered Question Generation',
      description: 'Fresh, realistic questions that mirror the actual CISSP exam',
      details: 'Our advanced AI creates questions that closely match real exam patterns, ensuring you practice with content that truly prepares you for test day.',
      color: 'from-purple-600 to-blue-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      icon: TargetIcon,
      title: 'Computer Adaptive Testing',
      description: 'Questions adapt to your skill level in real-time',
      details: 'Experience the same adaptive testing technology used in the real CISSP exam. Questions get harder or easier based on your performance.',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: Timer,
      title: 'Full-Length Mock Exams',
      description: '3-hour exams with 100-150 questions, just like the real test',
      details: 'Build your time management skills and exam endurance with complete mock exams that simulate the actual testing environment.',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      icon: BarChart,
      title: 'Comprehensive Analytics',
      description: 'Detailed performance insights across all 8 CISSP domains',
      details: 'Get domain-specific breakdowns, ability score progression, and targeted study recommendations based on your performance.',
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      icon: Brain,
      title: 'Casey AI Study Assistant',
      description: '24/7 expert help for concept clarification and explanations',
      details: 'Ask Casey anything about CISSP concepts, get instant explanations, and receive personalized guidance for your study journey.',
      color: 'from-teal-600 to-green-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600'
    },
    {
      icon: Database,
      title: 'Practice Question Bank',
      description: 'Unlimited practice questions with smart categorization',
      details: 'Build a comprehensive database of practice questions with search capabilities, bookmarking, and progress tracking.',
      color: 'from-orange-600 to-red-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  const allFeatures = [
    {
      icon: BrainCircuit,
      title: 'AI-Generated Mock Exams',
      description: 'Full-length adaptive exams with fresh, realistic questions'
    },
    {
      icon: TargetIcon,
      title: 'Computer Adaptive Testing',
      description: 'Questions adapt to your skill level in real-time, just like the real exam'
    },
    {
      icon: Timer,
      title: '3-Hour Full Exams',
      description: 'Complete mock exams with proper timing and no backtracking'
    },
    {
      icon: BarChart,
      title: 'Domain Performance Analytics',
      description: 'Detailed breakdowns across all 8 CISSP domains'
    },
    {
      icon: Brain,
      title: 'Casey AI Assistant',
      description: '24/7 expert help for concept clarification and explanations'
    },
    {
      icon: Database,
      title: 'Practice Question Bank',
      description: 'Unlimited practice questions with smart categorization'
    },
    {
      icon: Clock,
      title: 'Session Tracking',
      description: 'Smart session management prevents question repetition'
    },
    {
      icon: Award,
      title: 'Keyword Highlighting',
      description: 'AI-powered analysis highlights critical CISSP terms'
    },
    {
      icon: Bookmark,
      title: 'Bookmark System',
      description: 'Save important questions and concepts for later review'
    },
    {
      icon: Users,
      title: 'Study Group Tools',
      description: 'Participant tallies and presentation features for group study'
    },
    {
      icon: Calendar,
      title: 'Daily Free Quiz',
      description: 'Free daily practice quiz for all users with 3 questions'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your study data is securely stored and protected'
    }
  ];

  const testimonials = [
    {
      name: 'Alexandra Thompson',
      role: 'Security Architect',
      company: 'Meridian Technologies',
      content: 'The mock exams are incredibly realistic. The adaptive testing and AI-generated questions made me feel like I was taking the real exam. Casey\'s explanations helped me understand concepts I was struggling with.',
      rating: 5
    },
    {
      name: 'Marcus Williams',
      role: 'IT Security Manager',
      company: 'Pinnacle Financial Group',
      content: 'Best CISSP prep tool I\'ve used. The full-length mock exams with adaptive testing gave me the confidence I needed. The AI question generation ensures fresh, relevant content every time.',
      rating: 5
    },
    {
      name: 'Priya Patel',
      role: 'Cybersecurity Consultant',
      company: 'Apex Security Solutions',
      content: 'The mock exams are game-changing. The 3-hour format with adaptive questions helped me build the endurance and time management skills I needed. Casey\'s explanations are incredibly detailed.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'AI-Generated Questions' },
    { number: '500+', label: 'Study Leaders' },
    { number: '95%', label: 'Pass Rate' },
    { number: '8', label: 'CISSP Domains' }
  ];

  const benefits = [
    'Unlimited full-length mock exams',
    'Computer adaptive testing technology',
    'AI-generated questions that mirror real exam',
    '3-hour exam format with proper timing',
    'Domain-specific performance analytics',
    'Casey AI assistant available 24/7',
    'All 8 CISSP domains covered',
    'Advanced question customization',
    'Detailed explanations and insights',
    'Progress tracking and analytics',
    'Keyword highlighting feature',
    'Bookmark and save questions',
    'Daily free quiz for all users',
    'Session tracking and persistence',
    'Cross-platform sync (iOS, Android, Web)',
    'Cancel anytime - no commitment'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <img 
                  src="/Untitled design-7.png" 
                  alt="CISSP Study Group" 
                  className="w-8 h-8 object-contain rounded-xl"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CISSP Study Group</h1>
                <p className="text-xs text-gray-600">AI-Powered Mock Exams</p>
              </div>
            </div>
            
            {/* Platform Badges */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Smartphone className="w-4 h-4" />
                <span>iOS & Android</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Monitor className="w-4 h-4" />
                <span>Web</span>
              </div>
            </div>
            
            <button
              onClick={onGetStarted}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mock Exam Focus */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Social Proof Badge */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  Trusted by 500+ CISSP students
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Master CISSP with
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered </span>
                Mock Exams
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Experience the most realistic CISSP exam simulation with Computer Adaptive Testing. 
                AI-generated questions, 3-hour full exams, and detailed analytics across all 8 domains.
              </p>
              
              {/* Single Strong CTA */}
              <div className="mb-8">
                <button
                  onClick={onGetStarted}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  <span>{loading ? 'Loading...' : 'Start Free Trial'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-sm text-gray-500 mt-2 text-center sm:text-left">
                  ⚡ Instant access • 🔒 Secure • 📱 All devices
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start space-x-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free daily quiz</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>3-hour mock exams</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI adaptive testing</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Demo - Mock Exam Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Timer className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Mock Exam Interface</h3>
                  <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-800">Live</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">AI-Generated Questions</p>
                      <p className="text-xs text-gray-600">Fresh, realistic content</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <TargetIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Adaptive Testing</p>
                      <p className="text-xs text-gray-600">Questions adapt to your level</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <BarChart className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Real-Time Analytics</p>
                      <p className="text-xs text-gray-600">Domain performance tracking</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📊 Exam Progress</h4>
                  <p className="text-blue-800 text-sm">
                    "Question 45 of 125 • Domain: Security Architecture • Time remaining: 1:23:45"
                  </p>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                ✨ AI Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                🎯 Adaptive Testing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three easy steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="flex items-center justify-center mb-4"><UserCheck className="w-8 h-8 text-blue-600" /></div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Create an Account</h3>
              <p className="text-gray-600">Sign up in seconds and access your dashboard instantly.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="flex items-center justify-center mb-4"><Sparkles className="w-8 h-8 text-purple-600" /></div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Try Free Mock Exam</h3>
              <p className="text-gray-600">Experience a full-length adaptive mock exam with AI-generated questions.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow text-center">
              <div className="flex items-center justify-center mb-4"><TrendingUp className="w-8 h-8 text-green-600" /></div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Start Free Trial for Unlimited Access</h3>
              <p className="text-gray-600">Unlock unlimited mock exams, practice questions, and Casey AI assistance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Stop Struggling with CISSP Preparation
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Static Practice Tests</h3>
                    <p className="text-gray-600">Fixed questions that don't adapt to your skill level</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Outdated Content</h3>
                    <p className="text-gray-600">Recycled questions that don't match current exam patterns</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">No Real Exam Simulation</h3>
                    <p className="text-gray-600">Missing the time pressure and adaptive nature of the real test</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
              >
                Experience the Difference
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">The AI-Powered Solution</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Computer Adaptive Testing</h4>
                    <p className="text-gray-600">Questions adapt in real-time based on your performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">AI-Generated Questions</h4>
                    <p className="text-gray-600">Fresh, realistic content that mirrors the actual exam</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Full-Length Mock Exams</h4>
                    <p className="text-gray-600">3-hour exams with proper timing and no backtracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mock Exam Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              The Most Realistic CISSP Mock Exam Experience
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of CISSP preparation with AI-powered adaptive testing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mockExamFeatures.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 ${
                  activeFeature === index ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(0)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feature.color}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-700 mb-4">{feature.description}</p>
                <p className="text-gray-600 text-sm">{feature.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI-Powered Mock Exams?
            </h2>
            <p className="text-xl text-gray-600">
              See how our adaptive testing technology compares to traditional practice tests
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              <div className="bg-gray-50 p-6 border-r border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature</h3>
                <div className="space-y-4 text-sm">
                  <div className="font-medium">Question Source</div>
                  <div className="font-medium">Adaptation</div>
                  <div className="font-medium">Content Quality</div>
                  <div className="font-medium">Personalization</div>
                  <div className="font-medium">Real Exam Match</div>
                  <div className="font-medium">Time Management</div>
                </div>
              </div>
              
              <div className="p-6 border-r border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Traditional Practice Tests</h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div>Static, outdated content</div>
                  <div>Fixed difficulty</div>
                  <div>Recycled materials</div>
                  <div>One-size-fits-all</div>
                  <div>Approximate similarity</div>
                  <div>No time pressure</div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Our AI-Powered CAT</h3>
                <div className="space-y-4 text-sm text-blue-800">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Fresh AI-generated questions
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Real-time adaptive difficulty
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Continuously improving content
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Truly personalized experience
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Closely mimicked patterns
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Full 3-hour time limit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof/Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Users Love Our Mock Exams
            </h2>
            <p className="text-gray-600">Join thousands studying for CISSP certification</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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

      {/* Platform Support Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Study Anywhere, Anytime
            </h2>
            <p className="text-xl text-gray-600">Available on all your devices with seamless sync</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">iOS & Android</h3>
                <p className="text-gray-600">Take mock exams on your phone during commutes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Web Browser</h3>
                <p className="text-gray-600">Full-featured mock exam experience on desktop</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Anywhere</h3>
                <p className="text-gray-600">Your progress syncs across all devices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Everything you need to pass CISSP, in one affordable package
          </p>
          
          {/* Stripe Pricing Table */}
          <div className="flex justify-center">
            <div 
              id="stripe-pricing-table"
              data-pricing-table-id="prctbl_1Rq3IgFZjU9QP2AzIqWnKOpS"
              data-publishable-key="pk_live_51PONTuFZjU9QP2AzUbdSaPSPfPzObDwFZb868pklh0rEcxEOUEW9DieYgYS9bAkHKB0AH7l03yXMVH8qQLeay4Cx00jdMJcB6c">
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            🔒 Secure payments • Cancel anytime • No long-term commitment
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Experience the Future of CISSP Prep?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of security professionals using AI-powered adaptive testing to enhance their CISSP preparation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={onGetStarted}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-lg shadow-lg disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              <span>{loading ? 'Loading...' : 'Start Free Trial'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onGetStarted}
              className="flex items-center justify-center space-x-2 px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200 font-semibold"
            >
              <BookOpen className="w-5 h-5" />
              <span>Try Daily Quiz</span>
            </button>
          </div>

          {/* Value Proposition */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Why Choose Our Mock Exams?</h3>
            <p className="text-blue-100 text-sm">
              AI-powered adaptive testing, unlimited full-length mock exams, and personalized learning paths designed for CISSP preparation.
            </p>
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I get started?</h3>
              <p className="text-gray-600">Simply click "Start Free Trial" to create your account and begin studying immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What makes your mock exams different?</h3>
              <p className="text-gray-600">Our Computer Adaptive Testing (CAT) system uses AI-generated questions that adapt to your skill level in real-time, just like the actual CISSP exam.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How long are the mock exams?</h3>
              <p className="text-gray-600">Our full-length mock exams are 3 hours with 100-150 questions, matching the real CISSP exam format.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I use this on my phone and computer?</h3>
              <p className="text-gray-600">Yes, your progress syncs across iOS, Android, and web browsers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is this platform officially endorsed by (ISC)²?</h3>
              <p className="text-gray-600">No, Casey AI is an independent study tool and is not affiliated with or endorsed by (ISC)².</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Absolutely. You're in control—cancel your subscription at any time from your dashboard.</p>
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
                <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                  <img 
                    src="/Untitled design-7.png" 
                    alt="CISSP Study Group" 
                    className="w-6 h-6 object-contain rounded-xl"
                  />
                </div>
                <span className="text-lg font-bold">CISSP Study Group</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered CISSP study platform with Computer Adaptive Testing and Casey AI assistant helping security professionals achieve certification success.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Mock Exams</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Practice Questions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Casey AI</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
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