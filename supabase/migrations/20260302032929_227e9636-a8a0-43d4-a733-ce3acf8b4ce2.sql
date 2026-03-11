
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage ad slots" ON public.ad_slots;
DROP POLICY IF EXISTS "Anyone can read active ad slots" ON public.ad_slots;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Anyone can read active ad slots"
  ON public.ad_slots FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage ad slots"
  ON public.ad_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));
