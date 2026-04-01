
-- Create community_drops table
CREATE TABLE public.community_drops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_drops ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own drops
CREATE POLICY "Users can insert own drops"
ON public.community_drops
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Anyone can view approved drops
CREATE POLICY "Anyone can view approved drops"
ON public.community_drops
FOR SELECT
TO authenticated
USING (status = 'approved' OR user_id = auth.uid());

-- Allow anon to view approved drops too
CREATE POLICY "Anon can view approved drops"
ON public.community_drops
FOR SELECT
TO anon
USING (status = 'approved');

-- Admins can update status (approve/reject)
CREATE POLICY "Admins can update drops"
ON public.community_drops
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete drops
CREATE POLICY "Admins can delete drops"
ON public.community_drops
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own pending drops
CREATE POLICY "Users can delete own pending drops"
ON public.community_drops
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- Add setting for auto-approve toggle
INSERT INTO public.site_settings (key, value)
VALUES ('community_auto_approve', 'false')
ON CONFLICT (key) DO NOTHING;
