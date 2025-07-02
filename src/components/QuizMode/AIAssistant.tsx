import React, { useState, useMemo } from 'react';
import { Brain, Lightbulb, BookOpen, Target, AlertCircle, RotateCcw, Loader, CheckCircle } from 'lucide-react';
import { generateAIResponse } from '../../services/openai';

interface AIAssistantProps {
  onAskQuestion: (question: string) => void;
  incorrectQuestions?: any[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onAskQuestion, incorrectQuestions = [] }) => {
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5);
  const [loadingQuestions, setLoadingQuestions] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const quickTopics = [
    {
      title: "Bell-LaPadula Security Model",
      description: "Explain the Bell-LaPadula security model and its key principles",
      category: "Security Models"
    },
    {
      title: "Authentication vs Authorization",
      description: "What is the difference between authentication and authorization in IAM?",
      category: "Identity & Access Management"
    },
    {
      title: "Risk Assessment Framework",
      description: "How does risk assessment work in the CISSP framework?",
      category: "Risk Management"
    },
    {
      title: "Defense in Depth",
      description: "Explain the concept of defense in depth and its implementation",
      category: "Security Architecture"
    },
    {
      title: "Incident Response Process",
      description: "What are the main phases of incident response and their key activities?",
      category: "Security Operations"
    },
    {
      title: "Cryptographic Protocols",
      description: "Explain the differences between symmetric and asymmetric encryption",
      category: "Cryptography"
    },
    {
      title: "Access Control Models",
      description: "Compare and contrast DAC, MAC, and RBAC access control models",
      category: "Access Control"
    },
    {
      title: "Business Continuity Planning",
      description: "What are the key components of a business continuity plan?",
      category: "Business Continuity"
    }
  ];

  // Memoize the quick questions from incorrect answers to prevent recalculation
  const quickQuestionsFromIncorrect = useMemo(() => {
    if (incorrectQuestions.length === 0) return [];

    // Take up to the selected number of questions, randomly selected
    const shuffled = [...incorrectQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(selectedQuestionCount, incorrectQuestions.length));
    
    return selected.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      domain: q.domain,
      difficulty: q.difficulty,
      tags: q.tags
    }));
  }, [incorrectQuestions, selectedQuestionCount]);

  // Enhanced function to format AI responses for better readability
  const formatAIResponse = (text: string): JSX.Element[] => {
    // Clean up the text first
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/\s+/g, ' ')           // Clean multiple spaces
      .trim();

    // Split into sections and format
    const sections = cleanText.split(/\n\s*\n/).filter(section => section.trim());
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      
      // Check if it's a numbered section (1., 2., etc.)
      if (/^\d+\./.test(trimmedSection)) {
        const [title, ...content] = trimmedSection.split(/[:\-]/);
        return (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-purple-800 mb-2 text-sm">
              {title.trim()}
            </h4>
            {content.length > 0 && (
              <div className="text-gray-700 text-sm leading-relaxed pl-4">
                {content.join(':').trim()}
              </div>
            )}
          </div>
        );
      }
      
      // Check if it contains bullet points
      if (trimmedSection.includes('- ') || trimmedSection.includes('• ')) {
        const lines = trimmedSection.split('\n');
        const title = lines[0];
        const bullets = lines.slice(1).filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
        
        return (
          <div key={index} className="mb-4">
            {title && !title.startsWith('-') && !title.startsWith('•') && (
              <h4 className="font-semibold text-purple-800 mb-2 text-sm">{title}</h4>
            )}
            <ul className="space-y-1 pl-4">
              {bullets.map((bullet, bIndex) => (
                <li key={bIndex} className="text-gray-700 text-sm flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">•</span>
                  <span className="leading-relaxed">
                    {bullet.replace(/^[-•]\s*/, '').trim()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      // Regular paragraph - keep it concise
      const sentences = trimmedSection.split(/[.!?]+/).filter(s => s.trim());
      const shortContent = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
      
      return (
        <div key={index} className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {shortContent}
          </p>
        </div>
      );
    });
  };

  const handleGetExplanation = async (topic: string, questionId?: string) => {
    const loadingKey = questionId || topic;
    setLoadingQuestions(prev => new Set([...prev, loadingKey]));
    
    try {
      // Request shorter, more focused responses
      const enhancedTopic = `${topic}

Please provide a concise explanation with:
1. Key concept summary (2-3 sentences)
2. Main points (3-4 bullet points)
3. Real-world application (1-2 sentences)

Keep the response focused and under 200 words.`;

      const response = await generateAIResponse(enhancedTopic);
      setExplanations(prev => ({
        ...prev,
        [loadingKey]: response.content
      }));
    } catch (error) {
      console.error('Error getting AI explanation:', error);
      setExplanations(prev => ({
        ...prev,
        [loadingKey]: 'Sorry, I encountered an error while generating the explanation. Please try again.'
      }));
    } finally {
      setLoadingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  const handleQuickQuestionClick = (quickQ: any) => {
    const questionId = `incorrect-${quickQ.question.substring(0, 50)}`;
    const questionText = `Explain this CISSP question concisely:

Question: ${quickQ.question}
Correct Answer: ${quickQ.options[quickQ.correctAnswer]}
Domain: ${quickQ.domain}

Provide:
1. Why this answer is correct (2 sentences)
2. Common mistakes (2-3 bullet points)
3. Key takeaway (1 sentence)

Keep under 150 words.`;

    handleGetExplanation(questionText, questionId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Learning Assistant</h2>
              <p className="text-xs sm:text-sm text-gray-600">Get concise explanations on CISSP concepts and review mistakes</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>GPT-3.5 Turbo</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Concise Explanations</p>
              <p className="text-xs text-gray-600">Quick, focused answers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Key Points</p>
              <p className="text-xs text-gray-600">Essential concepts only</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Exam Focused</p>
              <p className="text-xs text-gray-600">CISSP-specific insights</p>
            </div>
          </div>
          {incorrectQuestions.length > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Mistake Review</p>
                <p className="text-xs text-gray-600">Learn from errors</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Incorrect Questions */}
      {incorrectQuestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-red-600" />
              <span>Review Incorrect Questions</span>
            </h3>
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600">Show:</label>
              <select
                value={selectedQuestionCount}
                onChange={(e) => setSelectedQuestionCount(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={1}>1</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {incorrectQuestions.length} questions answered incorrectly
              </span>
            </div>
            <p className="text-xs text-red-700">
              Get focused explanations to understand your mistakes and learn the correct concepts.
            </p>
          </div>
          
          {quickQuestionsFromIncorrect.length > 0 && (
            <div className="space-y-4">
              {quickQuestionsFromIncorrect.map((q, index) => {
                const questionId = `incorrect-${q.question.substring(0, 50)}`;
                const isLoading = loadingQuestions.has(questionId);
                const explanation = explanations[questionId];
                
                return (
                  <div
                    key={`${q.question.substring(0, 50)}-${index}`}
                    className="border border-red-200 rounded-lg p-4 bg-red-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">
                          {q.question}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {q.domain}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        
                        {/* Show correct answer */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <span className="font-medium text-green-800 text-sm">Correct Answer: </span>
                          <span className="text-green-700 text-sm">{q.options[q.correctAnswer]}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleQuickQuestionClick(q)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex-shrink-0"
                      >
                        {isLoading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {isLoading ? 'Getting...' : 'Explain'}
                        </span>
                      </button>
                    </div>
                    
                    {/* AI Explanation */}
                    {explanation && (
                      <div className="bg-white border border-purple-200 rounded-lg p-4 mt-3">
                        <div className="flex items-center space-x-2 mb-3">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-purple-900 text-sm">AI Explanation</span>
                        </div>
                        <div className="max-w-none">
                          {formatAIResponse(explanation)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CISSP Topic Explanations */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <span>CISSP Topic Explanations</span>
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Get concise explanations on key CISSP concepts. Click any topic for a focused AI explanation.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickTopics.map((topic, index) => {
            const isLoading = loadingQuestions.has(topic.title);
            const explanation = explanations[topic.title];
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{topic.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{topic.category}</p>
                    <p className="text-xs text-gray-700 line-clamp-2">{topic.description}</p>
                  </div>
                  <button
                    onClick={() => handleGetExplanation(topic.description, topic.title)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Brain className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">
                      {isLoading ? 'Getting...' : 'Explain'}
                    </span>
                  </button>
                </div>
                
                {/* AI Explanation */}
                {explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-3 h-3 text-blue-600" />
                      <span className="font-medium text-blue-900 text-xs">AI Explanation</span>
                    </div>
                    <div className="max-w-none">
                      {formatAIResponse(explanation)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Getting Started */}
      {incorrectQuestions.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="text-center">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Learn!</h3>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Take a quiz to get personalized explanations for questions you answer incorrectly, 
              or explore CISSP topics using the explanations above.
            </p>
            <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-2">💡 How it works:</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Take quizzes to identify knowledge gaps</li>
                <li>• Incorrect answers automatically appear here for review</li>
                <li>• Get concise AI explanations tailored to your mistakes</li>
                <li>• Explore general CISSP topics anytime</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};