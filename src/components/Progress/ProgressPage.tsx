import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Clock, BarChart2, Trash2, ArrowLeft, Brain, Target } from 'lucide-react';
import { Header } from '../Layout/Header';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AppState } from '../../types';
import { PaywallPage } from '../Paywall/PaywallPage';
import { BookmarksProvider } from '../../hooks/useBookmarks';
import { fetchQuizProgress, getOrInitUserStudyGoals, updateDailyTarget } from '../../services/progress';
import { generateAIResponse } from '../../services/openai';

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
  const { isActive: hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [goals, setGoals] = useState<{ daily_target: number; streak_current: number; streak_best: number } | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      if (user && user.id) {
        try {
          const cloudHistory = await fetchQuizProgress({ user_id: user.id, dev_mode: false });
          // Map Supabase results to ProgressEntry[]
          setHistory(cloudHistory.map(entry => ({
            timestamp: new Date(entry.timestamp).getTime(),
            results: entry.results
          })));
          const g = await getOrInitUserStudyGoals(user.id);
          setGoals({ daily_target: g.daily_target, streak_current: g.streak_current, streak_best: g.streak_best });
        } catch (err: any) {
          setError('Failed to load progress from cloud.');
          setHistory([]);
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('quiz-progress-history');
        if (stored) {
          try {
            setHistory(JSON.parse(stored));
          } catch {
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      }
      setLoading(false);
    };
    loadHistory();
  }, [user?.id]);

  // Aggregations
  const domainStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    for (const session of history) {
      for (const qr of session.results.questionResults || []) {
        const domain = qr?.question?.domain || 'Unknown';
        if (!stats[domain]) stats[domain] = { total: 0, correct: 0 };
        stats[domain].total += 1;
        if (qr.isCorrect) stats[domain].correct += 1;
      }
    }
    const entries = Object.entries(stats).map(([domain, { total, correct }]) => ({
      domain,
      total,
      correct,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0
    }));
    const sortedWeak = entries.slice().sort((a, b) => a.pct - b.pct);
    return {
      byDomain: entries,
      weakestTop3: sortedWeak.slice(0, 3)
    };
  }, [history]);

  const startAdaptiveQuiz = () => {
    const weakDomains = domainStats.weakestTop3.map(d => d.domain).filter(d => d !== 'Unknown');
    localStorage.setItem('adaptive-preferred-domains', JSON.stringify(weakDomains));
    window.location.assign('/');
  };

  const generateStudyPlan = async () => {
    if (history.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const recent = history.slice(-8);
      const avg = recent.reduce((s, e) => s + (e.results.correctAnswers / e.results.totalQuestions) * 100, 0) / recent.length;
      const best = Math.max(...recent.map(e => Math.round((e.results.correctAnswers / e.results.totalQuestions) * 100)));
      const worst = Math.min(...recent.map(e => Math.round((e.results.correctAnswers / e.results.totalQuestions) * 100)));
      const summary = {
        averageRecentPercent: Math.round(avg || 0),
        bestRecentPercent: isFinite(best) ? best : 0,
        worstRecentPercent: isFinite(worst) ? worst : 0,
        weakestDomains: domainStats.weakestTop3
      };
      const prompt = `You are a CISSP study coach. Based on this learner's recent progress, design a 7-day adaptive study plan with daily tasks, targeted practice, and review loops. Keep it concise and actionable.\n\nSummary JSON:\n${JSON.stringify(summary, null, 2)}\n\nOutput format:\n- Overall strategy (3-5 bullets)\n- Day-by-day plan (Day 1..Day 7) with concrete tasks (study, practice counts, review)\n- Focus topics per day aligned to weakest domains\n- Quick motivation tip`;
      const ai = await generateAIResponse(prompt, 'CISSP adaptive study plan');
      if (ai.error) throw new Error(ai.error);
      setAiPlan(ai.content);
    } catch (e: any) {
      setAiError(e.message || 'Failed to generate plan');
      setAiPlan(null);
    } finally {
      setAiLoading(false);
    }
  };

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
    <BookmarksProvider>
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
        {loading && (
          <div className="text-center text-gray-500 py-8">Loading progress...</div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 rounded-xl p-4 mb-4 text-center">{error}</div>
        )}
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
            {/* Cloud Sync Info */}
            <div className="mb-6">
              <div className="flex items-center bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm animate-fade-in">
                <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h10a4 4 0 100-8 5 5 0 10-9.9 1H7a3 3 0 000 6h10a3 3 0 100-6" /></svg>
                <span className="text-blue-800 text-sm font-medium">
                  Your quiz results are automatically saved to your account after each quiz. Recent sessions appear below.
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
              {goals && (
                <div className="mt-3 text-sm text-gray-700 flex flex-wrap items-center justify-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200">Streak: <strong>{goals.streak_current}</strong> days (Best {goals.streak_best})</span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200">Daily target: 
                    <input
                      type="number"
                      min={3}
                      max={100}
                      value={goals.daily_target}
                      onChange={async (e) => {
                        const val = Math.max(3, Math.min(100, parseInt(e.target.value || '0', 10)));
                        setGoals(prev => prev ? { ...prev, daily_target: val } : prev);
                        if (user?.id) {
                          try { await updateDailyTarget(user.id, val); } catch {}
                        }
                      }}
                      className="ml-2 w-16 px-2 py-0.5 text-center border rounded"
                    />
                    questions
                  </span>
                </div>
              )}
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
                {domainStats.byDomain.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">Weakest domains: {domainStats.weakestTop3.map(d => `${d.domain} (${d.pct}%)`).join(', ') || 'n/a'}</div>
                )}
                {domainStats.weakestTop3.length > 0 && (
                  <button onClick={startAdaptiveQuiz} className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors inline-flex items-center">
                    <Target className="w-4 h-4 mr-2" /> Practice Weak Areas
                  </button>
                )}
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
            {/* Domain Performance */}
            {domainStats.byDomain.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Brain className="w-5 h-5 text-purple-600 mr-2" /> Domain Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {domainStats.byDomain.map(d => (
                    <div key={d.domain} className="border rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                      <div className="text-sm font-semibold text-gray-800 mb-1">{d.domain}</div>
                      <div className={`text-2xl font-bold ${d.pct >= 80 ? 'text-green-600' : d.pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{d.pct}%</div>
                      <div className="text-xs text-gray-500">{d.correct} / {d.total} correct</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* AI Study Coach */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl p-8 mb-12">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Brain className="w-5 h-5 text-blue-600 mr-2" /> AI Study Coach</h2>
              <p className="text-gray-700 mb-4">Get a tailored 7‑day plan focused on your weakest domains and recent performance.</p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={generateStudyPlan}
                  disabled={aiLoading || history.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {aiLoading ? 'Generating…' : 'Generate Study Plan'}
                </button>
                {aiError && <span className="text-red-600 text-sm">{aiError}</span>}
              </div>
              {aiPlan && (
                <div className="bg-white border rounded-xl p-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {aiPlan}
                </div>
              )}
            </div>
          </div>
        ) : (
          <PaywallPage />
        )}
      </div>
    </BookmarksProvider>
  );
};

export default ProgressPage; 