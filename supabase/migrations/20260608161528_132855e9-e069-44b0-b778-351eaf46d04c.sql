CREATE TABLE public.asipt_grants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asipt_subject text NOT NULL,
  jwt_jti text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX asipt_grants_user_id_idx ON public.asipt_grants(user_id);

GRANT SELECT ON public.asipt_grants TO authenticated;
GRANT ALL ON public.asipt_grants TO service_role;

ALTER TABLE public.asipt_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono lê suas liberações"
  ON public.asipt_grants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_asipt_grant(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asipt_grants
    WHERE user_id = user_uuid AND expires_at > now()
  );
$$;