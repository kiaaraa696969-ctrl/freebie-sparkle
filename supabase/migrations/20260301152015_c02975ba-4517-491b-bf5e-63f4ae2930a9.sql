-- Fix ad_slots RLS: make policies permissive so admins can see ALL slots
DROP POLICY IF EXISTS "Admins can manage accounts" ON ad_slots;
DROP POLICY IF EXISTS "Anyone can read active ad slots" ON ad_slots;
DROP POLICY IF EXISTS "Admins can manage ad slots" ON ad_slots;

CREATE POLICY "Admins can manage ad slots"
  ON ad_slots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::text))
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Anyone can read active ad slots"
  ON ad_slots FOR SELECT TO anon, authenticated
  USING (is_active = true);