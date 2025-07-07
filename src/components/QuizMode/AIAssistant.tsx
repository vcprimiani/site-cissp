import React, { useState } from 'react';
import { Brain, MessageCircle, Sparkles, CheckCircle, Loader } from 'lucide-react';
import { generateAIResponse } from '../../services/openai';

interface AIAssistantProps {
  onAskQuestion: (question: string) => void;
  incorrectQuestions?: any[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onAskQuestion, incorrectQuestions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');

  const simpleTopics = [
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Simple Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ask Casey</h1>
        <p className="text-gray-600">Your friendly cybersecurity helper</p>
      </div>

      {/* Main Chat Area */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
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

        {/* Simple Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Ask Casey anything about cybersecurity..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium flex items-center space-x-2"
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

      {/* Quick Questions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Quick Questions</span>
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {simpleTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleAskCasey(topic)}
              disabled={loading}
              className="p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all disabled:opacity-50 text-sm font-medium text-gray-700 hover:text-blue-700"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Incorrect Questions */}
      {incorrectQuestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Review Mistakes ({incorrectQuestions.length})</span>
          </h2>
          
          <div className="space-y-3">
            {incorrectQuestions.slice(0, 5).map((question, index) => (
              <button
                key={index}
                onClick={() => handleIncorrectQuestion(question)}
                disabled={loading}
                className="w-full p-4 text-left bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all disabled:opacity-50"
              >
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {question.question}
                </p>
                <p className="text-xs text-red-600">
                  Correct: {question.options[question.correctAnswer]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {incorrectQuestions.length === 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="text-center">
            <Brain className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Learn!</h3>
            <p className="text-gray-700 mb-4">
              Take a quiz to get questions for Casey to explain, or ask Casey anything about cybersecurity.
            </p>
            <div className="bg-white rounded-xl p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-2">💡 How it works:</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Take quizzes to find questions for Casey</li>
                <li>• Click any question above to ask Casey</li>
                <li>• Casey explains things in simple terms</li>
                <li>• Learn from your mistakes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};