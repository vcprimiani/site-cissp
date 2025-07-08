import React, { useState } from 'react';
import { Question } from '../../types';
import { Database, Plus, Search, Filter, BookOpen, Loader, Bookmark, Lock, Crown } from 'lucide-react';
import { QuestionCard } from '../UI/QuestionCard';
import { ColorKey } from '../UI/ColorKey';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useSubscription } from '../../hooks/useSubscription';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';

interface QuestionBankProps {
  questions: Question[];
  loading: boolean;
  currentUser: any;
  onAddQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => Promise<Question | null>;
  onUpdateQuestion: (questionId: string, updates: Partial<Question>) => Promise<boolean>;
  onDeleteQuestion: (questionId: string) => Promise<boolean>;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  loading,
  currentUser,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  hasActiveSubscription,
  subscriptionLoading
}) => {
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

  const { bookmarkedIds } = useBookmarks();
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

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
  const filteredQuestions = showBookmarksOnly
    ? questions.filter(q => bookmarkedIds.includes(q.id))
    : questions.filter(q => {
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

  // Calculate per-domain question counts and percentages
  const domainStats = domains.map(domain => {
    const count = questions.filter(q => q.domain === domain).length;
    const percent = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
    return { domain, count, percent };
  });

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
              className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium shadow-sm transition-colors ${showBookmarksOnly ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} ${!hasActiveSubscription ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={() => hasActiveSubscription ? setShowBookmarksOnly(v => !v) : null}
              aria-pressed={showBookmarksOnly}
              disabled={!hasActiveSubscription}
              title={!hasActiveSubscription ? 'Subscribe to unlock bookmarks' : ''}
            >
              <Bookmark className={`w-5 h-5 mr-1 ${showBookmarksOnly ? 'fill-blue-400 text-blue-700' : 'text-gray-400'}`} fill={showBookmarksOnly ? 'currentColor' : 'none'} />
              {showBookmarksOnly ? 'Bookmarked' : 'Show Bookmarks'}
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-800">
                {bookmarkedIds.length}
              </span>
              {!hasActiveSubscription && <Lock className="w-4 h-4 ml-2 text-gray-400" />}
            </button>
            <button
              className="inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium shadow-sm bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed opacity-60"
              disabled
              title="Add Question is a premium feature. Subscribe to unlock."
            >
              <Plus className="w-5 h-5 mr-1" />
              Add Question
              {!hasActiveSubscription && <Lock className="w-4 h-4 ml-2 text-yellow-500" />}
            </button>
          </div>
        </div>
        {/* Paywall Banner for Unsubscribed Users */}
        {!hasActiveSubscription && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">Unlock Full Question Bank Features</h3>
                <p className="text-gray-600 text-sm">Subscribe to add, edit, delete, and bookmark questions. Organize your study and track your progress.</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const product = stripeProducts[0];
                await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow"
            >
              Upgrade Now
            </button>
          </div>
        )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          {/* Remove domain dropdown, keep difficulty dropdown and stats */}
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
        {/* Domain Pills Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${!filterDomain ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            onClick={() => setFilterDomain('')}
          >
            All Domains <span className="ml-2 text-xs font-normal">{totalQuestions}</span>
          </button>
          {domainStats.map(({ domain, count }) => (
            <button
              key={domain}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors flex items-center space-x-2 ${filterDomain === domain ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
              onClick={() => setFilterDomain(domain)}
            >
              <span>{domain}</span>
              <span className="ml-1 text-xs text-gray-400">({count})</span>
            </button>
          ))}
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
              showActions={hasActiveSubscription}
              hasActiveSubscription={hasActiveSubscription}
              subscriptionLoading={subscriptionLoading}
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
                  <li>• Use the color key to understand the visual organization</li>
                  <li>• Questions are automatically saved to your secure database</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

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