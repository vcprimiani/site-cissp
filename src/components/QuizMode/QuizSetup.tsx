import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { Target, Play, ArrowLeft, ArrowRight, Clock, X, Settings, Filter, RotateCcw, Calendar } from 'lucide-react';
import { Quiz } from './Quiz';
import { QuizResults } from './QuizResults';
import { getDomainColor, getDifficultyColor } from '../../utils/colorSystem';
import { useQuestions } from '../../hooks/useQuestions';
import { useSessionTracker } from '../../hooks/useSessionTracker';

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

export const QuizSetup: React.FC<QuizSetupProps> = ({ onQuizComplete }) => {
  const { questions, loading } = useQuestions();
  const { 
    getAvailableQuestions, 
    markQuestionsAsUsed, 
    resetSession, 
    getSessionStats 
  } = useSessionTracker();
  
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('setup');
  const [showSettings, setShowSettings] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

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

  // Quiz Mode
  if (quizMode === 'quiz' && quizSession) {
    return (
      <Quiz
        questions={quizSession.questions}
        onComplete={handleQuizComplete}
        onExit={exitQuiz}
      />
    );
  }

  // Quiz Results Mode
  if (quizMode === 'results' && quizResults) {
    return (
      <QuizResults
        results={quizResults}
        onRetakeQuiz={retakeQuiz}
        onBackToSetup={exitQuiz}
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
              <div className="text-2xl font-bold text-blue-600">{sessionStats.questionsUsed}</div>
              <div className="text-sm text-gray-600">Questions Used</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{filteredQuestions.length}</div>
              <div className="text-sm text-gray-600">Available Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {formatSessionDuration(sessionStats.sessionDuration)}
              </div>
              <div className="text-sm text-gray-600">Session Duration</div>
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
                {[1, 5, 10].map(num => (
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
          <li>• <strong>Session Tracking:</strong> Questions are tracked per session to avoid repeats</li>
          <li>• <strong>Keyword Highlighting:</strong> Use the "Highlight Keywords" button to identify key CISSP terms</li>
          <li>• <strong>Participant Tallies:</strong> Track group responses during study sessions</li>
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