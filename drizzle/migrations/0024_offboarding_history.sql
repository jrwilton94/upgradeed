-- Desligamento de colaborador: completa a migração de histórico para o Perfil Geral.
-- A função manage_company (0004, já aplicada) copia aprendizado, matrículas e certificados, mas não conhece as tabelas
-- criadas depois (competências, testes) nem o tipo (módulo/curso) dos certificados. Aditivo: não altera migrações anteriores.

-- 1) Certificado copiado por código adota o tipo do original (evita que um certificado de módulo vire "curso").
CREATE OR REPLACE FUNCTION public.inherit_certificate_kind() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE k text;
BEGIN
  IF NEW.code IS NOT NULL THEN
    SELECT c.kind INTO k FROM public.certificates c WHERE c.code = NEW.code AND c.user_id = NEW.user_id AND c.profile_role <> NEW.profile_role LIMIT 1;
    IF FOUND THEN NEW.kind := k; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS certificates_inherit_kind ON public.certificates;
CREATE TRIGGER certificates_inherit_kind BEFORE INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.inherit_certificate_kind();

-- 2) Ao desligar (ended_at preenchido), copia competências e testes do perfil Colaborador para o Geral (idempotente).
--    Contas de teste não migram (mantêm históricos independentes).
CREATE OR REPLACE FUNCTION public.offboarding_copy_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ended_at IS NULL OR OLD.ended_at IS NOT NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.test_profile_access WHERE user_id = NEW.user_id) THEN RETURN NEW; END IF;
  INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at)
    SELECT user_id, 'geral', skill_id, level, origin, verified, acquired_at FROM public.user_competencies WHERE user_id = NEW.user_id AND profile_role = 'colaborador'
    ON CONFLICT (user_id, profile_role, skill_id, origin) DO NOTHING;
  INSERT INTO public.behavioral_tests(user_id, profile_role, result, profile_label, test_type, taken_at)
    SELECT b.user_id, 'geral', b.result, b.profile_label, b.test_type, b.taken_at FROM public.behavioral_tests b
    WHERE b.user_id = NEW.user_id AND b.profile_role = 'colaborador'
      AND NOT EXISTS (SELECT 1 FROM public.behavioral_tests g WHERE g.user_id = b.user_id AND g.profile_role = 'geral' AND g.test_type = b.test_type AND g.taken_at = b.taken_at);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS company_employees_offboard_history ON public.company_employees;
CREATE TRIGGER company_employees_offboard_history AFTER UPDATE OF ended_at ON public.company_employees FOR EACH ROW EXECUTE FUNCTION public.offboarding_copy_history();
