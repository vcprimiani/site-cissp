import { supabase } from '../lib/supabase';

export interface QuizProgressResult {
  id?: string;
  user_id: string;
  timestamp: string;
  results: any;
  dev_mode: boolean;
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