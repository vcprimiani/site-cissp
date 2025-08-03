import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Target, Play, ArrowLeft, ArrowRight, Clock, X, Settings, Filter, RotateCcw, Calendar, RefreshCw, Bookmark, Brain, Crown, CheckCircle, Lock } from 'lucide-react';
import { Quiz } from './Quiz';
import { QuizResults } from './QuizResults';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { useQuestions } from '../../hooks/useQuestions';
import { useSessionTracker } from '../../hooks/useSessionTracker';
import { useQuizPersistence } from '../../hooks/useQuizPersistence';
import { useBookmarks } from '../../hooks/useBookmarks';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';

interface QuizSetupProps {
  onQuizComplete: (incorrectQuestions: Question[]) => void;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
  appState: import('../../types').AppState;
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

type QuizMode = 'setup' | 'quiz' | 'results'; //comment

export const QuizSetup: React.FC<QuizSetupProps & { hasActiveSubscription: boolean; subscriptionLoading: boolean }> = ({ onQuizComplete, hasActiveSubscription, subscriptionLoading, appState }) => {
  const { questions, loading, addQuestion, refreshQuestions } = useQuestions();
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

  // Add state for quiz progress
  const [quizProgress, setQuizProgress] = useState<{current: number, total: number} | null>(null);

  // Get session statistics
  const sessionStats = getSessionStats();
  
  // Get available questions (excluding those used in this session)
  const availableQuestions = getAvailableQuestions(questions);
  
  // Get all available tags from available questions
  const allTags = Array.from(new Set(availableQuestions.flatMap(q => q.tags))).sort();
  
  // Filter questions based on selected tags and exclude flagged questions
  const filteredQuestions = selectedTags.length > 0 
    ? availableQuestions.filter(q => q.isActive && !q.isFlagged && selectedTags.some(tag => q.tags.includes(tag)))
    : availableQuestions.filter(q => q.isActive && !q.isFlagged);

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
    if (hasPersistedQuiz() === true && !!persistedState) {
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
  };

  const retakeQuiz = () => {
    if (!quizResults) return;
    
    // Reset session to allow reusing questions
    resetSession();
    
    // Generate a new quiz with the same settings
    const questionsToUse = Math.min(numberOfQuestions, filteredQuestions.length);
    const shuffledQuestions = [...filteredQuestions]
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
    setQuizResults(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleResetSession = () => {
    resetSession();
  };

  const formatSessionDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const startQuizFromBookmarks = () => {
    if (bookmarkedIds.length === 0) return;

    const bookmarkedQuestions = questions.filter(q => bookmarkedIds.includes(q.id));
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

  // For tag pills: show only 10 random tags
  const [randomizedTags, setRandomizedTags] = useState<string[]>([]);
  useEffect(() => {
    if (allTags.length === 0) {
      setRandomizedTags([]);
      return;
    }
    // Shuffle and pick 10
    const shuffled = [...allTags].sort(() => Math.random() - 0.5).slice(0, 10);
    setRandomizedTags(shuffled);
  }, [allTags]);

  // Quiz Mode
  if (quizMode === 'quiz' && quizSession) {
    return (
      <Quiz
        questions={quizSession.questions}
        initialIndex={quizSession.currentIndex}
        onComplete={handleQuizComplete}
        onExit={exitQuiz}
        onProgressChange={setQuizProgress}
        currentUser={appState.currentUser}
      />
    );
  }

  if (quizMode === 'results' && quizResults) {
    return (
      <QuizResults
        results={quizResults}
        onRetakeQuiz={retakeQuiz}
        onBackToSetup={exitQuiz}
        isDailyQuiz={false}
        isUnsubscribed={!hasActiveSubscription}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Questions</h3>
        <p className="text-gray-600">Fetching your practice questions...</p>
      </div>
    );
  }

  // Check if user needs to upgrade
  if (!hasActiveSubscription && !subscriptionLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Required</h3>
        <p className="text-gray-600 mb-6">Subscribe to access unlimited quizzes and advanced features.</p>
        <button
          onClick={async () => {
            const product = stripeProducts[0];
            await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  // Main setup interface
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quiz Options (left) */}
        <div className="lg:col-span-1 order-1">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {/* Quiz Options Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Quiz Options</span>
              </h3>
              <div className="space-y-4">
                {/* Start Quiz Button */}
                <button
                  type="button"
                  className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg ${
                    hasPersistedQuiz() === true && !!persistedState
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : filteredQuestions.length === 0
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold hover:from-green-100 hover:to-emerald-100 hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                  onClick={generateQuiz}
                  disabled={hasPersistedQuiz() === true && !!persistedState || filteredQuestions.length === 0}
                >
                  <Play className="w-5 h-5" />
                  <span>Start Quiz</span>
                  {hasPersistedQuiz() === true && !!persistedState ? (
                    <span className="text-xs text-gray-500">⏸️ Quiz Paused</span>
                  ) : (
                    <span className="text-sm opacity-75">→</span>
                  )}
                </button>

                {/* Resume Quiz Button */}
                {hasPersistedQuiz() === true && !!persistedState && (
                  <button
                    type="button"
                    className="flex items-center justify-center space-x-3 p-4 rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold hover:from-blue-100 hover:to-cyan-100 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 shadow-lg"
                    onClick={resumeQuiz}
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Resume Quiz</span>
                    <span className="text-sm opacity-75">→</span>
                  </button>
                )}

                {/* Start from Bookmarks Button */}
                {bookmarkedIds.length > 0 && (
                  <button
                    type="button"
                    className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg ${
                      hasPersistedQuiz() === true && !!persistedState
                        ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-semibold hover:from-purple-100 hover:to-pink-100 hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                    onClick={startQuizFromBookmarks}
                    disabled={hasPersistedQuiz() === true && !!persistedState}
                  >
                    <Bookmark className="w-5 h-5" />
                    <span>Start from Bookmarks</span>
                    {hasPersistedQuiz() === true && !!persistedState ? (
                      <span className="text-xs text-gray-500">⏸️ Quiz Paused</span>
                    ) : (
                      <span className="text-sm opacity-75">→</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Quiz Configuration (right) */}
        <div className="md:col-span-2 order-2">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            {/* Quiz Setup Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <span>Quiz Configuration</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6">
                {hasPersistedQuiz() === true && !!persistedState && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-sm text-yellow-800 font-medium">
                        Quiz paused - complete or discard the paused quiz to start a new one
                      </span>
                    </div>
                  </div>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Questions
                </label>
                <div className="space-y-4">
                  {/* Preset buttons */}
                  <div className="flex items-center space-x-2">
                    {[5, 10, 25].map(num => (
                      <button
                        key={num}
                        onClick={() => setNumberOfQuestions(Math.min(num, filteredQuestions.length))}
                        disabled={hasPersistedQuiz() === true && !!persistedState}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                          hasPersistedQuiz() === true && !!persistedState
                            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : numberOfQuestions === num
                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                            : 'border-gray-300 hover:border-purple-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom input field */}
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700">Custom:</label>
                    <input
                      type="number"
                      min="1"
                      max={filteredQuestions.length}
                      value={numberOfQuestions}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setNumberOfQuestions(Math.min(value, filteredQuestions.length));
                        }
                      }}
                      disabled={hasPersistedQuiz() === true && !!persistedState}
                      className={`px-3 py-2 border rounded-lg text-sm w-20 ${
                        hasPersistedQuiz() === true && !!persistedState
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                      }`}
                    />
                    <span className="text-sm text-gray-500">
                      (max: {filteredQuestions.length})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Filter Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Filter className="w-5 h-5 text-green-600" />
                <span>Filter by Tags</span>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </button>
                )}
              </h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {randomizedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Filtering by: {selectedTags.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Session Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>Session Statistics</span>
                <button
                  onClick={handleResetSession}
                  className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
                  title="Reset session to reuse questions"
                >
                  Reset
                </button>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{sessionStats.questionsUsed}</div>
                    <div className="text-sm text-gray-600">Questions Used</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{availableQuestions.length}</div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{sessionStats.questionsAsked}</div>
                    <div className="text-sm text-gray-600">Asked</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatSessionDuration(sessionStats.sessionDuration)}
                    </div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};