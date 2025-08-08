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

  // Redirect legacy /progress to the in-app tab
  window.location.replace('/?tab=progress');
  return null;
};

export default ProgressPage; 