import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Check if today's quiz already exists
  const { data: existing, error: existingError } = await supabase
    .from('daily_free_quiz')
    .select('question_ids')
    .eq('date', todayStr)
    .maybeSingle();

  if (existingError) {
    return new Response(JSON.stringify({ error: existingError.message }), { status: 500 });
  }

  if (existing) {
    return new Response(JSON.stringify({ question_ids: existing.question_ids, alreadyExists: true }), { status: 200 });
  }

  // Select 3 random active questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id')
    .eq('is_active', true);

  if (questionsError) {
    return new Response(JSON.stringify({ error: questionsError.message }), { status: 500 });
  }

  if (!questions || questions.length < 3) {
    return new Response(JSON.stringify({ error: 'Not enough questions in the bank.' }), { status: 400 });
  }

  // Shuffle and pick 3
  const shuffled = questions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(q => q.id);

  // Insert today's quiz
  const { error: insertError } = await supabase
    .from('daily_free_quiz')
    .insert([{ date: todayStr, question_ids: selected }]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ question_ids: selected, alreadyExists: false }), { status: 200 });
}); 