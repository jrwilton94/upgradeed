-- F2: perfil de competências do usuário, isolado por profile_role como as demais tabelas de aprendizado.
CREATE TABLE IF NOT EXISTS public.user_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_role public.profile_role NOT NULL,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 100),
  origin text NOT NULL CHECK (origin IN ('curso', 'teste', 'historico')),
  verified boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, profile_role, skill_id, origin)
);
CREATE INDEX IF NOT EXISTS user_competencies_user_idx ON public.user_competencies(user_id, profile_role);
ALTER TABLE public.user_competencies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_competencies TO authenticated;
GRANT ALL ON public.user_competencies TO service_role;
CREATE POLICY user_competencies_own ON public.user_competencies FOR SELECT TO authenticated USING (user_id = auth.uid() AND profile_role = public.current_profile_role());
CREATE POLICY user_competencies_role_guard ON public.user_competencies AS RESTRICTIVE FOR SELECT TO authenticated USING (public.current_profile_role() IN ('estudante', 'geral', 'colaborador'));

-- Competências concedidas pela conclusão de um curso (nível: 40 por curso certificado na mesma competência, até 100).
CREATE OR REPLACE FUNCTION public.grant_course_competencies(_user uuid, _role public.profile_role, _course uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at)
  SELECT _user, _role, cs.skill_id,
    least(100, 40 * (SELECT count(DISTINCT c.course_id) FROM public.certificates c JOIN public.course_skills x ON x.course_id = c.course_id WHERE c.user_id = _user AND c.profile_role = _role AND c.kind = 'curso' AND x.skill_id = cs.skill_id)),
    'curso', true, now()
  FROM public.course_skills cs WHERE cs.course_id = _course
  ON CONFLICT (user_id, profile_role, skill_id, origin) DO UPDATE SET level = greatest(public.user_competencies.level, EXCLUDED.level), verified = true, acquired_at = EXCLUDED.acquired_at;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.grant_course_competencies(uuid, public.profile_role, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_course_competencies(uuid, public.profile_role, uuid) TO service_role;

-- Competências do próprio usuário com o nome da competência (as competências do catálogo não são todas públicas).
CREATE OR REPLACE FUNCTION public.my_competencies() RETURNS TABLE(skill_id uuid, name text, level integer, origin text, verified boolean, acquired_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT uc.skill_id, s.name, uc.level, uc.origin, uc.verified, uc.acquired_at
  FROM public.user_competencies uc JOIN public.skills s ON s.id = uc.skill_id
  WHERE uc.user_id = auth.uid() AND uc.profile_role = public.current_profile_role()
    AND public.current_profile_role() IN ('estudante', 'geral', 'colaborador')
  ORDER BY uc.level DESC, s.name
$$;
REVOKE ALL ON FUNCTION public.my_competencies() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_competencies() TO authenticated;

-- Migração de dados: competências dos certificados existentes (origem curso, verificada).
-- Neste ponto todos os certificados existentes são de curso completo.
DO $$
DECLARE n bigint;
BEGIN
  INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at)
  SELECT c.user_id, c.profile_role, cs.skill_id, least(100, 40 * count(DISTINCT c.course_id)), 'curso', true, max(c.issued_at)
  FROM public.certificates c JOIN public.course_skills cs ON cs.course_id = c.course_id
  GROUP BY c.user_id, c.profile_role, cs.skill_id
  ON CONFLICT (user_id, profile_role, skill_id, origin) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.data_migration_log(migration, metric, value) VALUES ('0018', 'user_competencies criadas a partir de certificados', n);
END $$;
