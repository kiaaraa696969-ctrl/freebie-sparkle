
-- Create accounts table for drops
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  email TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  notes TEXT,
  screenshot TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  dropped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  thumbnail TEXT,
  games TEXT,
  netflix_type TEXT,
  cookie_file TEXT,
  cookie_file_name TEXT,
  plan_details TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Anyone can read accounts
CREATE POLICY "Anyone can read accounts"
  ON public.accounts FOR SELECT
  USING (true);

-- Admins can manage accounts
CREATE POLICY "Admins can manage accounts"
  ON public.accounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::text));
