import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Brain, Wand2, Settings, Loader, Plus, Lightbulb, Target, BookOpen, ChevronDown, ChevronUp, CheckCircle, ArrowRight, Crown, Lock, X, Clock, AlertTriangle, Shield } from 'lucide-react';
import { generateAIQuestion, AIGenerationOptions, getAIUsageInfo, startBulkGeneration, endBulkGeneration } from '../../services/openai';
import { useSubscription } from '../../hooks/useSubscription';
import { formatTimeRemaining } from '../../services/aiSecurity';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';

interface AIGeneratorProps {
  questions: Question[];
  currentUser: any;
  onAddQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => Promise<Question | null>;
  onNavigateToQuestionBank: () => void;
}

// Helper to get the current week key (e.g., '2024-W27')
function getCurrentWeekKey() {
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.ceil(((now - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
  return `${year}-W${week}`;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  questions,
  currentUser,
  onAddQuestion,
  onNavigateToQuestionBank
}) => {
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [advancedQuestionCount, setAdvancedQuestionCount] = useState<1 | 5 | 10>(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [usageInfo, setUsageInfo] = useState(getAIUsageInfo());
  const [isInfoCardDismissed, setIsInfoCardDismissed] = useState(() => {
    return localStorage.getItem('ai-generator-info-dismissed') === 'true';
  });
  const [advancedOptions, setAdvancedOptions] = useState<AIGenerationOptions>({
    domain: 'Security and Risk Management',
    difficulty: 'Medium',
    questionType: 'scenario-based',
    scenarioType: 'technical',
    topic: '',
    includeDistractors: true,
    focusArea: ''
  });
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [savedBannerCount, setSavedBannerCount] = useState(1);

  const FREE_LIMIT = 3;
  const weekKey = getCurrentWeekKey();
  const [freeUsed, setFreeUsed] = useState(() => {
    const usage = JSON.parse(localStorage.getItem('ai-free-usage') || '{}');
    return usage[weekKey] || 0;
  });

  const incrementFreeUsage = (count: number) => {
    const usage = JSON.parse(localStorage.getItem('ai-free-usage') || '{}');
    usage[weekKey] = (usage[weekKey] || 0) + count;
    localStorage.setItem('ai-free-usage', JSON.stringify(usage));
    setFreeUsed(usage[weekKey]);
  };

  // Update usage info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setUsageInfo(getAIUsageInfo());
      
      // Clear rate limit error if wait time has passed
      if (waitTime > 0) {
        const newWaitTime = Math.max(0, waitTime - 1000);
        setWaitTime(newWaitTime);
        if (newWaitTime === 0) {
          setRateLimitError(null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [waitTime]);

  const domains = [
    'Security and Risk Management',
    'Asset Security',
    'Security Architecture and Engineering',
    'Communication and Network Security',
    'Identity and Access Management (IAM)',
    'Security Assessment and Testing',
    'Security Operations',
    'Software Development Security'
  ];

  // Domain subcategories for more targeted question generation
  const domainSubcategories = {
    'Security and Risk Management': [
      'Risk Assessment Methodologies',
      'Business Continuity Planning',
      'Security Governance',
      'Compliance and Legal Issues',
      'Security Policies and Procedures',
      'Risk Treatment Strategies',
      'Security Awareness Training',
      'Vendor Management'
    ],
    'Asset Security': [
      'Data Classification',
      'Data Handling Requirements',
      'Data Retention Policies',
      'Asset Management',
      'Privacy Protection',
      'Data Loss Prevention',
      'Secure Disposal',
      'Information Lifecycle'
    ],
    'Security Architecture and Engineering': [
      'Security Models',
      'Security Capabilities',
      'Secure Design Principles',
      'Security Architectures',
      'Vulnerability Assessment',
      'Web Application Security',
      'Mobile Security',
      'Embedded Systems Security'
    ],
    'Communication and Network Security': [
      'Network Protocols',
      'Network Access Control (NAC)',
      'Network Security Devices',
      'Wireless Security',
      'VPN Technologies',
      'Network Attacks',
      'Secure Communications',
      'Network Monitoring'
    ],
    'Identity and Access Management (IAM)': [
      'Identity Management',
      'Access Control Models',
      'Authentication Methods',
      'Authorization Mechanisms',
      'Identity Federation',
      'Privileged Access Management',
      'Account Management',
      'Access Reviews'
    ],
    'Security Assessment and Testing': [
      'Security Testing',
      'Vulnerability Assessments',
      'Penetration Testing',
      'Security Audits',
      'Log Analysis',
      'Security Metrics',
      'Test Data Management',
      'Security Control Testing'
    ],
    'Security Operations': [
      'Incident Response',
      'Logging and Monitoring',
      'Preventive Measures',
      'Change Management',
      'Recovery Strategies',
      'Disaster Recovery',
      'Physical Security',
      'Personnel Security'
    ],
    'Software Development Security': [
      'Secure Coding Practices',
      'Application Security Testing',
      'Software Development Lifecycle',
      'Code Review',
      'Database Security',
      'API Security',
      'DevSecOps',
      'Software Acquisition'
    ]
  };

  const questionTypes = [
    { value: 'most-likely', label: 'Most Likely / Best Practice', description: 'Questions asking for the BEST or MOST appropriate approach' },
    { value: 'least-likely', label: 'Least Likely / Inappropriate', description: 'Questions asking what would NOT be appropriate' },
    { value: 'best-practice', label: 'Industry Best Practice', description: 'Questions about established security best practices' },
    { value: 'scenario-based', label: 'Scenario-Based', description: 'Detailed real-world scenarios requiring analysis' },
    { value: 'definition', label: 'Definition / Concept', description: 'Questions testing knowledge of terms and concepts' },
    { value: 'comparison', label: 'Comparison / Contrast', description: 'Questions comparing different approaches or models' }
  ];

  const scenarioTypes = [
    { value: 'technical', label: 'Technical Implementation', description: 'Focus on technical details and implementation' },
    { value: 'management', label: 'Management Decision', description: 'Focus on management and strategic decisions' },
    { value: 'compliance', label: 'Compliance & Audit', description: 'Focus on regulatory and compliance requirements' },
    { value: 'incident-response', label: 'Incident Response', description: 'Focus on security incident handling' },
    { value: 'risk-assessment', label: 'Risk Assessment', description: 'Focus on risk analysis and mitigation' }
  ];

  // Get the current topic for generation
  const getCurrentTopic = () => {
    if (selectedSubcategory) {
      return selectedSubcategory;
    }
    if (selectedDomain) {
      return `general concepts from ${selectedDomain}`;
    }
    return 'general CISSP concepts';
  };

  const handleNavigateToQuestionBank = () => {
    setIsNavigating(true);
    
    // Scroll to top of the page first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Navigate to Question Bank tab after a short delay
    setTimeout(() => {
      onNavigateToQuestionBank();
      setIsNavigating(false);
    }, 500);
  };

  const handleUpgradeClick = async () => {
    const product = stripeProducts[0];
    await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
  };

  const handleDismissInfoCard = () => {
    setIsInfoCardDismissed(true);
    localStorage.setItem('ai-generator-info-dismissed', 'true');
  };

  const checkSubscriptionAndProceed = (action: () => void) => {
    if (!hasActiveSubscription) {
      setShowUpgradeModal(true);
      return;
    }
    action();
  };

  const handleQuickGenerate = async (count: 1 | 5 | 10 = 1) => {
    if (!hasActiveSubscription) {
      setShowUpgradeModal(true);
      return;
    }

    const topic = getCurrentTopic();
    if (!selectedDomain && !selectedSubcategory) return;
    
    setIsGenerating(true);
    setRateLimitError(null);
    setGenerationProgress({ current: 0, total: count });
    
    // Start bulk generation mode for multiple questions
    if (count > 1) {
      startBulkGeneration();
    }
    
    try {
      const existingTerms = questions.map(q => q.tags).flat();
      const newQuestions = [];
      
      for (let i = 0; i < count; i++) {
        setGenerationProgress({ current: i + 1, total: count });
        
        try {
          // Create generation options based on selected domain
          const generationOptions = selectedDomain ? {
            domain: selectedDomain,
            difficulty: 'Medium' as const,
            questionType: 'scenario-based' as const,
            scenarioType: 'technical' as const,
            topic: topic,
            includeDistractors: true,
            focusArea: ''
          } : undefined;

          const response = await generateAIQuestion(topic, generationOptions, existingTerms, count > 1);
          
          // Handle rate limiting
          if (response.rateLimited) {
            setRateLimitError(response.error || 'Rate limit exceeded');
            setWaitTime(response.waitTime || 60000);
            break;
          }
          
          if (response.question) {
            const newQuestion = {
              ...response.question,
              createdBy: currentUser.id,
              isActive: true,
              tags: [...response.question.tags, 'ai-generated'] // Add ai-generated tag
            };
            
            // Add to database via the hook
            const addedQuestion = await onAddQuestion(newQuestion);
            if (addedQuestion) {
              newQuestions.push(addedQuestion);
            }
            
            // Add a smaller delay between requests for bulk generation
            if (i < count - 1) {
              const delay = count > 1 ? 500 : 1000; // Shorter delay for bulk generation
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } catch (error: any) {
          console.error(`Error generating question ${i + 1}:`, error);
          
          // Check if it's a rate limit error
          if (error.message.includes('Rate limit') || error.message.includes('wait')) {
            setRateLimitError(error.message);
            setWaitTime(60000); // Default 1 minute wait
            break;
          }
          
          // Continue with remaining questions even if one fails
        }
      }
      
      // Update usage info after generation
      setUsageInfo(getAIUsageInfo());
      
      if (newQuestions.length > 0) {
        setRecentlyAdded(prev => [...newQuestions, ...prev.slice(0, 20)]); // Keep last 20 recently added
        setSavedBannerCount(newQuestions.length);
        setShowSavedBanner(true);
        setTimeout(() => setShowSavedBanner(false), 3500);
        
        // Auto-navigate to Question Bank after successful generation
        setTimeout(() => {
          handleNavigateToQuestionBank();
        }, 1500); // 1.5 second delay to show success message
        
        // Clear recently added after 10 seconds
        setTimeout(() => {
          setRecentlyAdded(prev => prev.filter(q => !newQuestions.includes(q)));
        }, 10000);

        if (!hasActiveSubscription) {
          incrementFreeUsage(newQuestions.length);
        }
      }
    } catch (error: any) {
      console.error('Error in quick generation:', error);
      if (error.message.includes('Rate limit') || error.message.includes('wait')) {
        setRateLimitError(error.message);
        setWaitTime(60000);
      }
    } finally {
      // End bulk generation mode
      if (count > 1) {
        endBulkGeneration();
      }
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const handleAdvancedGenerate = async () => {
    if (!hasActiveSubscription) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setRateLimitError(null);
    setGenerationProgress({ current: 0, total: advancedQuestionCount });
    
    // Start bulk generation mode for multiple questions
    if (advancedQuestionCount > 1) {
      startBulkGeneration();
    }
    
    try {
      const existingTerms = questions.map(q => q.tags).flat();
      const newQuestions = [];
      
      for (let i = 0; i < advancedQuestionCount; i++) {
        setGenerationProgress({ current: i + 1, total: advancedQuestionCount });
        
        try {
          const response = await generateAIQuestion(
            advancedOptions.topic || 'general CISSP concepts', 
            advancedOptions, 
            existingTerms,
            advancedQuestionCount > 1
          );
          
          // Handle rate limiting
          if (response.rateLimited) {
            setRateLimitError(response.error || 'Rate limit exceeded');
            setWaitTime(response.waitTime || 60000);
            break;
          }
          
          if (response.question) {
            const newQuestion = {
              ...response.question,
              createdBy: currentUser.id,
              isActive: true,
              tags: [...response.question.tags, 'ai-generated'] // Add ai-generated tag
            };
            
            // Add to database via the hook
            const addedQuestion = await onAddQuestion(newQuestion);
            if (addedQuestion) {
              newQuestions.push(addedQuestion);
            }
            
            // Add a smaller delay between requests for bulk generation
            if (i < advancedQuestionCount - 1) {
              const delay = advancedQuestionCount > 1 ? 500 : 1000; // Shorter delay for bulk generation
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } catch (error: any) {
          console.error(`Error generating advanced question ${i + 1}:`, error);
          
          // Check if it's a rate limit error
          if (error.message.includes('Rate limit') || error.message.includes('wait')) {
            setRateLimitError(error.message);
            setWaitTime(60000);
            break;
          }
          
          // Continue with remaining questions even if one fails
        }
      }
      
      // Update usage info after generation
      setUsageInfo(getAIUsageInfo());
      
      if (newQuestions.length > 0) {
        setRecentlyAdded(prev => [...newQuestions, ...prev.slice(0, 20)]); // Keep last 20 recently added
        setSavedBannerCount(newQuestions.length);
        setShowSavedBanner(true);
        setTimeout(() => setShowSavedBanner(false), 3500);
        
        // Auto-navigate to Question Bank after successful generation
        setTimeout(() => {
          handleNavigateToQuestionBank();
        }, 1500); // 1.5 second delay to show success message
        
        // Clear recently added after 10 seconds
        setTimeout(() => {
          setRecentlyAdded(prev => prev.filter(q => !newQuestions.includes(q)));
        }, 10000);

        if (!hasActiveSubscription) {
          incrementFreeUsage(newQuestions.length);
        }
      }
    } catch (error: any) {
      console.error('Error in advanced generation:', error);
      if (error.message.includes('Rate limit') || error.message.includes('wait')) {
        setRateLimitError(error.message);
        setWaitTime(60000);
      }
    } finally {
      // End bulk generation mode
      if (advancedQuestionCount > 1) {
        endBulkGeneration();
      }
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedSubcategory(''); // Reset subcategory when domain changes
  };

  const canGenerate = selectedDomain || selectedSubcategory;

  // Calculate per-domain question counts and percentages
  const totalQuestions = questions.length;
  const domainStats = domains.map(domain => {
    const count = questions.filter(q => q.domain === domain).length;
    const percent = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
    return { domain, count, percent };
  });

  // Helper to get color for percentage
  function getPercentColor(percent: number) {
    if (percent < 10) return 'text-red-600';
    if (percent < 25) return 'text-orange-500';
    return 'text-green-600';
  }

  if (subscriptionLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Loader className="w-8 h-8 text-purple-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Generator</h3>
        <p className="text-gray-600">Checking your subscription status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 relative">
      {/* Subscription Status Banner */}
      {!hasActiveSubscription && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unlock AI Question Generation</h3>
                <p className="text-gray-600 text-sm">
                  Subscribe to generate unlimited CISSP practice questions with advanced AI
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgradeClick}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Rate Limit Warning */}
      {rateLimitError && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">Rate Limit Reached</h3>
          </div>
          <p className="text-orange-800 mb-3">{rateLimitError}</p>
          {waitTime > 0 && (
            <div className="flex items-center space-x-2 text-orange-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                Next request available in: {formatTimeRemaining(waitTime)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Usage Statistics */}
      {hasActiveSubscription && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI Usage Statistics</h3>
            {usageInfo.isBulkGeneration && (
              <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800">Bulk Generation Mode</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Daily Usage</span>
                <span className="text-xs text-blue-600">
                  {usageInfo.daily.used}/{usageInfo.daily.limit}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, usageInfo.daily.percentage)}%` }}
                />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Hourly Usage</span>
                <span className="text-xs text-green-600">
                  {usageInfo.hourly.used}/{usageInfo.hourly.limit}
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, usageInfo.hourly.percentage)}%` }}
                />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">Per Minute</span>
                <span className="text-xs text-purple-600">
                  {usageInfo.minute.used}/{usageInfo.minute.limit}
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, usageInfo.minute.percentage)}%` }}
                />
              </div>
            </div>
          </div>
          
          {usageInfo.nextRequestAllowed > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Next request available in: {formatTimeRemaining(usageInfo.nextRequestAllowed)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header - Only show if not dismissed */}
      {!isInfoCardDismissed && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 relative">
          {/* Dismiss Button */}
          <button
            onClick={handleDismissInfoCard}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss this information card"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-4 pr-8">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Question Generator</h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {hasActiveSubscription 
                  ? 'Generate high-quality CISSP practice questions and save them to your database'
                  : 'Premium feature - Subscribe to unlock unlimited AI question generation'
                }
              </p>
            </div>
            {hasActiveSubscription && (
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Crown className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Premium</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className={`flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg ${!hasActiveSubscription ? 'opacity-50' : ''}`}>
              <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Smart Generation</p>
                <p className="text-xs text-gray-600">AI avoids duplicate concepts</p>
              </div>
              {!hasActiveSubscription && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
            <div className={`flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg ${!hasActiveSubscription ? 'opacity-50' : ''}`}>
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Auto-Save to Database</p>
                <p className="text-xs text-gray-600">Questions automatically saved</p>
              </div>
              {!hasActiveSubscription && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
            <div className={`flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg ${!hasActiveSubscription ? 'opacity-50' : ''}`}>
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Detailed Explanations</p>
                <p className="text-xs text-gray-600">Comprehensive answer explanations</p>
              </div>
              {!hasActiveSubscription && <Lock className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Recently Added Questions Notification */}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlock AI Question Generation</h3>
              <p className="text-gray-600 mb-6">
                Subscribe to generate unlimited CISSP practice questions with advanced AI customization options.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited question generation</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Advanced customization options</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">All 8 CISSP domains covered</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Cancel anytime</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgradeClick}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {showSavedBanner && (
        <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl shadow-lg flex items-center space-x-3 animate-fade-in pointer-events-auto">
            <CheckCircle className="w-6 h-6 text-white" />
            <span className="font-semibold">
              {savedBannerCount > 1
                ? `${savedBannerCount} questions saved!`
                : 'Question saved!'}
            </span>
          </div>
        </div>
      )}

      {/* Generation Controls Section (Quick + Advanced) */}
      <div className="relative">
        {/* Overlay for unsubscribed users who hit the limit */}
        {!hasActiveSubscription && freeUsed >= FREE_LIMIT && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur rounded-xl">
            <Lock className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-blue-800 font-semibold mb-2 text-center">You’ve used your 3 free AI generations this week.</p>
            <p className="text-gray-600 text-sm mb-4 text-center">Upgrade to unlock unlimited AI question generation and more.</p>
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow"
              onClick={handleUpgradeClick}
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* Quick Generator Controls */}
        <div className={hasActiveSubscription ? '' : 'pointer-events-none opacity-60 select-none'}>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span>Quick Generator</span>
              {!hasActiveSubscription && (
                <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                  <Lock className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-800">Premium</span>
                </div>
              )}
            </h3>

            <div className="space-y-6">
              {/* Domain Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select CISSP Domain
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {domainStats.map(({ domain, percent, count }) => (
                    <button
                      key={domain}
                      onClick={() => hasActiveSubscription ? handleDomainSelect(domain) : setShowUpgradeModal(true)}
                      className={`text-left p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-start ${
                        !hasActiveSubscription 
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : selectedDomain === domain
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                      }`}
                      disabled={!hasActiveSubscription}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="font-medium text-sm mb-1 flex items-center gap-2">
                          {domain}
                          <span className={`ml-2 text-xs font-normal ${getPercentColor(percent)}`}>{percent}%</span>
                          <span className="ml-1 text-xs text-gray-400">({count})</span>
                        </div>
                        {!hasActiveSubscription && <Lock className="w-4 h-4" />}
                      </div>
                      <div className="text-xs opacity-75">
                        {domainSubcategories[domain as keyof typeof domainSubcategories].length} subcategories
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory Selection */}
              {selectedDomain && hasActiveSubscription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Subcategory from {selectedDomain}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {domainSubcategories[selectedDomain as keyof typeof domainSubcategories].map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => setSelectedSubcategory(subcategory)}
                        className={`text-left p-3 rounded-lg border transition-all duration-200 text-sm ${
                          selectedSubcategory === subcategory
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Selection Display */}
              {canGenerate && hasActiveSubscription && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Ready to Generate</span>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>Topic:</strong> {getCurrentTopic()}
                  </p>
                  {selectedDomain && (
                    <p className="text-xs text-green-600 mt-1">
                      <strong>Domain:</strong> {selectedDomain}
                    </p>
                  )}
                  <p className="text-xs text-green-600 mt-2">
                    ✨ Questions will be automatically saved to your secure database
                  </p>
                </div>
              )}

              {/* Generation Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Generate & Save Questions:</span>
                  {isGenerating && generationProgress.total > 1 && (
                    <span className="text-xs text-purple-600">
                      Generating {generationProgress.current} of {generationProgress.total}...
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Single Question */}
                  <button
                    onClick={() => checkSubscriptionAndProceed(() => handleQuickGenerate(1))}
                    disabled={(!canGenerate && hasActiveSubscription) || isGenerating || !!rateLimitError}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${
                      !hasActiveSubscription
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : rateLimitError
                        ? 'border-orange-200 bg-orange-50 text-orange-400 cursor-not-allowed'
                        : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      hasActiveSubscription && !rateLimitError ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <span className={`font-bold text-sm ${
                        hasActiveSubscription && !rateLimitError ? 'text-purple-600' : 'text-gray-400'
                      }`}>1</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Single</span>
                    <span className="text-xs text-gray-600">Question</span>
                    {!hasActiveSubscription && <Lock className="w-3 h-3 mt-1" />}
                  </button>

                  {/* 5 Questions */}
                  <button
                    onClick={() => checkSubscriptionAndProceed(() => handleQuickGenerate(5))}
                    disabled={(!canGenerate && hasActiveSubscription) || isGenerating || !!rateLimitError}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${
                      !hasActiveSubscription
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : rateLimitError
                        ? 'border-orange-200 bg-orange-50 text-orange-400 cursor-not-allowed'
                        : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      hasActiveSubscription && !rateLimitError ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <span className={`font-bold text-sm ${
                        hasActiveSubscription && !rateLimitError ? 'text-blue-600' : 'text-gray-400'
                      }`}>5</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Quick</span>
                    <span className="text-xs text-gray-600">Set</span>
                    {!hasActiveSubscription && <Lock className="w-3 h-3 mt-1" />}
                  </button>

                  {/* 10 Questions */}
                  <button
                    onClick={() => checkSubscriptionAndProceed(() => handleQuickGenerate(10))}
                    disabled={(!canGenerate && hasActiveSubscription) || isGenerating || !!rateLimitError}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 ${
                      !hasActiveSubscription
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : rateLimitError
                        ? 'border-orange-200 bg-orange-50 text-orange-400 cursor-not-allowed'
                        : 'border-green-200 hover:border-green-400 hover:bg-green-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      hasActiveSubscription && !rateLimitError ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className={`font-bold text-sm ${
                        hasActiveSubscription && !rateLimitError ? 'text-green-600' : 'text-gray-400'
                      }`}>10</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Full</span>
                    <span className="text-xs text-gray-600">Set</span>
                    {!hasActiveSubscription && <Lock className="w-3 h-3 mt-1" />}
                  </button>

                  {/* Loading State */}
                  {isGenerating && hasActiveSubscription && (
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <Loader className="w-6 h-6 text-gray-600 animate-spin mb-2" />
                      <span className="text-sm font-medium text-gray-600">Generating...</span>
                      {generationProgress.total > 1 && (
                        <span className="text-xs text-gray-500">
                          {generationProgress.current}/{generationProgress.total}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Help Text */}
              {!canGenerate && hasActiveSubscription && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-yellow-800">Select a domain to generate questions</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Choose a domain and optionally a subcategory to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Generator Controls */}
        <div className={hasActiveSubscription ? '' : 'pointer-events-none opacity-60 select-none'}>
          <div className="bg-white rounded-xl shadow-lg">
            <div 
              className="p-4 sm:p-6 cursor-pointer"
              onClick={() => hasActiveSubscription ? setShowAdvanced(!showAdvanced) : setShowUpgradeModal(true)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>🎯 Advanced Generator Options</span>
                  {!hasActiveSubscription && (
                    <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-full">
                      <Lock className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-800">Premium</span>
                    </div>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  {hasActiveSubscription ? (
                    showAdvanced ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              {!showAdvanced && (
                <p className="text-sm text-gray-600 mt-2">
                  {hasActiveSubscription 
                    ? 'Configure detailed options for question generation including domain, difficulty, and question type'
                    : 'Premium feature - Subscribe to access advanced generation options'
                  }
                </p>
              )}
            </div>

            {showAdvanced && hasActiveSubscription && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200">
                <div className="space-y-6 pt-6">
                  {/* Question Count Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Number of Questions to Generate
                    </label>
                    <div className="flex space-x-3">
                      {[1, 5, 10].map((count) => (
                        <button
                          key={count}
                          onClick={() => setAdvancedQuestionCount(count as 1 | 5 | 10)}
                          className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all duration-200 ${
                            advancedQuestionCount === count
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                            advancedQuestionCount === count
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className="text-xs font-bold">{count}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {count === 1 ? 'Single' : count === 5 ? 'Quick' : 'Full'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                      <select
                        value={advancedOptions.domain}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, domain: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        {domains.map(domain => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={advancedOptions.difficulty}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                    <div className="grid grid-cols-1 gap-3">
                      {questionTypes.map(type => (
                        <label key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="questionType"
                            value={type.value}
                            checked={advancedOptions.questionType === type.value}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, questionType: e.target.value as any }))}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{type.label}</p>
                            <p className="text-xs text-gray-600">{type.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Focus</label>
                    <div className="grid grid-cols-1 gap-3">
                      {scenarioTypes.map(type => (
                        <label key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="scenarioType"
                            value={type.value}
                            checked={advancedOptions.scenarioType === type.value}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, scenarioType: e.target.value as any }))}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{type.label}</p>
                            <p className="text-xs text-gray-600">{type.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area (Optional)</label>
                      <input
                        type="text"
                        value={advancedOptions.focusArea}
                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, focusArea: e.target.value }))}
                        placeholder="e.g., quarantine procedures, remediation"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="includeDistractors"
                      checked={advancedOptions.includeDistractors}
                      onChange={(e) => setAdvancedOptions(prev => ({ ...prev, includeDistractors: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="includeDistractors" className="text-sm text-gray-700">
                      Include strong distractors that test common misconceptions
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ✨ Generated questions will be automatically saved to your secure database with the "ai-generated" tag
                    </p>
                  </div>

                  <button
                    onClick={handleAdvancedGenerate}
                    disabled={isGenerating || !!rateLimitError}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                  >
                    {isGenerating ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )}
                    <span>
                      {isGenerating 
                        ? `Generating ${advancedQuestionCount} Question${advancedQuestionCount > 1 ? 's' : ''}...` 
                        : `Generate & Save ${advancedQuestionCount} Question${advancedQuestionCount > 1 ? 's' : ''}`
                      }
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};