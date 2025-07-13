-- Create table for question ratings (thumbs up/down)
create table if not exists public.question_ratings (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer not null check (rating in (1, -1)),
  created_at timestamp with time zone default timezone('utc', now()),
  unique (question_id, user_id)
);

-- Enable RLS
alter table public.question_ratings enable row level security;

-- Policy: Only allow users to view their own ratings
create policy "Users can view their own ratings" on public.question_ratings
  for select using (user_id = auth.uid());

-- Policy: Only allow users to insert/update/delete their own ratings
create policy "Users can insert their own ratings" on public.question_ratings
  for insert with check (user_id = auth.uid());

create policy "Users can update their own ratings" on public.question_ratings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete their own ratings" on public.question_ratings
  for delete using (user_id = auth.uid());

-- Index for quick lookup by question
create index if not exists idx_question_ratings_question_id on public.question_ratings(question_id);
-- Index for quick lookup by user
create index if not exists idx_question_ratings_user_id on public.question_ratings(user_id); 