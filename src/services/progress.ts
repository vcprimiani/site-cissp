import { supabase } from '../lib/supabase';

export interface QuizProgressResult {
  id?: string;
  user_id: string;
  timestamp: string;
  results: any;
  dev_mode: boolean;
}

export interface UserStudyGoals {
  user_id: string;
  daily_target: number;
  streak_current: number;
  streak_best: number;
  last_quiz_date: string | null;
}

// Save a quiz result to Supabase
export async function saveQuizProgress({ user_id, results, dev_mode = false }: { user_id: string; results: any; dev_mode?: boolean }) {
  // Primary table is session-level: quiz_sessions
  const now = new Date().toISOString();
  const payload: any = { user_id, results, dev_mode, timestamp: now };
  try {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as QuizProgressResult;
  } catch (err: any) {
    const message: string = err?.message || '';
    // No sensible fallback to per-question table; bubble up
    throw err;
  }
}

// Fetch quiz results for the current user
export async function fetchQuizProgress({ user_id, dev_mode = false }: { user_id: string; dev_mode?: boolean }) {
  // Query session-level table; filter on dev_mode to exclude seeded data when desired
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', user_id)
    .eq('dev_mode', dev_mode)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return data as QuizProgressResult[];
}

// Study goals: get or create default
export async function getOrInitUserStudyGoals(user_id: string): Promise<UserStudyGoals> {
  const { data, error } = await supabase
    .from('user_study_goals')
    .select('*')
    .eq('user_id', user_id)
    .single();
  if (!error && data) return data as UserStudyGoals;
  // insert default
  const { data: ins, error: insErr } = await supabase
    .from('user_study_goals')
    .insert([{ user_id }])
    .select('*')
    .single();
  if (insErr) throw insErr;
  return ins as UserStudyGoals;
}

// Update daily target
export async function updateDailyTarget(user_id: string, daily_target: number): Promise<UserStudyGoals> {
  const { data, error } = await supabase
    .from('user_study_goals')
    .update({ daily_target, updated_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .select('*')
    .single();
  if (error) throw error;
  return data as UserStudyGoals;
}

// Increment streak logic on successful quiz save
export async function updateStreakOnQuiz(user_id: string): Promise<UserStudyGoals | null> {
  // Calculate in SQL to avoid race conditions
  const { data, error } = await supabase.rpc('fn_update_streak_on_quiz', { p_user_id: user_id });
  if (error) return null;
  return data as UserStudyGoals;
}