
-- Allow reading admin roles publicly (only the role, not sensitive data)
CREATE POLICY "Anyone can check admin roles"
  ON public.user_roles
  FOR SELECT
  USING (role = 'admin');
