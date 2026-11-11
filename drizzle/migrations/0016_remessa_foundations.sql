-- Remessa de ajustes (blocos A–I): fundações.
-- Somente alterações aditivas. Nenhum registro é apagado ou reescrito além dos preenchimentos documentados.

-- Registro de contagens para auditar que nada foi perdido (antes/depois) e o resultado dos preenchimentos.
CREATE TABLE IF NOT EXISTS public.data_migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration text NOT NULL,
  metric text NOT NULL,
  value bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.data_migration_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.data_migration_log TO authenticated;
GRANT ALL ON public.data_migration_log TO service_role;
CREATE POLICY data_migration_log_admin_read ON public.data_migration_log FOR SELECT TO authenticated USING (public.is_admin());

INSERT INTO public.data_migration_log(migration, metric, value)
SELECT '0016', 'antes:' || t, n FROM (VALUES
  ('profiles', (SELECT count(*) FROM public.profiles)),
  ('learner_profiles', (SELECT count(*) FROM public.learner_profiles)),
  ('courses', (SELECT count(*) FROM public.courses)),
  ('enrollments', (SELECT count(*) FROM public.enrollments)),
  ('certificates', (SELECT count(*) FROM public.certificates)),
  ('lesson_views', (SELECT count(*) FROM public.lesson_views)),
  ('student_verifications', (SELECT count(*) FROM public.student_verifications))
) AS v(t, n);

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.normalize_text(_value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT btrim(regexp_replace(lower(translate(COALESCE(_value, ''),
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')), '\s+', ' ', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.is_upgrade_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL AND public.is_admin() AND COALESCE(public.current_profile_role()::text, '') NOT IN ('professor', 'ies', 'empresa', 'colaborador'), false)
$$;
REVOKE ALL ON FUNCTION public.normalize_text(text), public.is_upgrade_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalize_text(text), public.is_upgrade_staff() TO authenticated, service_role;

-- Configurações administrativas da plataforma (singleton)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  student_grace_days integer NOT NULL DEFAULT 30 CHECK (student_grace_days BETWEEN 0 AND 365),
  student_warning_days integer NOT NULL DEFAULT 15 CHECK (student_warning_days BETWEEN 1 AND 90),
  test_profile_switch_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.platform_settings DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
CREATE POLICY platform_settings_staff_read ON public.platform_settings FOR SELECT TO authenticated USING (public.is_upgrade_staff());
CREATE POLICY platform_settings_staff_update ON public.platform_settings FOR UPDATE TO authenticated USING (public.is_upgrade_staff()) WITH CHECK (public.is_upgrade_staff());

-- Estado do vínculo e da carência no perfil de aluno
ALTER TABLE public.learner_profiles
  ADD COLUMN IF NOT EXISTS scope_id uuid REFERENCES public.organization_scopes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS warned_for timestamptz,
  ADD COLUMN IF NOT EXISTS migrated_notice_for timestamptz;

-- Alunos já existentes recebem o período de carência a partir desta migração (ninguém é migrado de imediato).
UPDATE public.learner_profiles
SET grace_until = now() + make_interval(days => (SELECT student_grace_days FROM public.platform_settings))
WHERE profile_role = 'estudante' AND grace_until IS NULL;

-- Troca de plano agendada para o próximo ciclo (não altera cobranças já realizadas)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS pending_effective_at timestamptz;

-- CNPJ (formato) e status em empresas e instituições; opcionais para os registros existentes
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';
ALTER TABLE public.companies ADD CONSTRAINT companies_cnpj_format CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$');
ALTER TABLE public.institutions ADD CONSTRAINT institutions_cnpj_format CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{14}$');
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check CHECK (status IN ('ativo', 'pendente', 'suspenso'));
ALTER TABLE public.institutions ADD CONSTRAINT institutions_status_check CHECK (status IN ('ativo', 'pendente', 'suspenso'));

-- Correção: o gatilho sobrescrevia profile_role com o perfil de QUEM CHAMA, inclusive dentro de funções
-- SECURITY DEFINER. Assim, sugestões geradas por uma empresa eram gravadas como profile_role='empresa' e
-- o aluno nunca as via. Agora só se aplica a escritas diretas do cliente (papéis authenticated/anon).
CREATE OR REPLACE FUNCTION public.set_learning_profile_role() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN NEW.profile_role := public.current_profile_role(); END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_learning_profile_role() FROM PUBLIC, anon, authenticated;

-- Chave de teste lida pelo cliente (sem expor as demais configurações)
CREATE OR REPLACE FUNCTION public.test_switch_enabled() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((SELECT test_profile_switch_enabled FROM public.platform_settings), false)
$$;
REVOKE ALL ON FUNCTION public.test_switch_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.test_switch_enabled() TO authenticated;
