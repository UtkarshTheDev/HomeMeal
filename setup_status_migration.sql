-- SQL for adding setup_status column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS setup_status JSONB DEFAULT '{}';
COMMENT ON COLUMN public.users.setup_status IS 'Object tracking onboarding stages completion with boolean flags';
-- Migrate existing setup stage data to the new JSONB format
UPDATE public.users SET setup_status = jsonb_build_object(
  'role_selected', role IS NOT NULL,
  'location_set', location IS NOT NULL AND address IS NOT NULL,
  'profile_completed', name IS NOT NULL,
  'meal_creation_completed', COALESCE(meal_creation_complete, false),
  'maker_selection_completed', COALESCE(maker_selection_complete, false),
  'wallet_setup_completed', COALESCE(wallet_setup_complete, false)
);
-- Drop old boolean columns if they exist
ALTER TABLE public.users DROP COLUMN IF EXISTS meal_creation_complete;
ALTER TABLE public.users DROP COLUMN IF EXISTS maker_selection_complete;
ALTER TABLE public.users DROP COLUMN IF EXISTS wallet_setup_complete;
ALTER TABLE public.users DROP COLUMN IF EXISTS profile_setup_stage;
