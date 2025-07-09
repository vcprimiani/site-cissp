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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-100 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Question Bank</h2>
            <p className="text-gray-600">Manage and organize your CISSP practice questions</p>
          </div>
        </div>
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{activeQuestions}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">AI-Generated</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{aiGeneratedQuestions}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">Manual</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{manualQuestions}</div>
          </div>
        </div>
        {/* Per-domain stats (optional, can be a collapsible grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {domainStats.map(ds => (
            <div key={ds.domain} className="bg-gray-50 rounded-lg p-2 text-xs text-gray-700 flex items-center space-x-2">
              <span className="font-semibold">{ds.count}</span>
              <span>{ds.domain}</span>
              <span className="ml-auto text-gray-400">{ds.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Actions & Paywall */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex gap-3">
            <button
              className={`inline-flex items-center px-4 py-2 rounded-xl border-2 text-sm font-semibold shadow-sm transition-all duration-200 ${showBookmarksOnly ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} ${!hasActiveSubscription ? 'opacity-60 cursor-not-allowed' : ''}`}
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
              className="inline-flex items-center px-4 py-2 rounded-xl border-2 text-sm font-semibold shadow-sm bg-green-100 text-green-800 border-green-300 hover:bg-green-200 transition-all duration-200"
              onClick={() => setShowAddForm(true)}
              disabled={!hasActiveSubscription}
            >
              <Plus className="w-5 h-5 mr-1" />
              Add Question
              {!hasActiveSubscription && <Lock className="w-4 h-4 ml-2 text-green-500" />}
            </button>
          </div>
          {/* Paywall Banner for Unsubscribed Users */}
          {!hasActiveSubscription && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between w-full md:w-auto">
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
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200 shadow-sm w-full md:w-auto">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search questions or tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none flex-1 text-sm text-gray-700"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white shadow-sm"
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white shadow-sm"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            {(filterDomain || filterDifficulty || searchTerm) && (
              <button
                onClick={() => { setFilterDomain(''); setFilterDifficulty(''); setSearchTerm(''); }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ColorKey Legend */}
        <div className="mb-6">
          <button
            onClick={() => setShowColorKey(v => !v)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all duration-200 font-medium text-sm mb-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>Show Color Key</span>
          </button>
          {showColorKey && <ColorKey />}
        </div>

        {/* Question List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              isExpanded={expandedQuestions.has(q.id)}
              onToggleExpanded={() => toggleQuestionExpanded(q.id)}
              onDelete={hasActiveSubscription ? () => onDeleteQuestion(q.id) : undefined}
              showActions={hasActiveSubscription}
              hasActiveSubscription={hasActiveSubscription}
              subscriptionLoading={subscriptionLoading}
            />
          ))}
          {filteredQuestions.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips/Features Section */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">💡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Question Bank Tips & Features</h3>
            <p className="text-gray-600">Organize, filter, and master your study questions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Powerful Search</h4>
                <p className="text-sm text-gray-600">Quickly find questions by keyword, tag, domain, or difficulty.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Bookmark Favorites</h4>
                <p className="text-sm text-gray-600">Save important questions for quick access and review.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">AI-Generated Content</h4>
                <p className="text-sm text-gray-600">Mix your own questions with AI-generated ones for variety.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Domain Coverage</h4>
                <p className="text-sm text-gray-600">See your strengths and gaps across all CISSP domains.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-xs">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Easy Editing</h4>
                <p className="text-sm text-gray-600">Edit, expand, or remove questions to keep your bank up to date.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 text-xs">6</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Premium Experience</h4>
                <p className="text-sm text-gray-600">Enjoy a beautiful, fast, and intuitive interface for all your study needs.</p>
              </div>
            </div>
          </div>
        </div>
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