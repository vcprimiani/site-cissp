-- Create table for daily free quiz
CREATE TABLE IF NOT EXISTS public.daily_free_quiz (
  date date PRIMARY KEY,
  question_ids uuid[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
); 