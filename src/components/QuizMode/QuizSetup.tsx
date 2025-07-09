import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Target, Play, ArrowLeft, ArrowRight, Clock, X, Settings, Filter, RotateCcw, Calendar, RefreshCw, Bookmark } from 'lucide-react';
import { Quiz } from './Quiz';
import { QuizResults } from './QuizResults';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { useQuestions } from '../../hooks/useQuestions';
import { useSessionTracker } from '../../hooks/useSessionTracker';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';
import { useBookmarks } from '../../hooks/useBookmarks';
import { getLocalDailyQuizQuestions } from '../../services/dailyQuiz';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';

interface QuizSetupProps {
  onQuizComplete?: (incorrectQuestions: Question[]) => void;
}

interface QuizSession {
  questions: Question[];
  currentIndex: number;
  startTime: Date;
  isActive: boolean;
}

interface QuizResults {
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  questionResults: {
    question: Question;
    userAnswer: number | null;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

type QuizMode = 'setup' | 'quiz' | 'results';

export const QuizSetup: React.FC<QuizSetupProps & { hasActiveSubscription: boolean; subscriptionLoading: boolean }> = ({ onQuizComplete, hasActiveSubscription, subscriptionLoading }) => {
  const { questions, loading } = useQuestions();
  const { 
    getAvailableQuestions, 
    markQuestionsAsUsed, 
    resetSession, 
    getSessionStats 
  } = useSessionTracker();
  const { hasPersistedQuiz, persistedState, clearPersistedState } = useQuizPersistence();
  const { bookmarkedIds, loading: bookmarksLoading } = useBookmarks();
  
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('setup');
  const [showSettings, setShowSettings] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [dailyQuizQuestions, setDailyQuizQuestions] = useState<Question[] | null>(null);
  const [dailyQuizLoading, setDailyQuizLoading] = useState(false);
  const [dailyQuizError, setDailyQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasActiveSubscription && !subscriptionLoading) {
      setDailyQuizLoading(true);
      // fetchDailyQuizQuestionIds()
      //   .then(ids => fetchQuestionsByIds(ids))
      //   .then(qs => setDailyQuizQuestions(qs))
      //   .catch(err => setDailyQuizError(err.message || 'Failed to load daily quiz'))
      //   .finally(() => setDailyQuizLoading(false));
    }
  }, [hasActiveSubscription, subscriptionLoading]);

  // Get session statistics
  const sessionStats = getSessionStats();
  
  // Get available questions (excluding those used in this session)
  const availableQuestions = getAvailableQuestions(questions);
  
  // Get all available tags from available questions
  const allTags = Array.from(new Set(availableQuestions.flatMap(q => q.tags))).sort();
  
  // Filter questions based on selected tags
  const filteredQuestions = selectedTags.length > 0 
    ? availableQuestions.filter(q => q.isActive && selectedTags.some(tag => q.tags.includes(tag)))
    : availableQuestions.filter(q => q.isActive);

  const generateQuiz = () => {
    if (filteredQuestions.length === 0) return;
    
    const questionsToUse = Math.min(numberOfQuestions, filteredQuestions.length);
    const shuffledQuestions = [...filteredQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, questionsToUse);

    // Mark these questions as used in the session
    markQuestionsAsUsed(shuffledQuestions);

    setQuizSession({
      questions: shuffledQuestions,
      currentIndex: 0,
      startTime: new Date(),
      isActive: true
    });
    setQuizMode('quiz');
  };

  const resumeQuiz = () => {
    if (hasPersistedQuiz() && persistedState) {
      setQuizSession({
        questions: persistedState.questions,
        currentIndex: persistedState.currentIndex,
        startTime: new Date(persistedState.startTime),
        isActive: true
      });
      setQuizMode('quiz');
    }
  };

  const discardPersistedQuiz = () => {
    clearPersistedState();
  };

  const exitQuiz = () => {
    setQuizSession(null);
    setQuizMode('setup');
    setQuizResults(null);
  };

  const handleQuizComplete = (results: QuizResults) => {
    setQuizResults(results);
    setQuizMode('results');
    
    // Extract incorrect questions and notify parent
    const incorrectQuestions = results.questionResults
      .filter(result => !result.isCorrect)
      .map(result => result.question);
    
    if (onQuizComplete && incorrectQuestions.length > 0) {
      onQuizComplete(incorrectQuestions);
    }
  };

  const retakeQuiz = () => {
    if (quizSession) {
      // Shuffle the same questions again
      const shuffledQuestions = [...quizSession.questions]
        .sort(() => Math.random() - 0.5);
      
      setQuizSession({
        questions: shuffledQuestions,
        currentIndex: 0,
        startTime: new Date(),
        isActive: true
      });
      setQuizMode('quiz');
      setQuizResults(null);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleResetSession = () => {
    if (confirm('Are you sure you want to reset the session? This will clear all used questions and allow them to appear in future quizzes.')) {
      resetSession();
    }
  };

  const formatSessionDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Add this function to start a quiz from bookmarks
  const startQuizFromBookmarks = () => {
    const bookmarkedQuestions = questions.filter(q => bookmarkedIds.includes(q.id));
    if (bookmarkedQuestions.length === 0) return;
    const questionsToUse = Math.min(numberOfQuestions, bookmarkedQuestions.length);
    const shuffledQuestions = [...bookmarkedQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, questionsToUse);
    markQuestionsAsUsed(shuffledQuestions);
    setQuizSession({
      questions: shuffledQuestions,
      currentIndex: 0,
      startTime: new Date(),
      isActive: true
    });
    setQuizMode('quiz');
  };

  // Quiz Mode
  if (!hasActiveSubscription && !subscriptionLoading) {
    // Unpaid user: show daily quiz only
    const dailyQuizQuestions = getLocalDailyQuizQuestions(questions);
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Daily Quiz</h3>
          <p className="text-gray-600">Fetching your free daily practice quiz...</p>
        </div>
      );
    }
    if (dailyQuizQuestions.length === 3) {
      return (
        <div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Free Daily Practice Quiz</h3>
              <p className="text-gray-600 text-sm">Enjoy your complimentary 3-question quiz! Upgrade to unlock unlimited quizzes, analytics, and more.</p>
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
          <Quiz
            questions={dailyQuizQuestions}
            onComplete={onQuizComplete}
            onExit={() => window.location.reload()}
          />
        </div>
      );
    }
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Daily Quiz Available</h3>
        <p className="text-gray-600">Please add more questions to the bank.</p>
      </div>
    );
  }

  // Quiz Results Mode
  if (quizMode === 'results' && quizResults) {
    // If user is not subscribed and just finished the daily quiz, show upsell
    const isDailyQuiz = !hasActiveSubscription && dailyQuizQuestions && dailyQuizQuestions.length === 3;
    const isUnsubscribed = !hasActiveSubscription;
    return (
      <QuizResults
        results={quizResults}
        onRetakeQuiz={retakeQuiz}
        onBackToSetup={exitQuiz}
        isDailyQuiz={isDailyQuiz}
        isUnsubscribed={isUnsubscribed}
      />
    );
  }

  // Quiz Mode for paid users
  if (quizMode === 'quiz' && quizSession) {
    return (
      <Quiz
        questions={quizSession.questions}
        initialIndex={quizSession.currentIndex}
        onComplete={handleQuizComplete}
        onExit={exitQuiz}
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Questions</h3>
        <p className="text-gray-600">Fetching your question bank from the database...</p>
      </div>
    );
  }

  // Quiz Setup Interface
  return (
    <div className="space-y-6">
      {/* Resume Quiz Banner */}
      {hasPersistedQuiz() && persistedState && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Resume Previous Quiz</h3>
                <p className="text-blue-700 text-sm">
                  You have an unfinished quiz on question {persistedState.currentIndex + 1} of {persistedState.questions.length}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={discardPersistedQuiz}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Discard
              </button>
              <button
                onClick={resumeQuiz}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Resume Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Quiz</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Take quizzes from your question bank with scoring and detailed results
            </p>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Current Study Session</span>
            </div>
            <button
              onClick={handleResetSession}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Session</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-base font-semibold text-blue-400">{sessionStats.questionsUsed}</div>
              <div className="text-xs text-gray-500">Questions Used</div>
            </div>
            <div>
              <div className="text-base font-semibold text-purple-400">{filteredQuestions.length}</div>
              <div className="text-xs text-gray-500">Available Now</div>
            </div>
            <div>
              <div className="text-base font-semibold text-green-400">{questions.length}</div>
              <div className="text-xs text-gray-500">Total Questions</div>
            </div>
            <div>
              <div className="text-base font-semibold text-orange-400">
                {formatSessionDuration(sessionStats.sessionDuration)}
              </div>
              <div className="text-xs text-gray-500">Session Duration</div>
            </div>
          </div>
          
          {sessionStats.questionsUsed > 0 && (
            <div className="mt-3 text-center">
              <p className="text-sm text-blue-700">
                Session started: {sessionStats.sessionStartTime.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Quiz Configuration */}
        <div className="space-y-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {[5, 10, 25].map(num => (
                  <button
                    key={num}
                    onClick={() => setNumberOfQuestions(Math.min(num, filteredQuestions.length))}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors font-medium ${
                      numberOfQuestions === num
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">or</span>
                <input
                  type="number"
                  min="1"
                  max={filteredQuestions.length}
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Math.max(1, Math.min(parseInt(e.target.value) || 1, filteredQuestions.length)))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                />
                <span className="text-sm text-gray-600">
                  (Max: {filteredQuestions.length})
                </span>
              </div>
            </div>
            {/* 10 Hard Random Button */}
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-lg border-2 border-red-500 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors"
              onClick={() => {
                // Find all hard questions from all domains
                const hardQuestions = availableQuestions.filter(q => q.difficulty === 'Hard' && q.isActive);
                if (hardQuestions.length < 10) {
                  alert('Not enough hard questions available.');
                  return;
                }
                // Shuffle and pick 10
                const shuffled = [...hardQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
                markQuestionsAsUsed(shuffled);
                setQuizSession({
                  questions: shuffled,
                  currentIndex: 0,
                  startTime: new Date(),
                  isActive: true
                });
                setQuizMode('quiz');
              }}
            >
              10 Hard Random (All Domains)
            </button>
          </div>

          {/* Tag Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Filter by Tags (Optional)
              </label>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
              >
                <Filter className="w-4 h-4" />
                <span>{selectedTags.length > 0 ? `${selectedTags.length} selected` : 'All tags'}</span>
              </button>
            </div>

            {showSettings && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-wrap gap-2 mb-3">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setSelectedTags(allTags)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Select All
                  </button>
                </div>
              </div>
            )}

            {selectedTags.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-2">Selected tags:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={generateQuiz}
            disabled={filteredQuestions.length === 0}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Play className="w-5 h-5" />
            <span>Start Quiz</span>
          </button>

          {/* Start Quiz from Bookmarks Button */}
          <button
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border text-sm font-medium shadow-sm transition-colors ${bookmarkedIds.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'}`}
            onClick={startQuizFromBookmarks}
            disabled={bookmarkedIds.length === 0 || bookmarksLoading}
            aria-disabled={bookmarkedIds.length === 0 || bookmarksLoading}
          >
            <Bookmark className="w-5 h-5 mr-2" fill={bookmarkedIds.length > 0 ? 'currentColor' : 'none'} />
            Start Quiz from Bookmarks
          </button>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-2">
                {sessionStats.questionsUsed > 0 
                  ? 'No more questions available with the selected filters in this session.'
                  : 'No questions available with the selected filters.'
                }
              </p>
              {sessionStats.questionsUsed > 0 && (
                <p className="text-gray-500 text-xs">
                  Reset the session or adjust your tag selection to see more questions.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3">💡 Quiz Tips</h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>• <strong>Quiz Persistence:</strong> Your quiz progress is automatically saved - you can switch tabs and resume later</li>
          <li>• <strong>Session Tracking:</strong> Questions are tracked per session to avoid repeats</li>
          <li>• <strong>Keyword Highlighting:</strong> Use the "Highlight Keywords" button to identify key CISSP terms (analyzes once per question)</li>
          <li>• <strong>Participant Tallies:</strong> Track group responses during study sessions without the word "option"</li>
          <li>• <strong>Immediate Feedback:</strong> Answer questions with instant feedback and scoring</li>
          <li>• <strong>Progress Tracking:</strong> See detailed results and explanations after completion</li>
          <li>• Questions are randomly selected and shuffled for each quiz</li>
          <li>• Use tag filters to focus on specific topics or domains</li>
          <li>• Reset the session to make all questions available again</li>
        </ul>
      </div>
    </div>
  );
};