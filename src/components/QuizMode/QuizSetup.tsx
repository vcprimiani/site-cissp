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
import { getLocalDailyQuizQuestions } from '../../services/dailyQuiz';
import { redirectToCheckout } from '../../services/stripe';
import { stripeProducts } from '../../stripe-config';
import { generateAIQuestion } from '../../services/openai';

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

type QuizMode = 'setup' | 'quiz' | 'results'; //comment

export const QuizSetup: React.FC<QuizSetupProps & { hasActiveSubscription: boolean; subscriptionLoading: boolean }> = ({ onQuizComplete, hasActiveSubscription, subscriptionLoading }) => {
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
  const [dailyQuizQuestions, setDailyQuizQuestions] = useState<Question[] | null>(null);
  const [dailyQuizLoading, setDailyQuizLoading] = useState(false);
  const [dailyQuizError, setDailyQuizError] = useState<string | null>(null);

  // Add state for AI generation loading and error
  const [aiGenerating, setAIGenerating] = useState(false);
  const [aiGenerationError, setAIGenerationError] = useState<string | null>(null);

  // Add state for random generation
  const [randomGenerating, setRandomGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [randomGenerationCancelled, setRandomGenerationCancelled] = useState(false);

  // Add state for AI random generation progress and emoji
  const [aiRandomProgress, setAIRandomProgress] = useState(0);
  const aiRandomEmojis = ['🤔','🧐','🤓','😎','🦾','🧠','🔒','💡','🚀','🎯','✅'];
  const [aiRandomEmoji, setAIRandomEmoji] = useState(aiRandomEmojis[0]);

  // Add state for quiz progress
  const [quizProgress, setQuizProgress] = useState<{current: number, total: number} | null>(null);

  useEffect(() => {
    if (!hasActiveSubscription && !subscriptionLoading) {
      setDailyQuizLoading(true);
      // fetchDailyQuizQuestionIds()
      //   .then(ids => fetchQuestionsByIds(ids))
      //   .then(qs => setDailyQuizQuestions(qs))
      //   .catch(err => setDailyQuizError(err.message || 'Failed to load daily quiz'))
      //   .finally(() => setDailyQuizLoading(false));

      // Check for persisted daily quiz results
      const storedResults = localStorage.getItem('cissp-daily-quiz-results');
      if (storedResults) {
        setQuizResults(JSON.parse(storedResults));
        setQuizMode('results');
      }
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
    localStorage.removeItem('cissp-daily-quiz-results');
  };

  const handleQuizComplete = (results: QuizResults) => {
    setQuizResults(results);
    setQuizMode('results');

    // Persist results for unpaid daily quiz only
    if (!hasActiveSubscription && dailyQuizQuestions && dailyQuizQuestions.length === 3) {
      localStorage.setItem('cissp-daily-quiz-results', JSON.stringify(results));
    }

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

  // Add this function to handle random generation and start quiz
  const handleRandomGenerateAndStart = async () => {
    if (!hasActiveSubscription) {
      setShowUpgradeModal(true);
      return;
    }
    setRandomGenerating(true);
    setRandomGenerationCancelled(false);
    setAIRandomProgress(0);
    setAIRandomEmoji(aiRandomEmojis[0]);
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
    const newQuestionsData = [];
    for (let i = 0; i < 10; i++) {
      if (randomGenerationCancelled) break;
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const options = {
        domain,
        difficulty: 'Medium' as 'Medium',
        questionType: 'scenario-based' as 'scenario-based',
        scenarioType: 'technical' as 'technical',
        topic: `general concepts from ${domain}`,
        includeDistractors: true,
        focusArea: ''
      };
      const response = await generateAIQuestion(options.topic, options, [], true);
      if (response && response.question) {
        const newQ = {
          ...response.question,
          isActive: true,
          tags: [...response.question.tags, 'ai-generated']
        };
        await addQuestion(newQ); // addQuestion will handle createdBy and createdAt
        newQuestionsData.push(newQ);
      }
      setAIRandomProgress(i + 1);
      setAIRandomEmoji(aiRandomEmojis[(i + 1) % aiRandomEmojis.length]);
    }
    await refreshQuestions();
    // Find the 10 most recent ai-generated questions
    const aiGeneratedQuestions = questions
      .filter(q => q.tags.includes('ai-generated') && q.isActive)
      .slice(0, 10);
    if (aiGeneratedQuestions.length > 0) {
      markQuestionsAsUsed(aiGeneratedQuestions);
      setQuizSession({
        questions: aiGeneratedQuestions,
        currentIndex: 0,
        startTime: new Date(),
        isActive: true
      });
      setQuizMode('quiz');
    }
    setRandomGenerating(false);
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
  if (!hasActiveSubscription && !subscriptionLoading) {
    // Unpaid user: show daily quiz only
    const dailyQuizQuestions = getLocalDailyQuizQuestions(questions);

    // Check for persisted results
    const storedResults = localStorage.getItem('cissp-daily-quiz-results');
    if (storedResults) {
      const quizResults = JSON.parse(storedResults);
      return (
        <QuizResults
          results={quizResults}
          onRetakeQuiz={exitQuiz}
          onBackToSetup={exitQuiz}
          isDailyQuiz={true}
          isUnsubscribed={true}
        />
      );
    }

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
            questions={dailyQuizQuestions || []}
            onComplete={handleQuizComplete}
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

  // Main render logic
  return (
    <>
      {quizMode === 'quiz' && quizSession && quizSession.questions && quizSession.questions.length > 0 && (
        <div className="max-w-6xl mx-auto space-y-8 px-4">
          <div>
            <Quiz
              questions={quizSession.questions}
              initialIndex={quizSession.currentIndex}
              onComplete={handleQuizComplete}
              onExit={exitQuiz}
              onProgressChange={(current, total) => setQuizProgress({current, total})}
            />
          </div>
        </div>
      )}
      {quizMode === 'setup' && (
        <div className="space-y-8">
          {/* Resume Quiz Banner */}
          {hasPersistedQuiz() && persistedState && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">⏸️ Quiz Paused</h3>
                    <p className="text-blue-700 text-sm">
                      You have an unfinished quiz on question {persistedState.currentIndex + 1} of {persistedState.questions.length}
                    </p>
                    <p className="text-blue-600 text-xs mt-1 font-medium">
                      Complete or discard this quiz to start a new one
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={discardPersistedQuiz}
                    className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Discard Quiz
                  </button>
                  <button
                    onClick={resumeQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    ▶️ Resume Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Container */}
          <div className="max-w-6xl mx-auto space-y-8 px-4">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Quiz Dashboard</h2>
                  <p className="text-gray-600">Test your knowledge with personalized quizzes and track your progress</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">Used Today</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.questionsUsed}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">Available</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{filteredQuestions.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{questions.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-500">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{formatSessionDuration(sessionStats.sessionDuration)}</div>
                </div>
              </div>

              {/* Session Reset */}
              {sessionStats.questionsUsed > 0 && (
                <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Active Study Session</p>
                      <p className="text-xs text-blue-700">Started {sessionStats.sessionStartTime.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetSession}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Session</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quiz Setup and Quick Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions (left) */}
              <div className="md:col-span-1 order-1">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6 md:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Bookmark className="w-5 h-5 text-blue-600" />
                    <span>Quick Actions</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Start Quiz from Bookmarks */}
                    <button
                      className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                        bookmarkedIds.length === 0 
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                          : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                      }`}
                      onClick={startQuizFromBookmarks}
                      disabled={bookmarkedIds.length === 0 || bookmarksLoading}
                    >
                      <Bookmark className="w-5 h-5" fill={bookmarkedIds.length > 0 ? 'currentColor' : 'none'} />
                      <div className="text-left">
                        <div className="font-semibold">Start from Bookmarks</div>
                        <div className="text-xs opacity-75">
                          {bookmarkedIds.length > 0 ? `${bookmarkedIds.length} bookmarked questions` : 'No bookmarks yet'}
                        </div>
                      </div>
                    </button>
                    {/* Resume Quiz */}
                    {hasPersistedQuiz() && persistedState && (
                      <button
                        className="flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400"
                        onClick={resumeQuiz}
                      >
                        <RefreshCw className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">Resume Previous Quiz</div>
                          <div className="text-xs opacity-75">
                            Question {persistedState.currentIndex + 1} of {persistedState.questions.length}
                          </div>
                        </div>
                      </button>
                    )}
                    {/* 10 Hard Random Button */}
                    <button
                      type="button"
                      className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg ${
                        hasPersistedQuiz() && persistedState
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 font-semibold hover:from-orange-100 hover:to-amber-100 hover:shadow-xl transform hover:scale-[1.02]'
                      }`}
                      onClick={() => {
                        if (hasPersistedQuiz() && persistedState) return;
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
                      disabled={hasPersistedQuiz() && persistedState}
                    >
                      <span className="text-lg">🌶️</span>
                      <span>10 Hard Random (All Domains)</span>
                      {hasPersistedQuiz() && persistedState ? (
                        <span className="text-xs text-gray-500">⏸️ Quiz Paused</span>
                      ) : (
                        <span className="text-sm opacity-75">→</span>
                      )}
                    </button>
                    {/* Generate 10 Random and Start Quiz */}
                    <button
                      type="button"
                      className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 shadow-lg ${
                        hasPersistedQuiz() && persistedState
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-semibold hover:from-blue-100 hover:to-cyan-100 hover:shadow-xl transform hover:scale-[1.02]'
                      }`}
                      onClick={handleRandomGenerateAndStart}
                      disabled={randomGenerating || (hasPersistedQuiz() && persistedState)}
                    >
                      {randomGenerating ? (
                        <span className="flex items-center space-x-2 w-full">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mr-2">
                            <div style={{ width: `${(aiRandomProgress/10)*100}%` }} className="h-full bg-blue-400 transition-all duration-300"></div>
                          </div>
                          <span className="text-xs font-bold text-blue-700 mr-1">{aiRandomProgress}/10</span>
                          <span className="text-2xl ml-2">{aiRandomEmoji}</span>
                          <button type="button" className="ml-3 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" onClick={e => { e.stopPropagation(); setRandomGenerationCancelled(true); }}>Cancel</button>
                        </span>
                      ) : (
                        <>
                          <span className="text-lg">🎲</span>
                          <span>Generate 10 New Quiz Questions</span>
                          {hasPersistedQuiz() && persistedState ? (
                            <span className="text-xs text-gray-500">⏸️ Quiz Paused</span>
                          ) : (
                            <span className="text-sm opacity-75">→</span>
                          )}
                        </>
                      )}
                    </button>
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
                      {hasPersistedQuiz() && persistedState && (
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {[5, 10, 25].map(num => (
                            <button
                              key={num}
                              onClick={() => setNumberOfQuestions(Math.min(num, filteredQuestions.length))}
                              disabled={hasPersistedQuiz() && persistedState}
                              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                                hasPersistedQuiz() && persistedState
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
                        <button
                          onClick={generateQuiz}
                          disabled={filteredQuestions.length === 0 || (hasPersistedQuiz() && persistedState)}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                            hasPersistedQuiz() && persistedState
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                          }`}
                        >
                          <Play className="w-5 h-5" />
                          <span>{hasPersistedQuiz() && persistedState ? 'Quiz Paused' : 'Start Quiz'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {quizMode === 'results' && quizResults && (
        <QuizResults
          results={quizResults}
          onRetakeQuiz={retakeQuiz}
          onBackToSetup={exitQuiz}
          isDailyQuiz={false}
          isUnsubscribed={false}
        />
      )}
      {/* Premium Upgrade Modal (copied from AIGenerator) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlock Random Quiz Generation</h3>
              <p className="text-gray-600 mb-6">
                Subscribe to generate unlimited random quizzes and unlock all premium features.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unlimited random quiz generation</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">All 8 CISSP domains covered</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Cancel anytime</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={async () => {
                    const product = stripeProducts[0];
                    await redirectToCheckout({ priceId: product.priceId, mode: product.mode });
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};