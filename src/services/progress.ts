import { supabase } from '../lib/supabase';

export interface QuizProgressResult {
  id?: string;
  user_id: string;
  timestamp: string;
  results: any;
  dev_mode: boolean;
}

// Save a quiz result to Supabase
export async function saveQuizProgress({ user_id, results, dev_mode = true }: { user_id: string; results: any; dev_mode?: boolean }) {
  const { data, error } = await supabase
    .from('quiz_progress')
    .insert([
      {
        user_id,
        results,
        dev_mode,
        timestamp: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as QuizProgressResult;
}

// Fetch quiz results for the current user
export async function fetchQuizProgress({ user_id, dev_mode = true }: { user_id: string; dev_mode?: boolean }) {
  const { data, error } = await supabase
    .from('quiz_progress')
    .select('*')
    .eq('user_id', user_id)
    .eq('dev_mode', dev_mode)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data as QuizProgressResult[];
} 