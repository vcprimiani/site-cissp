import React, { useState, useEffect } from 'react';
import { Quiz } from './Quiz';
import { AIAssistant as CaseyAssistant } from './AIAssistant';
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
      label: 'Casey (Cybersecurity Study Expert)', 
      icon: Brain,
      description: 'Ask Casey for instant explanations and CISSP help',
      badge: incorrectQuestions.length > 0 ? incorrectQuestions.length : undefined
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
            <CaseyAssistant
              onAskQuestion={(question) => console.log('Casey Question:', question)}
              incorrectQuestions={incorrectQuestions}
            />
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-purple-50 border-2 border-yellow-200 rounded-xl p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                <span className="mr-2">🤖</span> Unlock Casey (Cybersecurity Study Expert)
              </h3>
              <p className="text-gray-700 mb-4 text-base">Get instant explanations, concept clarifications, and CISSP help from Casey, your smart study assistant. Upgrade to premium for unlimited access!</p>
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
              <div className="mt-4 text-sm text-gray-500">Premium unlocks unlimited quizzes, Casey explanations, and more.</div>
            </div>
          )
        )}
      </div>
    </div>
  );
};