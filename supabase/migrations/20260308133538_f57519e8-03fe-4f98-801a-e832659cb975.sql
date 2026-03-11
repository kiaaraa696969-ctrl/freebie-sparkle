
CREATE TABLE public.vip_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL DEFAULT '1_month',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read VIP status"
  ON public.vip_subscriptions
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage VIP"
  ON public.vip_subscriptions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Function to check if a user is currently VIP
CREATE OR REPLACE FUNCTION public.is_vip(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = _user_id
      AND expires_at > now()
  )
$$;
