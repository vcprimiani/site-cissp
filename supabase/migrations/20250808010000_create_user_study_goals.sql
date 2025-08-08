-- User study goals and streaks
create table if not exists public.user_study_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_target integer not null default 10,
  streak_current integer not null default 0,
  streak_best integer not null default 0,
  last_quiz_date date,
  updated_at timestamptz not null default now()
);

alter table public.user_study_goals enable row level security;

-- Policies: users can manage their own row
create policy "Users can view own study goals" on public.user_study_goals
  for select using (user_id = auth.uid());

create policy "Users can insert own study goals" on public.user_study_goals
  for insert with check (user_id = auth.uid());

create policy "Users can update own study goals" on public.user_study_goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Helpful index
create index if not exists idx_user_study_goals_user on public.user_study_goals(user_id);

