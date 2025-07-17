CREATE OR REPLACE VIEW public.referral_report AS
SELECT
  ur.user_id,
  ur.ref_code,
  ur.created_at,
  u.email
FROM public.user_referrals ur
JOIN auth.users u ON ur.user_id = u.id; 