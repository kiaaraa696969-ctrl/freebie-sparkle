
CREATE TABLE public.page_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visited_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visits" ON public.page_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read visits" ON public.page_visits FOR SELECT USING (true);

CREATE INDEX idx_page_visits_visited_at ON public.page_visits (visited_at);
