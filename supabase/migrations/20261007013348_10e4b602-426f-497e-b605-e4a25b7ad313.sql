CREATE TABLE public.test_profile_access (
 user_id uuid NOT NULL,
 role public.profile_role NOT NULL,
 company_id uuid REFERENCES public.companies(id),
 institution_id uuid REFERENCES public.institutions(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, role)
);
GRANT SELECT ON public.test_profile_access TO authenticated;
GRANT ALL ON public.test_profile_access TO service_role;
ALTER TABLE public.test_profile_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY test_access_own ON public.test_profile_access FOR SELECT TO authenticated USING(user_id = auth.uid());
CREATE TRIGGER test_access_updated BEFORE UPDATE ON public.test_profile_access FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.companies(id,name,code,owner_id) VALUES('a2b1c001-0000-4000-8000-000000000001','Empresa de teste Upgrade','UPTEST2026','3881b808-61f1-4f80-98c5-6510157e1a10');
INSERT INTO public.institutions(id,name,owner_id) VALUES('a2b1c002-0000-4000-8000-000000000001','Instituição de teste Upgrade','3881b808-61f1-4f80-98c5-6510157e1a10');
INSERT INTO public.test_profile_access(user_id,role,company_id,institution_id) VALUES
('3881b808-61f1-4f80-98c5-6510157e1a10','estudante',null,'a2b1c002-0000-4000-8000-000000000001'),
('3881b808-61f1-4f80-98c5-6510157e1a10','geral',null,null),
('3881b808-61f1-4f80-98c5-6510157e1a10','colaborador','a2b1c001-0000-4000-8000-000000000001',null),
('3881b808-61f1-4f80-98c5-6510157e1a10','professor',null,null),
('3881b808-61f1-4f80-98c5-6510157e1a10','ies',null,'a2b1c002-0000-4000-8000-000000000001'),
('3881b808-61f1-4f80-98c5-6510157e1a10','empresa','a2b1c001-0000-4000-8000-000000000001',null);
UPDATE public.profiles SET role='estudante',institution_id='a2b1c002-0000-4000-8000-000000000001',matching_enabled=false,plan='teste',education_level='Graduação — teste',current_position='Assistente — teste',target_position='Analista — teste' WHERE id='3881b808-61f1-4f80-98c5-6510157e1a10';
CREATE OR REPLACE FUNCTION public.switch_test_profile(_role public.profile_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE access_row public.test_profile_access;
BEGIN
 SELECT * INTO access_row FROM public.test_profile_access WHERE user_id=auth.uid() AND role=_role;
 IF NOT FOUND THEN RAISE EXCEPTION 'Acesso de teste não autorizado'; END IF;
 UPDATE public.profiles SET role=_role,company_id=access_row.company_id,institution_id=access_row.institution_id,matching_enabled=false,plan='teste' WHERE id=auth.uid();
 UPDATE public.employability_preferences SET matching_enabled=false WHERE user_id=auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.switch_test_profile(public.profile_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.switch_test_profile(public.profile_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.institution_indicators(_institution_id uuid)
RETURNS TABLE(students bigint,enrollments bigint,hours numeric,completion numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.institutions i JOIN public.profiles p ON p.id=auth.uid() WHERE i.id=_institution_id AND i.owner_id=auth.uid() AND p.role='ies' AND p.institution_id=i.id) THEN RAISE EXCEPTION 'Acesso institucional não autorizado'; END IF;
 RETURN QUERY SELECT
 (SELECT count(*) FROM public.profiles p WHERE p.institution_id=_institution_id AND p.role='estudante'),
 (SELECT count(*) FROM public.enrollments e JOIN public.profiles p ON p.id=e.user_id WHERE p.institution_id=_institution_id AND p.role='estudante'),
 (SELECT COALESCE(sum(c.hours),0) FROM public.certificates c JOIN public.profiles p ON p.id=c.user_id WHERE p.institution_id=_institution_id AND p.role='estudante'),
 (SELECT COALESCE(round(100.0*count(*) FILTER(WHERE e.progress>=100)/NULLIF(count(*),0)),0) FROM public.enrollments e JOIN public.profiles p ON p.id=e.user_id WHERE p.institution_id=_institution_id AND p.role='estudante');
END; $$;
REVOKE ALL ON FUNCTION public.institution_indicators(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.institution_indicators(uuid) TO authenticated;