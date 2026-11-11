-- B1 + C: todo certificado gera horas, apenas pela aprovação na avaliação; um certificado por módulo,
-- além do certificado do curso completo.

ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'curso' CHECK (kind IN ('modulo', 'curso'));

-- Unicidade: um certificado de curso por (usuário, curso, perfil) e um de módulo por (usuário, módulo, perfil).
-- Os registros existentes continuam como certificados de curso (legacy preservado).
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_user_course_profile_key;
CREATE UNIQUE INDEX IF NOT EXISTS certificates_course_unique ON public.certificates(user_id, course_id, profile_role) WHERE kind = 'curso';
CREATE UNIQUE INDEX IF NOT EXISTS certificates_module_unique ON public.certificates(user_id, module_id, profile_role) WHERE kind = 'modulo';

-- Todos os certificados existentes passam a contar horas (preserva hours, code e issued_at).
DO $$
DECLARE n bigint;
BEGIN
  UPDATE public.certificates SET complementary = true WHERE NOT complementary;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.data_migration_log(migration, metric, value) VALUES ('0020', 'certificados marcados como complementary=true', n);
END $$;

-- A emissão nunca depende de declaração, vínculo ou validação: remove o parâmetro _complementary.
DROP FUNCTION IF EXISTS public.submit_assessment(uuid, jsonb, boolean);
CREATE OR REPLACE FUNCTION public.submit_assessment(_module uuid, _answers jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a public.module_assessments; m public.course_modules; r public.profile_role; correct integer; total integer; score_value numeric; attempt uuid; completed_count integer; module_count integer;
  module_code text; course_code text; already_module boolean; course_total numeric;
BEGIN
  r := public.current_profile_role();
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral', 'colaborador') THEN RAISE EXCEPTION 'Avaliação não autorizada'; END IF;
  SELECT cm.* INTO m FROM public.course_modules cm JOIN public.courses c ON c.id = cm.course_id WHERE cm.id = _module AND c.status = 'publicado' AND c.published;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conteúdo indisponível'; END IF;
  SELECT * INTO a FROM public.module_assessments WHERE module_id = _module;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avaliação ainda não cadastrada pelo autor'; END IF;
  total := jsonb_array_length(a.questions);
  IF total = 0 OR jsonb_typeof(_answers) <> 'array' OR jsonb_array_length(_answers) <> total THEN RAISE EXCEPTION 'Responda todas as questões'; END IF;
  SELECT count(*) INTO correct FROM jsonb_array_elements(a.questions) WITH ORDINALITY q(value, n) WHERE (q.value->>'answer')::integer = (_answers->>((q.n - 1)::integer))::integer;
  score_value := 100.0 * correct / total;
  INSERT INTO public.assessment_attempts(user_id, profile_role, module_id, score, passed) VALUES (auth.uid(), r, _module, score_value, score_value >= a.minimum_score) RETURNING id INTO attempt;
  IF score_value < a.minimum_score THEN RETURN jsonb_build_object('passed', false, 'score', score_value, 'certificate', false, 'course_certificate', false); END IF;

  SELECT count(*) INTO module_count FROM public.course_modules WHERE course_id = m.course_id;
  -- Aprovações em qualquer perfil contam: o histórico é preservado quando a conta migra entre perfis.
  SELECT count(DISTINCT x.module_id) INTO completed_count FROM public.assessment_attempts x JOIN public.course_modules cm ON cm.id = x.module_id WHERE cm.course_id = m.course_id AND x.user_id = auth.uid() AND x.passed;
  INSERT INTO public.enrollments(user_id, course_id, profile_role, progress, completed_at) VALUES (auth.uid(), m.course_id, r, round(100.0 * completed_count / module_count), CASE WHEN completed_count = module_count THEN now() END)
  ON CONFLICT (user_id, course_id, profile_role) DO UPDATE SET progress = greatest(public.enrollments.progress, EXCLUDED.progress), completed_at = COALESCE(public.enrollments.completed_at, EXCLUDED.completed_at);

  -- Certificado do módulo, com a carga horária do módulo e código próprio.
  SELECT EXISTS (SELECT 1 FROM public.certificates c WHERE c.user_id = auth.uid() AND c.profile_role = r AND c.kind = 'modulo' AND c.module_id = m.id) INTO already_module;
  IF NOT already_module THEN
    INSERT INTO public.certificates(user_id, course_id, profile_role, module_id, assessment_id, hours, complementary, legacy, kind)
    VALUES (auth.uid(), m.course_id, r, m.id, attempt, m.hours, true, false, 'modulo') RETURNING code INTO module_code;
  END IF;

  -- Certificado do curso completo quando todos os módulos foram aprovados.
  IF completed_count = module_count AND NOT EXISTS (SELECT 1 FROM public.certificates c WHERE c.user_id = auth.uid() AND c.profile_role = r AND c.kind = 'curso' AND c.course_id = m.course_id) THEN
    SELECT COALESCE(sum(hours), 0) INTO course_total FROM public.course_modules WHERE course_id = m.course_id;
    INSERT INTO public.certificates(user_id, course_id, profile_role, module_id, assessment_id, hours, complementary, legacy, kind)
    VALUES (auth.uid(), m.course_id, r, NULL, attempt, course_total, true, false, 'curso') RETURNING code INTO course_code;
    PERFORM public.grant_course_competencies(auth.uid(), r, m.course_id);
  END IF;
  -- Novas competências / módulo concluído: gera sugestões ainda não existentes.
  PERFORM public.create_matches(NULL, auth.uid());
  RETURN jsonb_build_object('passed', true, 'score', score_value, 'certificate', module_code IS NOT NULL, 'module_certificate_code', module_code, 'course_certificate', course_code IS NOT NULL, 'course_certificate_code', course_code);
END $$;
REVOKE ALL ON FUNCTION public.submit_assessment(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_assessment(uuid, jsonb) TO authenticated;
