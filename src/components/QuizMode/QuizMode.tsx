import React, { useState, useEffect } from 'react';
import { Quiz } from './Quiz';
import { AIAssistant } from './AIAssistant';
import { QuizSetup } from './QuizSetup';
import { AppState } from '../../types';
import { Target, Brain, Clock, Trophy } from 'lucide-react';

interface QuizModeProps {
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const QuizMode: React.FC<QuizModeProps> = ({ appState, onUpdateState, hasActiveSubscription, subscriptionLoading }) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'ai'>('setup');
  const [incorrectQuestions, setIncorrectQuestions] = useState<any[]>([]);
  const [showQuizInfo, setShowQuizInfo] = useState(() => {
    return localStorage.getItem('quiz-info-dismissed') !== 'true';
  });

  // Load incorrect questions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cissp-incorrect-questions');
    if (stored) {
      try {
        setIncorrectQuestions(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading incorrect questions:', error);
      }
    }
  }, []);

  // Listen for quiz completion to update incorrect questions
  useEffect(() => {
    const handleQuizComplete = (event: CustomEvent) => {
      const { incorrectQuestions: newIncorrect } = event.detail;
      if (newIncorrect && newIncorrect.length > 0) {
        setIncorrectQuestions(prev => {
          // Combine with existing, avoiding duplicates
          const combined = [...prev];
          newIncorrect.forEach((newQ: any) => {
            const exists = combined.find(q => q.question === newQ.question);
            if (!exists) {
              combined.push(newQ);
            }
          });
          
          // Keep only the most recent 50 incorrect questions
          const limited = combined.slice(-50);
          localStorage.setItem('cissp-incorrect-questions', JSON.stringify(limited));
          return limited;
        });
      }
    };

    window.addEventListener('quizCompleted', handleQuizComplete as EventListener);
    return () => {
      window.removeEventListener('quizCompleted', handleQuizComplete as EventListener);
    };
  }, []);

  const tabs = [
    { 
      id: 'setup', 
      label: 'Quiz', 
      icon: Target,
      description: 'Take quizzes with scoring and detailed results'
    },
    { 
      id: 'ai', 
      label: 'AI Assistant', 
      icon: Brain,
      description: 'Get instant explanations and concept clarifications',
      badge: incorrectQuestions.length > 0 ? incorrectQuestions.length : undefined
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showQuizInfo && (
        <div className="relative bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8 border border-green-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Quiz Mode</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-700 text-sm font-medium flex items-center"><Clock className="w-4 h-4 mr-1" />Timed Practice</span>
                  <span className="text-green-700 text-sm font-medium flex items-center"><Brain className="w-4 h-4 mr-1" />AI Review</span>
                </div>
              </div>
            </div>
            <div id="quiz-mode-start-buttons" className="flex flex-col sm:flex-row gap-2">
              {/* Start Quiz buttons will be rendered here by QuizSetup */}
            </div>
          </div>
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
            aria-label="Dismiss info card"
            onClick={() => {
              setShowQuizInfo(false);
              localStorage.setItem('quiz-info-dismissed', 'true');
            }}
          >
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors relative group whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'setup' && (
          <QuizSetup 
            onQuizComplete={(incorrectQuestions) => {
              // Dispatch custom event for quiz completion
              const event = new CustomEvent('quizCompleted', {
                detail: { incorrectQuestions }
              });
              window.dispatchEvent(event);
            }}
            hasActiveSubscription={hasActiveSubscription}
            subscriptionLoading={subscriptionLoading}
          />
        )}
        
        {activeTab === 'ai' && (
          hasActiveSubscription ? (
            <AIAssistant
              onAskQuestion={(question) => console.log('AI Question:', question)}
              incorrectQuestions={incorrectQuestions}
            />
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-purple-50 border-2 border-yellow-200 rounded-xl p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <span className="mr-2">🤖</span> Unlock AI Assistant
              </h3>
              <p className="text-gray-700 mb-4 text-base">Get instant explanations, concept clarifications, and more with the AI Assistant. Upgrade to premium for unlimited access!</p>
              <button
                onClick={async () => {
                  const { redirectToCheckout } = await import('../../services/stripe');
                  const { stripeProducts } = await import('../../stripe-config');
                  const product = stripeProducts[0];
                  await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
                }}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-semibold rounded-lg shadow hover:from-yellow-500 hover:to-yellow-400 transition-all text-lg mt-2"
              >
                Upgrade Now
              </button>
              <div className="mt-4 text-sm text-gray-500">Premium unlocks unlimited quizzes, AI explanations, analytics, and more.</div>
            </div>
          )
        )}
      </div>
    </div>
  );
};