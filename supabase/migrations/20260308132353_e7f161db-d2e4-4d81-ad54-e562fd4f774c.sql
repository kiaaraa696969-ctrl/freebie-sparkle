
CREATE TABLE public.quick_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '#',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active quick links"
  ON public.quick_links
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quick links"
  ON public.quick_links
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Seed default links
INSERT INTO public.quick_links (label, href, sort_order) VALUES
  ('Join Discord', '#', 1),
  ('Telegram Channel', '#', 2),
  ('Request Account', '#', 3);
