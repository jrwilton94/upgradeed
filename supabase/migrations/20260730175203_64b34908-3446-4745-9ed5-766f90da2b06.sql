REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_company(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_job(uuid) TO authenticated;