-- Create table for user quiz progress history
CREATE TABLE IF NOT EXISTS public.quiz_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  results jsonb NOT NULL,
  dev_mode boolean NOT NULL DEFAULT false
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_quiz_progress_user_id ON public.quiz_progress(user_id);

-- Index for dev_mode filtering
CREATE INDEX IF NOT EXISTS idx_quiz_progress_dev_mode ON public.quiz_progress(dev_mode);

-- Policy: Only allow users to access their own quiz progress
CREATE POLICY "Users can view their own quiz progress" ON public.quiz_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own quiz progress" ON public.quiz_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own quiz progress" ON public.quiz_progress
  FOR DELETE USING (user_id = auth.uid());

-- Enable RLS
ALTER TABLE public.quiz_progress ENABLE ROW LEVEL SECURITY; 