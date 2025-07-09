import React, { useState, useMemo } from 'react';
import { Brain, MessageCircle, Sparkles, CheckCircle, Loader } from 'lucide-react';
import { generateAIResponse } from '../../services/openai';

interface AIAssistantProps {
  onAskQuestion: (question: string) => void;
  incorrectQuestions?: any[];
}

// Helper to summarize a question (first sentence or up to 10 words)
function summarizeQuestion(text: string): string {
  if (!text) return '';
  // Try to get the first sentence
  const firstSentence = text.split(/[.!?]/)[0];
  if (firstSentence.length <= 50) return firstSentence.trim();
  // Otherwise, get the first 10 words
  const words = text.split(' ');
  return words.slice(0, 10).join(' ').trim() + (words.length > 10 ? '...' : '');
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onAskQuestion, incorrectQuestions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');

  // Dynamic topics that rotate based on incorrect questions
  const dynamicTopics = useMemo(() => {
    const baseTopics = [
      "What is authentication?",
      "What is authorization?",
      "What is encryption?",
      "What is a firewall?",
      "What is a virus?",
      "What is a password?",
      "What is a backup?",
      "What is a network?",
      "What is a server?",
      "What is a client?",
      "What is a database?",
      "What is a patch?"
    ];

    // If we have incorrect questions, create dynamic topics from them
    if (incorrectQuestions.length > 0) {
      const incorrectTopics = incorrectQuestions.slice(0, 6).map(q => ({
        question: `I got this wrong: "${q.question}". The correct answer is "${q.options[q.correctAnswer]}". Can you explain why this is right?`,
        displayText: summarizeQuestion(q.question),
        isIncorrect: true
      }));

      // Mix incorrect questions with base topics
      const mixedTopics = [...incorrectTopics, ...baseTopics.slice(0, 6).map(topic => ({
        question: topic,
        displayText: topic,
        isIncorrect: false
      }))];
      return mixedTopics.sort(() => Math.random() - 0.5).slice(0, 12);
    }

    return baseTopics.map(topic => ({
      question: topic,
      displayText: topic,
      isIncorrect: false
    }));
  }, [incorrectQuestions]);

  const handleAskCasey = async (question: string) => {
    setLoading(true);
    setLastQuestion(question);
    setResponse('');
    
    try {
      const simplePrompt = `Explain this in very simple terms that a third grader could understand: ${question}

Keep your answer:
- Under 3 sentences
- Use simple words
- Give one real example
- Be encouraging and helpful`;

      const result = await generateAIResponse(simplePrompt);
      setResponse(result.content);
    } catch (error) {
      setResponse("Sorry, I'm having trouble right now. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleIncorrectQuestion = async (question: any) => {
    const simpleQuestion = `I got this question wrong: "${question.question}". The correct answer is "${question.options[question.correctAnswer]}". Can you explain why this is the right answer in simple terms?`;
    await handleAskCasey(simpleQuestion);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Casey: Cybersecurity Study Expert</h2>
            <p className="text-gray-600">Your friendly AI mentor for all things security</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        {/* Response Display */}
        {response && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Casey's Answer</span>
            </div>
            <p className="text-gray-800 leading-relaxed">{response}</p>
          </div>
        )}
        {/* Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Ask Casey anything about cybersecurity..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                handleAskCasey(e.currentTarget.value.trim());
                e.currentTarget.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (input?.value.trim()) {
                handleAskCasey(input.value.trim());
                input.value = '';
              }
            }}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Quick Questions/Topics */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Quick Feedback</span>
          {incorrectQuestions.length > 0 && (
            <span className="text-sm text-gray-500">(Includes your mistakes)</span>
          )}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {dynamicTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleAskCasey(topic.question)}
              disabled={loading}
              className={`p-3 text-left rounded-xl transition-all duration-200 disabled:opacity-50 text-sm font-medium shadow-sm hover:shadow-md border-2 ${
                topic.isIncorrect 
                  ? 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-700 hover:text-red-800'
                  : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700'
              }`}
            >
              {topic.displayText}
            </button>
          ))}
        </div>
      </div>

      {/* Review Mistakes Section */}
      {incorrectQuestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Review All Mistakes ({incorrectQuestions.length})</span>
          </h2>
          <div className="space-y-3">
            {incorrectQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleIncorrectQuestion(question)}
                disabled={loading}
                className="w-full p-4 text-left bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {question.question}
                </p>
                <p className="text-xs text-red-600">
                  {question.options && question.options[question.correctAnswer] ? `Correct: ${question.options[question.correctAnswer]}` : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips/Features Section */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">💡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Casey Tips & Features</h3>
            <p className="text-gray-600">Get the most out of your AI study assistant</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Simple Explanations</h4>
                <p className="text-sm text-gray-600">Casey breaks down complex topics into easy-to-understand answers.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Quick Feedback</h4>
                <p className="text-sm text-gray-600">Get instant answers to your cybersecurity questions and mistakes.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Personalized Topics</h4>
                <p className="text-sm text-gray-600">Casey adapts to your mistakes and interests for targeted learning.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Mistake Review</h4>
                <p className="text-sm text-gray-600">Easily revisit and learn from your past incorrect answers.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-xs">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Always Available</h4>
                <p className="text-sm text-gray-600">Casey is ready to help 24/7—ask anything, anytime.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 text-xs">6</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Encouraging & Friendly</h4>
                <p className="text-sm text-gray-600">Casey is always positive, supportive, and focused on your growth.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};