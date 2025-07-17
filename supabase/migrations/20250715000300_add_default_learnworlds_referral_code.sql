-- Add default LearnWorlds referral code
INSERT INTO public.referral_codes (code, description, partner_name, is_active) 
VALUES ('learnworlds', 'Default referral code for LearnWorlds integration', 'LearnWorlds', true)
ON CONFLICT (code) DO NOTHING; 