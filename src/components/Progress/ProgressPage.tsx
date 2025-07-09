import React, { useEffect, useState } from 'react';
import { Trophy, Clock, BarChart2, Trash2, ArrowLeft } from 'lucide-react';
import { Header } from '../Layout/Header';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AppState } from '../../types';
import { PaywallPage } from '../Paywall/PaywallPage';

interface ProgressEntry {
  timestamp: number;
  results: {
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    questionResults: {
      question: any;
      userAnswer: number | null;
      isCorrect: boolean;
      timeSpent: number;
    }[];
  };
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ProgressPage: React.FC = () => {
  // Only use useAuth for possible future use, but don't destructure unused values
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const [appState] = useLocalStorage<AppState>('cissp-study-app', {
    mode: 'quiz',
    currentUser: null,
    users: [],
    sessions: [],
    messages: [],
    questions: [],
    currentQuiz: null,
    isAuthenticated: false,
    showAuth: false
  });
  // Fallback user for Header if currentUser is null
  const fallbackUser = {
    id: 'unknown',
    name: 'User',
    email: '',
    role: 'leader' as const,
    createdAt: new Date(),
    points: 0,
    sessionsLed: 0,
    questionsContributed: 0,
    achievements: [],
    avatar_url: ''
  };
  const [history, setHistory] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('quiz-progress-history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('quiz-progress-history');
    setHistory([]);
  };

  // Prepare data for chart
  const chartData = history.map((entry, i) => ({
    x: i,
    y: Math.round((entry.results.correctAnswers / entry.results.totalQuestions) * 100),
    date: formatDate(entry.timestamp),
  }));

  // Latest summary
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const latestPercent = latest ? Math.round((latest.results.correctAnswers / latest.results.totalQuestions) * 100) : null;
  const averagePercent = history.length > 0 ? Math.round(history.reduce((sum, e) => sum + (e.results.correctAnswers / e.results.totalQuestions) * 100, 0) / history.length) : null;
  const totalQuizzes = history.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* App Header */}
      <Header
        mode={appState.mode}
        onModeChange={() => {}}
        currentUser={appState.currentUser || fallbackUser}
        onLogout={() => {}}
        hasActiveSubscription={hasActiveSubscription}
        subscriptionLoading={subscriptionLoading}
      />
      {hasActiveSubscription ? (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow hover:bg-blue-50 transition-colors border border-gray-200 text-blue-700 font-semibold text-base group"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>
          </div>
          {/* Local Storage Alert */}
          <div className="mb-6">
            <div className="flex items-center bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm animate-fade-in">
              <svg className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              <span className="text-yellow-800 text-sm font-medium">
                Your progress is stored only in your browser. It is <strong>not backed up or synced online yet</strong>. Please do not clear your browser data if you wish to keep your progress.
              </span>
            </div>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Progress</h1>
            <p className="text-gray-600">Track your quiz performance and improvement over time</p>
          </div>
          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center"><Trophy className="w-6 h-6 text-yellow-500 mr-2" /> Latest Score</h2>
              {latest ? (
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="text-5xl font-bold text-blue-600 mb-2 md:mb-0">{latestPercent}%</div>
                  <div className="space-y-1">
                    <div className="text-gray-700 text-lg">{latest.results.correctAnswers} / {latest.results.totalQuestions} correct</div>
                    <div className="text-gray-500 text-sm flex items-center"><Clock className="w-4 h-4 mr-1" /> {formatTime(latest.results.timeSpent)} total</div>
                    <div className="text-gray-500 text-sm">{formatDate(latest.timestamp)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-lg">No quizzes taken yet</div>
              )}
            </div>
            <div className="flex-1 text-center md:text-right">
              <div className="text-gray-700 text-lg mb-1">Total Quizzes: <span className="font-bold text-blue-700">{totalQuizzes}</span></div>
              <div className="text-gray-700 text-lg mb-1">Average Score: <span className="font-bold text-purple-700">{averagePercent !== null ? `${averagePercent}%` : '--'}</span></div>
              <button
                onClick={clearHistory}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center mx-auto md:mx-0"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Clear Progress History
              </button>
            </div>
          </div>
          {/* Chart Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BarChart2 className="w-5 h-5 text-blue-600 mr-2" /> Progress Chart</h2>
            <div className="w-full h-48 flex items-end">
              <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                {/* Axes */}
                <line x1="30" y1="10" x2="30" y2="150" stroke="#ccc" strokeWidth="2" />
                <line x1="30" y1="150" x2="390" y2="150" stroke="#ccc" strokeWidth="2" />
                {/* Data */}
                {chartData.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    points={chartData.map((d, i) => `${30 + (i * 340 / (chartData.length - 1))},${150 - (d.y * 1.4)}`).join(' ')}
                  />
                )}
                {/* Dots */}
                {chartData.map((d, i) => (
                  <circle
                    key={i}
                    cx={30 + (i * 340 / (chartData.length - 1 || 1))}
                    cy={150 - (d.y * 1.4)}
                    r="4"
                    fill="#6366f1"
                  />
                ))}
                {/* Y-axis labels */}
                {[0, 25, 50, 75, 100].map((val) => (
                  <text key={val} x="0" y={150 - val * 1.4 + 5} fontSize="12" fill="#888">{val}%</text>
                ))}
              </svg>
            </div>
          </div>
          {/* History Table Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Clock className="w-5 h-5 text-purple-600 mr-2" /> Quiz History</h2>
            {history.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No progress yet. Complete quizzes and track your progress here!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Percent</th>
                      <th className="px-4 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map((entry, i) => {
                      const percent = Math.round((entry.results.correctAnswers / entry.results.totalQuestions) * 100);
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2 whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                          <td className="px-4 py-2">{entry.results.correctAnswers}</td>
                          <td className="px-4 py-2">{entry.results.totalQuestions}</td>
                          <td className="px-4 py-2">{percent}%</td>
                          <td className="px-4 py-2">{Math.round(entry.results.timeSpent)}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <PaywallPage />
      )}
    </div>
  );
};

export default ProgressPage; 