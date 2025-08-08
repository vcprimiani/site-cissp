import React, { useEffect, useMemo, useState } from 'react';
import { AppState } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { fetchQuizProgress, getOrInitUserStudyGoals, updateDailyTarget } from '../../services/progress';
import { generateAIResponse, getAIUsageInfo } from '../../services/openai';
import { Brain, Calendar, Target, TrendingUp, Award, Flame, Clock, BarChart2, CheckCircle2, AlertTriangle, ChevronRight, LineChart, Zap, FileText, ListChecks, Sparkles } from 'lucide-react';

type ProgressEntry = {
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
};

interface ProgressTabProps {
  appState: AppState;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
  incorrectQuestions: any[];
}

const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Simple donut mastery gauge
const MasteryGauge: React.FC<{ percent: number }> = ({ percent }) => {
  const size = 130;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp(percent, 0, 100);
  const dash = (p / 100) * c;
  const zone = p >= 85 ? 'text-green-600' : p >= 70 ? 'text-yellow-600' : 'text-red-600';
  const trackColor = '#E5E7EB';
  const progressColor = p >= 85 ? '#16A34A' : p >= 70 ? '#D97706' : '#DC2626';
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
          <circle r={r} cx={0} cy={0} stroke={trackColor} strokeWidth={stroke} fill="none" />
          <circle
            r={r}
            cx={0}
            cy={0}
            stroke={progressColor}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-3xl font-bold ${zone}`}>{p}%</div>
        <div className="text-xs text-gray-500">Mastery</div>
      </div>
    </div>
  );
};

// Tiny sparkline
const Sparkline: React.FC<{ values: number[] }>= ({ values }) => {
  const width = 160;
  const height = 40;
  const pad = 4;
  const n = values.length;
  if (n === 0) return <div className="h-10" />;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const points = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, n - 1);
    const y = height - pad - ((v - min) / Math.max(1, max - min)) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="text-blue-600">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
};

export const ProgressTab: React.FC<ProgressTabProps> = ({ appState, hasActiveSubscription, subscriptionLoading, incorrectQuestions }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [goals, setGoals] = useState<{ daily_target: number; streak_current: number; streak_best: number } | null>(null);
  const [examDate, setExamDate] = useState<string>(() => localStorage.getItem('cissp-exam-date') || '');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user?.id) {
          const cloudHistory = await fetchQuizProgress({ user_id: user.id, dev_mode: false });
          setHistory(cloudHistory.map(entry => ({ timestamp: new Date(entry.timestamp).getTime(), results: entry.results })));
          const g = await getOrInitUserStudyGoals(user.id);
          setGoals({ daily_target: g.daily_target, streak_current: g.streak_current, streak_best: g.streak_best });
        } else {
          const stored = localStorage.getItem('quiz-progress-history');
          if (stored) setHistory(JSON.parse(stored));
        }
      } catch (e: any) {
        setError('Failed to load progress');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const summary = useMemo(() => {
    if (history.length === 0) return { latestPct: 0, avgPct: 0, total: 0 };
    const latest = history[history.length - 1];
    const latestPct = Math.round((latest.results.correctAnswers / latest.results.totalQuestions) * 100);
    const avgPct = Math.round(history.reduce((s, e) => s + (e.results.correctAnswers / e.results.totalQuestions) * 100, 0) / history.length);
    return { latestPct, avgPct, total: history.length };
  }, [history]);

  const trend = useMemo(() => history.map(h => Math.round((h.results.correctAnswers / h.results.totalQuestions) * 100)), [history]);

  const domainStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number }>= {};
    for (const session of history) {
      for (const qr of session.results.questionResults || []) {
        const domain = qr?.question?.domain || 'Unknown';
        if (!stats[domain]) stats[domain] = { total: 0, correct: 0 };
        stats[domain].total += 1;
        if (qr.isCorrect) stats[domain].correct += 1;
      }
    }
    const entries = Object.entries(stats).map(([domain, { total, correct }]) => ({ domain, total, correct, pct: total ? Math.round((correct / total) * 100) : 0 }));
    const fullDomains = [
      'Security and Risk Management',
      'Asset Security',
      'Security Architecture and Engineering',
      'Communication and Network Security',
      'Identity and Access Management (IAM)',
      'Security Assessment and Testing',
      'Security Operations',
      'Software Development Security'
    ];
    const byDomain = fullDomains.map(name => entries.find(e => e.domain === name) || { domain: name, total: 0, correct: 0, pct: 0 });
    const weakestTop3 = byDomain.slice().sort((a, b) => a.pct - b.pct).slice(0, 3);
    return { byDomain, weakestTop3 };
  }, [history]);

  const daysToExam = useMemo(() => {
    if (!examDate) return null;
    const d = new Date(examDate).getTime();
    const diff = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [examDate]);

  const projectedDaysTo85 = useMemo(() => {
    if (trend.length < 4) return null;
    // Simple linear approximation per session
    const deltas = trend.slice(1).map((v, i) => v - trend[i]);
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avgDelta <= 0) return null;
    return Math.ceil(Math.max(0, 85 - summary.avgPct) / avgDelta);
  }, [trend, summary.avgPct]);

  const handleGeneratePlan = async () => {
    if (history.length === 0) return;
    setAiLoading(true);
    try {
      const weak = domainStats.weakestTop3.map(d => `${d.domain} (${d.pct}%)`).join(', ');
      const prompt = `Create a concise 7-day CISSP study plan tailored to these weakest domains: ${weak}. Base it on an average accuracy of ${summary.avgPct}%. Include daily question counts and quick motivation.`;
      const ai = await generateAIResponse(prompt, 'Personalized study plan');
      if (ai.error) throw new Error(ai.error);
      setAiPlan(ai.content);
    } catch (e: any) {
      setAiPlan(null);
    } finally {
      setAiLoading(false);
    }
  };

  const startSmartPractice = () => {
    const weakDomains = domainStats.weakestTop3.map(d => d.domain).filter(Boolean);
    localStorage.setItem('adaptive-preferred-domains', JSON.stringify(weakDomains));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const estimatedScaledScore = useMemo(() => {
    // Rough mapping: 200 + 8 * percent
    return clamp(Math.round(200 + 8 * (summary.avgPct || 0)), 200, 1000);
  }, [summary.avgPct]);

  const aiUsage = getAIUsageInfo?.() || { totalRequests: 0 } as any;
  const badges = useMemo(() => {
    const earned: { id: string; label: string; icon: React.ReactNode }[] = [];
    if ((goals?.streak_current || 0) >= 7) earned.push({ id: 'streak-7', label: '7-Day Streak', icon: <Flame className="w-4 h-4 text-orange-500" /> });
    if (summary.avgPct >= 85) earned.push({ id: 'mastery-85', label: 'Mastery 85%+', icon: <Award className="w-4 h-4 text-yellow-500" /> });
    if ((aiUsage.totalRequests || 0) >= 50) earned.push({ id: 'ai-50', label: 'AI Expert Learner', icon: <Brain className="w-4 h-4 text-purple-600" /> });
    return earned;
  }, [goals?.streak_current, summary.avgPct, aiUsage.totalRequests]);

  return (
    <div className="space-y-8">
      {/* Header Snapshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-lg font-bold">
              {appState.currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-gray-900 font-semibold text-lg">Hi, {appState.currentUser?.name || 'Learner'}</div>
              <div className="text-sm text-gray-600">Overall mastery: <span className="font-semibold text-gray-900">{summary.avgPct}%</span></div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <MasteryGauge percent={summary.avgPct} />
            </div>
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              {daysToExam !== null ? (
                <div>
                  <div className="text-sm text-gray-600">Exam in</div>
                  <div className="text-xl font-bold text-blue-700">{daysToExam} days</div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Set exam date:</span>
                  <input
                    type="date"
                    className="border rounded-md px-2 py-1 text-sm"
                    value={examDate}
                    onChange={e => { setExamDate(e.target.value); localStorage.setItem('cissp-exam-date', e.target.value); }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-900">AI-Driven Insights</h3>
          </div>
          <div className="text-sm text-gray-700 mb-4">Your weakest domains: {domainStats.weakestTop3.map(d => `${d.domain} (${d.pct}%)`).join(', ') || 'n/a'}</div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGeneratePlan}
              disabled={aiLoading || history.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              title="Generate 7-day plan"
            >
              <Sparkles className="w-4 h-4" /> {aiLoading ? 'Generating…' : 'AI Study Plan'}
            </button>
            {projectedDaysTo85 !== null && (
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <TrendingUp className="w-4 h-4 text-green-600" /> At current pace you may hit 85% in ~{projectedDaysTo85} sessions
              </div>
            )}
          </div>
          {aiPlan && (
            <div className="mt-4 border rounded-xl p-4 bg-gradient-to-br from-purple-50 to-blue-50 whitespace-pre-wrap text-sm leading-6 text-gray-800">
              {aiPlan}
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><LineChart className="w-5 h-5 text-blue-600" /><span className="font-semibold text-gray-900">Improvement</span></div>
            <span className="text-sm text-gray-500">Last {trend.length} sessions</span>
          </div>
          <div className="mt-3"><Sparkline values={trend} /></div>
          <div className="mt-2 text-sm text-gray-600">Latest: {summary.latestPct}% • Average: {summary.avgPct}% • Sessions: {summary.total}</div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Progress by CISSP Domain</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {domainStats.byDomain.map(d => (
            <div key={d.domain} className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
              <div className="text-sm font-semibold text-gray-800 mb-2">{d.domain}</div>
              <div className="flex items-end justify-between mb-2">
                <div className={`text-2xl font-bold ${d.pct >= 85 ? 'text-green-600' : d.pct >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{d.pct}%</div>
                <div className="text-xs text-gray-500">{d.correct}/{d.total} correct</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${d.pct}%` }} />
              </div>
              <button
                className="mt-3 inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900"
                onClick={() => {
                  localStorage.setItem('adaptive-preferred-domains', JSON.stringify([d.domain]));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Practice now <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed and Motivation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-900">Recent Activity</h3></div>
          {history.length === 0 ? (
            <div className="text-gray-500 text-sm">No activity yet. Take a quiz to get started.</div>
          ) : (
            <ul className="space-y-3">
              {history.slice().reverse().slice(0, 8).map((entry, i) => {
                const pct = Math.round((entry.results.correctAnswers / entry.results.totalQuestions) * 100);
                return (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${pct >= 70 ? 'text-green-600' : 'text-yellow-600'}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.results.correctAnswers}/{entry.results.totalQuestions} correct</div>
                        <div className="text-xs text-gray-500">{formatDate(entry.timestamp)} • {formatTime(entry.results.timeSpent)} • Avg {pct}%</div>
                      </div>
                    </div>
                    {pct < 70 && (
                      <div className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-4 h-4" /> Focus session</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3"><Flame className="w-5 h-5 text-orange-500" /><h3 className="font-semibold text-gray-900">Motivation</h3></div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="px-2 py-1 rounded-lg bg-green-50 border border-green-200">Streak: <strong>{goals?.streak_current || 0}</strong> (Best {goals?.streak_best || 0})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.length === 0 && <div className="text-xs text-gray-500">No badges yet. Keep going!</div>}
            {badges.map(b => (
              <span key={b.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-gray-800">
                {b.icon} {b.label}
              </span>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500">AI sessions: {aiUsage.totalRequests || 0}</div>
          {goals && (
            <div className="mt-4 text-sm text-gray-700">
              Daily target:
              <input
                type="number"
                min={3}
                max={100}
                className="ml-2 w-16 px-2 py-1 border rounded"
                value={goals.daily_target}
                onChange={async (e) => {
                  const v = clamp(parseInt(e.target.value || '0', 10), 3, 100);
                  try { setGoals(prev => prev ? { ...prev, daily_target: v } : prev); if (user?.id) await updateDailyTarget(user.id, v); } catch {}
                }}
              /> questions/day
            </div>
          )}
        </div>
      </div>

      {/* Exam Simulation Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Mock Exam Readiness</h3></div>
          <div className="text-sm text-gray-500">Estimated score: <span className="font-semibold text-gray-900">{estimatedScaledScore}/1000</span></div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
          <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-600" style={{ width: `${clamp(summary.avgPct, 0, 100)}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-600">Based on recent sessions, aim for consistent 85%+ to cross the passing threshold.</p>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 hover:shadow-md transition"
          onClick={startSmartPractice}
        >
          <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-green-600" /><div className="text-left"><div className="font-semibold text-gray-900">AI Smart Practice</div><div className="text-xs text-gray-600">Focus on your weakest areas</div></div></div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
        <a
          href="https://cissp-exam.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md transition"
        >
          <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-yellow-600" /><div className="text-left"><div className="font-semibold text-gray-900">Full Mock Exam</div><div className="text-xs text-gray-600">Timed 250-question simulation</div></div></div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </a>
        <button
          className="flex items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 hover:shadow-md transition"
          onClick={() => {
            // Surface the AI tab intent via localStorage flag, QuizMode can read it if needed
            localStorage.setItem('ai-open-review', '1');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="flex items-center gap-3"><ListChecks className="w-5 h-5 text-purple-600" /><div className="text-left"><div className="font-semibold text-gray-900">Review Missed Questions</div><div className="text-xs text-gray-600">AI explains with analogies</div></div></div>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default ProgressTab;


