
-- Add unique constraint on display_name (case-insensitive) using a unique index
CREATE UNIQUE INDEX idx_profiles_display_name_unique ON public.profiles (lower(display_name)) WHERE display_name IS NOT NULL;

-- Create a function to check if a username is available
CREATE OR REPLACE FUNCTION public.is_username_available(username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(display_name) = lower(username)
  )
$$;
