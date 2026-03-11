
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read active ad slots" ON public.ad_slots;
DROP POLICY IF EXISTS "Admins can manage ad slots" ON public.ad_slots;

-- Permissive: anyone can read active slots
CREATE POLICY "Anyone can read active ad slots"
  ON public.ad_slots FOR SELECT
  USING (is_active = true);

-- Permissive: admins can do everything
CREATE POLICY "Admins can manage ad slots"
  ON public.ad_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
