
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Admins can manage ad slots" ON public.ad_slots;
DROP POLICY IF EXISTS "Anyone can read active ad slots" ON public.ad_slots;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage ad slots"
ON public.ad_slots
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active ad slots"
ON public.ad_slots
FOR SELECT
TO anon, authenticated
USING (is_active = true);
