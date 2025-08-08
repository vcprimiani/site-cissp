-- Function to update streaks when a quiz is completed
create or replace function public.fn_update_streak_on_quiz(p_user_id uuid)
returns public.user_study_goals
language plpgsql
security definer
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_row public.user_study_goals;
begin
  -- Ensure row exists
  insert into public.user_study_goals(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  -- Update streaks based on last_quiz_date
  update public.user_study_goals as g
  set
    streak_current = case
      when g.last_quiz_date = v_today - 1 then g.streak_current + 1
      when g.last_quiz_date = v_today then g.streak_current -- multiple quizzes today: keep
      else 1
    end,
    streak_best = greatest(g.streak_best, case
      when g.last_quiz_date = v_today - 1 then g.streak_current + 1
      when g.last_quiz_date = v_today then g.streak_current
      else 1
    end),
    last_quiz_date = v_today,
    updated_at = now()
  where g.user_id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

