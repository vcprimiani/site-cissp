import React, { useState } from 'react';
import { Question } from '../../types';
import { Database, Plus, Search, Filter, BookOpen, Loader, TrendingUp, Target, Award, Calendar } from 'lucide-react';
import { QuestionCard } from '../UI/QuestionCard';
import { ColorKey } from '../UI/ColorKey';
import { ProgressDashboard } from './ProgressDashboard';
import { QuestionListManager } from './QuestionListManager';

interface QuestionBankProps {
  questions: Question[];
  loading: boolean;
  currentUser: any;
  onAddQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => Promise<Question | null>;
  onUpdateQuestion: (questionId: string, updates: Partial<Question>) => Promise<boolean>;
  onDeleteQuestion: (questionId: string) => Promise<boolean>;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  loading,
  currentUser,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'progress' | 'lists'>('questions');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showColorKey, setShowColorKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    tags: ''
  });

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

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = !filterDomain || q.domain === filterDomain;
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty;
    
    return matchesSearch && matchesDomain && matchesDifficulty;
  });

  // Calculate statistics
  const totalQuestions = questions.length;
  const activeQuestions = questions.filter(q => q.isActive).length;
  const aiGeneratedQuestions = questions.filter(q => q.tags.includes('ai-generated')).length;
  const manualQuestions = totalQuestions - aiGeneratedQuestions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const newQuestion: Omit<Question, 'id' | 'createdAt'> = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        createdBy: currentUser.id,
        isActive: true
      };
      
      const result = await onAddQuestion(newQuestion);
      
      if (result) {
        setShowAddForm(false);
        setFormData({
          domain: '',
          difficulty: 'Medium',
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: '',
          tags: ''
        });
      }
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const tabs = [
    { 
      id: 'questions', 
      label: 'Questions', 
      icon: Database,
      description: 'Browse and manage your question collection'
    },
    { 
      id: 'progress', 
      label: 'Progress', 
      icon: TrendingUp,
      description: 'Track your study progress and achievements'
    },
    { 
      id: 'lists', 
      label: 'Lists', 
      icon: BookOpen,
      description: 'Create and manage private question lists'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Questions</h3>
        <p className="text-gray-600">Fetching your question bank from the database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
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
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Question Bank</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Manage and organize your CISSP practice questions (newest first)
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowColorKey(!showColorKey)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                >
                  <span>🎨</span>
                  <span>Color Key</span>
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#F8D380] text-gray-900 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Question Bank Statistics */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{activeQuestions}</div>
                  <div className="text-sm text-gray-600">Active Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{aiGeneratedQuestions}</div>
                  <div className="text-sm text-gray-600">AI Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{manualQuestions}</div>
                  <div className="text-sm text-gray-600">Manual Added</div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Domains</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
              
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              
              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                {filteredQuestions.length} of {totalQuestions} questions
              </div>
            </div>
          </div>

          {/* Color Key */}
          {showColorKey && (
            <ColorKey className="mb-6" />
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  isExpanded={expandedQuestions.has(question.id)}
                  onToggleExpanded={() => toggleQuestionExpanded(question.id)}
                  showActions={false}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {totalQuestions === 0 ? 'No Questions Yet' : 'No Questions Match Your Filters'}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {totalQuestions === 0 
                    ? 'Start building your question bank by adding questions manually or using the AI Generator.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {totalQuestions === 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Getting Started:</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Use the AI Generator tab to create questions automatically</li>
                      <li>• Add questions manually using the "Add Question" button</li>
                      <li>• Click questions to expand and view details</li>
                      <li>• Track your progress in the Progress tab</li>
                      <li>• Create private question lists for focused study</li>
                      <li>• Questions are automatically saved to your secure database</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <ProgressDashboard 
          currentUser={currentUser}
          questions={questions}
        />
      )}

      {activeTab === 'lists' && (
        <QuestionListManager 
          currentUser={currentUser}
          questions={questions}
        />
      )}

      {/* Add Question Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select Domain</option>
                      {domains.map(domain => (
                        <option key={domain} value={domain}>{domain}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Enter the question..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer Options</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === index}
                        onChange={() => setFormData(prev => ({ ...prev, correctAnswer: index }))}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index] = e.target.value;
                          setFormData(prev => ({ ...prev, options: newOptions }));
                        }}
                        required
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Explain why the correct answer is right..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., NAC, Network Security, Quarantine"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#F8D380] text-gray-900 rounded-lg hover:bg-[#F6C95C] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add Question</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};