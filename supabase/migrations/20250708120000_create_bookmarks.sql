create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc', now()),
  unique (user_id, question_id)
); 