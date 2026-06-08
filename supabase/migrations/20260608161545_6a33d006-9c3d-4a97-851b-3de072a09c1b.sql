REVOKE EXECUTE ON FUNCTION public.has_asipt_grant(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_asipt_grant(uuid) TO service_role;