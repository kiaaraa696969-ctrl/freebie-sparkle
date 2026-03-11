CREATE TABLE public.ad_redirect_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  blocked_url text NOT NULL,
  source_slot text,
  block_type text NOT NULL DEFAULT 'unknown',
  user_agent text,
  page_url text
);

ALTER TABLE public.ad_redirect_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert redirect logs"
  ON public.ad_redirect_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read redirect logs"
  ON public.ad_redirect_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete redirect logs"
  ON public.ad_redirect_logs
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));