import { Question } from '../types';

const LOCAL_KEY = 'daily-quiz';

function getTodayStr() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().slice(0, 10);
}

export function getLocalDailyQuizQuestions(allQuestions: Question[]): Question[] {
  const todayStr = getTodayStr();
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
  } catch {}
  if (stored && stored.date === todayStr && Array.isArray(stored.ids) && stored.ids.length === 3) {
    return stored.ids.map((id: string) => allQuestions.find(q => q.id === id)).filter(Boolean);
  }
  // Pick 3 random questions
  const activeQuestions = allQuestions.filter(q => q.isActive && !q.isFlagged);
  if (activeQuestions.length < 3) return [];
  const shuffled = activeQuestions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(q => q.id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ date: todayStr, ids: selected }));
  return selected.map(id => activeQuestions.find(q => q.id === id)).filter((q): q is Question => Boolean(q));
} 