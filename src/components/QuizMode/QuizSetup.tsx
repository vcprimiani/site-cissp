import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Target, Play, ArrowLeft, ArrowRight, Clock, X, Settings, Filter, RotateCcw, Calendar, RefreshCw, Bookmark, Brain } from 'lucide-react';
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
            questions={dailyQuizQuestions}
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

  // Quiz Results Mode
  if (quizMode === 'results' && quizResults) {
    // If user is not subscribed and just finished the daily quiz, show upsell
    const isDailyQuiz = !hasActiveSubscription && !!dailyQuizQuestions && dailyQuizQuestions.length === 3;
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

      {/* Premium Quiz Interface */}
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-100">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quiz Mode</h2>
              <p className="text-gray-600">Test your knowledge with personalized quizzes</p>
            </div>
          </div>

          {/* Quick Stats Cards */}
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

        {/* Main Quiz Configuration */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          
          {/* Quiz Setup Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <span>Quiz Configuration</span>
            </h3>
            
            {/* Number of Questions and Start Quiz */}
            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Questions
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {[5, 10, 25].map(num => (
                      <button
                        key={num}
                        onClick={() => setNumberOfQuestions(Math.min(num, filteredQuestions.length))}
                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                          numberOfQuestions === num
                            ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                            : 'border-gray-300 hover:border-purple-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">or</span>
                    <input
                      type="number"
                      min="1"
                      max={filteredQuestions.length}
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(Math.max(1, Math.min(parseInt(e.target.value) || 1, filteredQuestions.length)))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                    />
                    <span className="text-sm text-gray-500">
                      (Max: {filteredQuestions.length})
                    </span>
                  </div>
                </div>
                
                {/* Start Quiz Button */}
                <button
                  onClick={generateQuiz}
                  disabled={filteredQuestions.length === 0}
                  className="flex items-center justify-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Quiz</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Generation Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Brain className="w-5 h-5 text-green-600" />
              <span>AI-Powered Generation</span>
            </h3>
            
            <div className="space-y-3">
              <button
                type="button"
                className="w-full px-6 py-3 rounded-xl border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold hover:from-green-100 hover:to-emerald-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={async (event) => {
                  // Check if user has active subscription for AI features
                  if (!hasActiveSubscription) {
                    alert('AI question generation requires an active subscription. Please upgrade to use this feature.');
                    return;
                  }

                  // Generate 10 new AI questions
                  const newQuestions = [];
                  const existingTerms = availableQuestions.map(q => q.tags).flat();
                  
                  // Create loading overlay
                  const button = event.target as HTMLButtonElement;
                  const buttonContainer = button.parentElement;
                  
                  // Create loading overlay
                  const loadingOverlay = document.createElement('div');
                  loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                  loadingOverlay.innerHTML = `
                    <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                      <div class="text-center">
                        <div class="mb-4">
                          <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                            <span class="text-2xl">🤖</span>
                          </div>
                          <h3 class="text-xl font-bold text-gray-800 mb-2">AI Question Generation</h3>
                          <p class="text-gray-600 text-sm">Creating your personalized quiz...</p>
                        </div>
                        
                        <div class="mb-6">
                          <div class="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span id="progress-text">0/10</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div id="progress-bar" class="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                          </div>
                        </div>
                        
                        <div id="status-text" class="text-sm text-gray-700 font-medium mb-4">
                          Initializing AI...
                        </div>
                        
                        <div class="flex justify-center space-x-3">
                          <button id="cancel-btn" class="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg transition-colors text-sm font-medium cursor-not-allowed" disabled>
                            Cancel & Start Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                  
                  document.body.appendChild(loadingOverlay);
                  
                  // Add cancel functionality
                  let isCancelled = false;
                  const cancelBtn = document.getElementById('cancel-btn');
                  if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                      isCancelled = true;
                      const statusText = document.getElementById('status-text');
                      if (statusText) {
                        statusText.innerHTML = `⏹️ <span class="text-blue-600 font-bold">Starting quiz with ${newQuestions.length} questions...</span>`;
                      }
                    });
                  }
                  
                  try {
                    let attempts = 0;
                    const maxAttempts = 1000; // Set very high so it never gives up unless cancelled
                    
                    while (newQuestions.length < 10 && attempts < maxAttempts && !isCancelled) {
                      attempts++;
                      
                      try {
                        // Update progress
                        const progressText = document.getElementById('progress-text');
                        const progressBar = document.getElementById('progress-bar');
                        const statusText = document.getElementById('status-text');
                        
                        if (progressText && progressBar && statusText) {
                          progressText.textContent = `${newQuestions.length}/10`;
                          progressBar.style.width = `${(newQuestions.length / 10) * 100}%`;
                          statusText.textContent = `🧠 Generating question ${newQuestions.length + 1}...`;
                        }
                        
                        // Enable cancel button once we have at least one question
                        const cancelBtn = document.getElementById('cancel-btn');
                        if (cancelBtn && newQuestions.length > 0) {
                          cancelBtn.className = 'px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium';
                          cancelBtn.removeAttribute('disabled');
                          cancelBtn.classList.remove('cursor-not-allowed');
                        }
                        
                        // Generate a random topic for variety
                        const topics = [
                          'network security', 'access control', 'risk management', 
                          'incident response', 'cryptography', 'security architecture',
                          'compliance', 'business continuity', 'vulnerability management',
                          'identity management', 'data protection', 'security operations'
                        ];
                        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                        
                        // Generate question with AI
                        const response = await generateAIQuestion(
                          randomTopic,
                          {
                            domain: 'Security and Risk Management',
                            difficulty: 'Medium',
                            questionType: 'scenario-based',
                            scenarioType: 'technical',
                            topic: randomTopic,
                            includeDistractors: true,
                            focusArea: ''
                          },
                          existingTerms,
                          true
                        );
                        
                        if (response.question) {
                          const newQuestion: Question = {
                            ...response.question,
                            id: `ai-generated-${Date.now()}-${newQuestions.length}`,
                            createdBy: 'ai',
                            isActive: true,
                            createdAt: new Date(),
                            tags: [...response.question.tags, 'ai-generated']
                          };
                          newQuestions.push(newQuestion);
                          
                          // Show success feedback
                          if (statusText) {
                            statusText.innerHTML = `✅ <span class="text-green-600 font-bold">Question ${newQuestions.length} created!</span>`;
                            statusText.classList.add('animate-pulse');
                            setTimeout(() => statusText.classList.remove('animate-pulse'), 500);
                          }
                          
                          // Brief pause to show success
                          await new Promise(resolve => setTimeout(resolve, 400));
                        }
                        
                        // Add delay between requests
                        await new Promise(resolve => setTimeout(resolve, 300));
                      } catch (error: any) {
                        console.error(`Error generating question (attempt ${attempts}):`, error);
                        // Silently continue - no error feedback shown to user
                      }
                    }
                    
                    if (isCancelled && newQuestions.length > 0) {
                      // User cancelled but we have some questions
                      const statusText = document.getElementById('status-text');
                      if (statusText) {
                        statusText.innerHTML = `⏹️ <span class="text-blue-600 font-bold">Starting quiz with ${newQuestions.length} questions...</span>`;
                      }
                      
                      // Brief pause to show the message
                      await new Promise(resolve => setTimeout(resolve, 800));
                      
                      // Mark questions as used and start quiz
                      markQuestionsAsUsed(newQuestions);
                      setQuizSession({
                        questions: newQuestions,
                        currentIndex: 0,
                        startTime: new Date(),
                        isActive: true
                      });
                      setQuizMode('quiz');
                    } else if (newQuestions.length === 10) {
                      // Show final success message
                      const statusText = document.getElementById('status-text');
                      if (statusText) {
                        statusText.innerHTML = `🎉 <span class="text-green-600 font-bold">All 10 questions ready!</span>`;
                        statusText.classList.add('animate-pulse');
                      }
                      
                      // Brief pause to show completion
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      // Mark questions as used and start quiz
                      markQuestionsAsUsed(newQuestions);
                      setQuizSession({
                        questions: newQuestions,
                        currentIndex: 0,
                        startTime: new Date(),
                        isActive: true
                      });
                      setQuizMode('quiz');
                    } else if (newQuestions.length > 0) {
                      // Show partial success message
                      const statusText = document.getElementById('status-text');
                      if (statusText) {
                        statusText.innerHTML = `⚠️ <span class="text-yellow-600 font-bold">Only ${newQuestions.length}/10 questions generated</span>`;
                      }
                      
                      setTimeout(() => {
                        alert(`Only ${newQuestions.length} questions were generated. Please try again to get a full 10-question quiz.`);
                      }, 1000);
                    } else {
                      // No questions generated at all
                      const statusText = document.getElementById('status-text');
                      if (statusText) {
                        statusText.innerHTML = `❌ <span class="text-red-600 font-bold">Failed to generate questions</span>`;
                      }
                      
                      setTimeout(() => {
                        alert('Failed to generate AI questions. Please try again.');
                      }, 1000);
                    }
                  } catch (error: any) {
                    console.error('Error generating AI questions:', error);
                    alert('Failed to generate AI questions. Please try again.');
                  } finally {
                    // Remove loading overlay
                    document.body.removeChild(loadingOverlay);
                  }
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">🤖</span>
                  <span>Generate 10 New AI Questions</span>
                  <span className="text-sm opacity-75">→</span>
                </div>
              </button>
              
              {/* 10 Hard Random Button */}
              <button
                type="button"
                className="w-full px-6 py-3 rounded-xl border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 font-semibold hover:from-orange-100 hover:to-amber-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">🌶️</span>
                  <span>10 Hard Random (All Domains)</span>
                  <span className="text-sm opacity-75">→</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tag Filter Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-600" />
              <span>Filter by Tags</span>
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Customize Your Quiz</p>
                  <p className="text-xs text-gray-500">Select specific topics to focus your study</p>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-200 font-medium text-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>{selectedTags.length > 0 ? `${selectedTags.length} selected` : 'Choose Tags'}</span>
                </button>
              </div>

              {showSettings && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setSelectedTags(allTags)}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Select All
                    </button>
                  </div>
                </div>
              )}

              {selectedTags.length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-purple-900">Selected Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              <span>Quick Actions</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {hasPersistedQuiz() && (
                <button
                  className="flex items-center justify-center space-x-3 p-4 rounded-xl border-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 transition-all duration-200"
                  onClick={resumeQuiz}
                >
                  <ArrowRight className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Resume Quiz</div>
                    <div className="text-xs opacity-75">Continue where you left off</div>
                  </div>
                </button>
              )}
            </div>
          </div>





          {/* No Questions Available */}
          {filteredQuestions.length === 0 && (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-900">No Questions Available</h4>
                  <p className="text-sm text-yellow-700">
                    {sessionStats.questionsUsed > 0 
                      ? 'All questions with the selected filters have been used in this session.'
                      : 'No questions match the selected filters.'
                    }
                  </p>
                </div>
              </div>
              {sessionStats.questionsUsed > 0 && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleResetSession}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                  >
                    Reset Session
                  </button>
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Tips Section */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">💡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Quiz Tips & Features</h3>
            <p className="text-gray-600">Make the most of your study sessions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Smart Persistence</h4>
                <p className="text-sm text-gray-600">Your quiz progress is automatically saved - switch tabs and resume later</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Session Tracking</h4>
                <p className="text-sm text-gray-600">Questions are tracked per session to avoid repeats and ensure variety</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Features</h4>
                <p className="text-sm text-gray-600">Generate fresh questions and get keyword analysis for deeper understanding</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Immediate Feedback</h4>
                <p className="text-sm text-gray-600">Get instant scoring and detailed explanations for every question</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-xs">5</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Smart Filtering</h4>
                <p className="text-sm text-gray-600">Use tags to focus on specific topics or domains for targeted study</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-600 text-xs">6</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Progress Analytics</h4>
                <p className="text-sm text-gray-600">Track your performance with detailed results and improvement insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};