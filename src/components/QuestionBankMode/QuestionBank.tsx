import React, { useState, useMemo } from 'react';
import { Question } from '../../types';
import { Search, Filter, BookOpen, Crown, Lock, Plus, Minus, Loader } from 'lucide-react';
import { QuestionCard } from '../UI/QuestionCard';
import { ColorKey } from '../UI/ColorKey';
import { useBookmarks } from '../../hooks/useBookmarks';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';

interface QuestionBankProps {
  questions: Question[];
  loading: boolean;
  currentUser: any;
  onUpdateQuestion: (questionId: string, updates: Partial<Question>) => Promise<boolean>;
  onDeleteQuestion: (questionId: string) => Promise<boolean>;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  loading,
  currentUser,
  onUpdateQuestion,
  onDeleteQuestion,
  hasActiveSubscription,
  subscriptionLoading
}: QuestionBankProps) => {
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showColorKey, setShowColorKey] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q: Question) => {
      // Search filter
      const searchMatch = !searchTerm || 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      // Difficulty filter
      const difficultyMatch = !filterDifficulty || q.difficulty === filterDifficulty;
      // Bookmark filter
      const bookmarkMatch = !showBookmarksOnly || bookmarkedIds.includes(q.id);
      return searchMatch && difficultyMatch && bookmarkMatch;
    });
  }, [questions, searchTerm, filterDifficulty, showBookmarksOnly, bookmarkedIds]);

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading questions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 flex-1">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Questions</p>
                <p className="text-2xl font-bold text-blue-900">{questions.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Bookmarked</p>
                <p className="text-2xl font-bold text-purple-900">{bookmarkedIds.length}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className="inline-flex items-center px-4 py-2 rounded-xl border-2 text-sm font-semibold shadow-sm bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 transition-all duration-200"
          >
            <Crown className="w-5 h-5 mr-1" />
            {showBookmarksOnly ? 'Bookmarked' : 'Show Bookmarks'}
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-800">
              {bookmarkedIds.length}
            </span>
            {!hasActiveSubscription && <Lock className="w-4 h-4 ml-2 text-gray-400" />}
          </button>
        </div>
      </div>
      {/* Paywall Banner for Unsubscribed Users - moved below buttons */}
      {!hasActiveSubscription && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 flex items-center justify-between w-full md:w-auto mt-4">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">Unlock Full Question Bank Features</h3>
              <p className="text-gray-600 text-sm">Subscribe to edit, delete, and bookmark questions. Organize your study and track your progress.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const product = stripeProducts[0];
              await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow"
          >
            Start Free Trial
          </button>
        </div>
      )}

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
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white shadow-sm"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          {(filterDifficulty || searchTerm) && (
            <button
              onClick={() => { setFilterDifficulty(''); setSearchTerm(''); }}
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
      <div className="space-y-4">
        {filteredQuestions.map((q: Question) => (
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
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}
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
    </div>
  );
};