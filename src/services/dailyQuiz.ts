import { supabase } from '../lib/supabase';

export async function fetchDailyQuizQuestionIds() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const { data, error } = await supabase
    .from('daily_free_quiz')
    .select('question_ids')
    .eq('date', todayStr)
    .maybeSingle();
  if (error) throw error;
  return data?.question_ids || [];
}

export async function fetchQuestionsByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  // Return in the same order as ids
  return ids.map(id => data.find((q: any) => q.id === id)).filter(Boolean);
} 