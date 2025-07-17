-- Create table for user referral tracking
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ref_code text NOT NULL,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Unique index to ensure one referral per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referrals_user_id ON public.user_referrals(user_id);

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to view their own referral
CREATE POLICY "Users can view their own referral" ON public.user_referrals
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Only allow users to insert their own referral
CREATE POLICY "Users can insert their own referral" ON public.user_referrals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Only allow users to update their own referral
CREATE POLICY "Users can update their own referral" ON public.user_referrals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policy: Only allow users to delete their own referral
CREATE POLICY "Users can delete their own referral" ON public.user_referrals
  FOR DELETE USING (user_id = auth.uid()); 