-- B2: a declaração de matrícula passa a comprovar a elegibilidade ao Perfil Estudante (e aos seus planos).
-- Entrada por inscrição em lote da IES parceira ou por autocadastro com carência; expirado/vencido => Perfil Geral.
-- Reaproveita student_verifications, o bucket student-declarations e as filas da IES e administrativa.

ALTER TABLE public.student_verifications ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE public.student_verifications
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'declaracao' CHECK (source IN ('declaracao', 'lote')),
  ADD COLUMN IF NOT EXISTS invite_id uuid;
ALTER TABLE public.behavioral_tests ADD COLUMN IF NOT EXISTS test_type text NOT NULL DEFAULT 'comportamental' CHECK (test_type IN ('comportamental', 'raciocinio', 'vocacional'));

-- Fila de validação: instituição parceira => IES (permissão validar_vinculos, com escopo); não parceira => equipe Upgrade.
CREATE OR REPLACE FUNCTION public.can_validate_student(_institution uuid, _scope uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL AND ((_institution IS NULL AND public.is_upgrade_staff()) OR (_institution IS NOT NULL AND public.organization_permission(_institution, 'ies', 'validar_vinculos', _scope))), false)
$$;

-- Inscrição em lote ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  created_by uuid NOT NULL,
  filename text,
  accepted integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.student_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  batch_id uuid NOT NULL REFERENCES public.student_import_batches(id),
  scope_id uuid REFERENCES public.organization_scopes(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  education_level text NOT NULL CHECK (education_level IN ('basico', 'medio', 'graduacao', 'pos')),
  course_name text,
  semester text,
  registration_number text,
  school_year text,
  classroom text,
  valid_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'cancelado')),
  claimed_by uuid,
  claimed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS student_invites_pending_email ON public.student_invites(institution_id, email) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS student_invites_email_idx ON public.student_invites(lower(email)) WHERE status = 'pendente';
ALTER TABLE public.student_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.student_import_batches, public.student_invites TO authenticated;
GRANT ALL ON public.student_import_batches, public.student_invites TO service_role;
CREATE POLICY student_batches_validators ON public.student_import_batches FOR SELECT TO authenticated USING (public.organization_permission(institution_id, 'ies', 'validar_vinculos'));
CREATE POLICY student_invites_validators ON public.student_invites FOR SELECT TO authenticated USING (public.can_validate_student(institution_id, scope_id));

CREATE OR REPLACE FUNCTION public.normalize_education_level(_value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE public.normalize_text(_value)
    WHEN 'basico' THEN 'basico' WHEN 'ensino basico' THEN 'basico' WHEN 'fundamental' THEN 'basico' WHEN 'ensino fundamental' THEN 'basico'
    WHEN 'medio' THEN 'medio' WHEN 'ensino medio' THEN 'medio'
    WHEN 'graduacao' THEN 'graduacao' WHEN 'superior' THEN 'graduacao'
    WHEN 'pos' THEN 'pos' WHEN 'pos-graduacao' THEN 'pos' WHEN 'pos graduacao' THEN 'pos' WHEN 'posgraduacao' THEN 'pos'
  END
$$;

-- Valida a planilha linha a linha. Com _confirm=false apenas resume (aceitas/recusadas e motivos); com true grava os convites.
CREATE OR REPLACE FUNCTION public.import_student_invites(_institution uuid, _rows jsonb, _filename text DEFAULT NULL, _confirm boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  item jsonb; i integer := 0; line integer; e text; nm text; lv text; course text; sem text; reg text; yr text; room text; raw_until text; d date; until_ts timestamptz; scope uuid; reason text;
  accepted jsonb := '[]'::jsonb; rejected jsonb := '[]'::jsonb; seen text[] := '{}'; batch uuid; unrestricted boolean; rej_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR public.current_profile_role() <> 'ies' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  unrestricted := public.organization_permission(_institution, 'ies', 'validar_vinculos', NULL);
  IF NOT unrestricted AND NOT EXISTS (SELECT 1 FROM public.organization_memberships m WHERE m.organization_id = _institution AND m.organization_type = 'ies' AND m.user_id = auth.uid() AND m.status = 'ativo' AND 'validar_vinculos' = ANY (m.permissions)) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) = 0 THEN RAISE EXCEPTION 'A planilha está vazia'; END IF;
  IF jsonb_array_length(_rows) > 2000 THEN RAISE EXCEPTION 'Envie no máximo 2.000 linhas por importação'; END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(_rows) LOOP
    i := i + 1; reason := NULL; scope := NULL; until_ts := NULL; d := NULL;
    line := COALESCE(NULLIF(item->>'line', '')::integer, i + 1);
    e := lower(btrim(COALESCE(item->>'email', ''))); nm := btrim(COALESCE(item->>'nome', '')); lv := public.normalize_education_level(item->>'nivel');
    course := btrim(COALESCE(item->>'curso', '')); sem := btrim(COALESCE(item->>'semestre', '')); reg := btrim(COALESCE(item->>'matricula', ''));
    yr := btrim(COALESCE(item->>'serie', '')); room := btrim(COALESCE(item->>'turma', '')); raw_until := btrim(COALESCE(item->>'validade', ''));
    BEGIN
      IF raw_until ~ '^\d{4}-\d{2}-\d{2}$' THEN d := to_date(raw_until, 'YYYY-MM-DD'); ELSIF raw_until ~ '^\d{2}/\d{2}/\d{4}$' THEN d := to_date(raw_until, 'DD/MM/YYYY'); END IF;
      IF d IS NOT NULL AND (to_char(d, 'YYYY-MM-DD') <> raw_until AND to_char(d, 'DD/MM/YYYY') <> raw_until) THEN d := NULL; END IF;
    EXCEPTION WHEN OTHERS THEN d := NULL;
    END;
    IF d IS NOT NULL THEN until_ts := (d::timestamp + interval '23 hours 59 minutes 59 seconds') AT TIME ZONE 'America/Sao_Paulo'; END IF;

    IF length(nm) < 2 OR length(nm) > 160 THEN reason := 'Nome ausente ou inválido';
    ELSIF e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(e) > 254 THEN reason := 'E-mail inválido';
    ELSIF e = ANY (seen) THEN reason := 'E-mail repetido na planilha';
    ELSIF lv IS NULL THEN reason := 'Nível de ensino inválido (use básico, médio, graduação ou pós)';
    ELSIF lv IN ('graduacao', 'pos') AND (course = '' OR sem = '' OR reg = '') THEN reason := 'Curso, semestre e número de matrícula são obrigatórios para graduação e pós';
    ELSIF lv IN ('medio', 'basico') AND (yr = '' OR room = '') THEN reason := 'Série e turma são obrigatórias para ensino básico e médio';
    ELSIF until_ts IS NULL THEN reason := 'Data de validade inválida (use AAAA-MM-DD ou DD/MM/AAAA)';
    ELSIF d <= (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN reason := 'A data de validade deve ser futura';
    ELSIF EXISTS (SELECT 1 FROM public.student_invites si WHERE si.institution_id = _institution AND si.email = e AND si.status = 'pendente') THEN reason := 'Já existe convite pendente para este e-mail';
    ELSE
      IF course <> '' THEN scope := public.resolve_institution_scope(_institution, course); END IF;
      IF NOT unrestricted AND (scope IS NULL OR NOT public.organization_permission(_institution, 'ies', 'validar_vinculos', scope)) THEN reason := 'Curso fora do seu escopo de gestão'; END IF;
    END IF;

    IF reason IS NULL THEN
      seen := seen || e;
      accepted := accepted || jsonb_build_array(jsonb_build_object('email', e, 'nome', nm, 'nivel', lv, 'curso', course, 'semestre', sem, 'matricula', reg, 'serie', yr, 'turma', room, 'validade', until_ts, 'scope', scope));
    ELSE
      rej_count := rej_count + 1;
      IF rej_count <= 500 THEN rejected := rejected || jsonb_build_array(jsonb_build_object('line', line, 'email', e, 'reason', reason)); END IF;
    END IF;
  END LOOP;

  IF _confirm AND jsonb_array_length(accepted) > 0 THEN
    INSERT INTO public.student_import_batches(institution_id, created_by, filename, accepted, rejected) VALUES (_institution, auth.uid(), left(_filename, 200), jsonb_array_length(accepted), rej_count) RETURNING id INTO batch;
    INSERT INTO public.student_invites(institution_id, batch_id, scope_id, email, full_name, education_level, course_name, semester, registration_number, school_year, classroom, valid_until, created_by)
    SELECT _institution, batch, NULLIF(a->>'scope', '')::uuid, a->>'email', a->>'nome', a->>'nivel', NULLIF(a->>'curso', ''), NULLIF(a->>'semestre', ''), NULLIF(a->>'matricula', ''), NULLIF(a->>'serie', ''), NULLIF(a->>'turma', ''), (a->>'validade')::timestamptz, auth.uid()
    FROM jsonb_array_elements(accepted) a;
    INSERT INTO public.activity_logs(user_id, organization_id, organization_type, scope_id, action, entity, meta)
    VALUES (auth.uid(), _institution, 'ies', NULL, 'importacao_alunos', 'student_invites', jsonb_build_object('batch_id', batch, 'accepted', jsonb_array_length(accepted), 'rejected', rej_count, 'filename', left(_filename, 200)));
  END IF;
  RETURN jsonb_build_object('accepted', jsonb_array_length(accepted), 'rejected_count', rej_count, 'rejected', rejected, 'confirmed', _confirm AND jsonb_array_length(accepted) > 0, 'batch_id', batch);
END $$;
REVOKE ALL ON FUNCTION public.import_student_invites(uuid, jsonb, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_student_invites(uuid, jsonb, text, boolean) TO authenticated;

-- Elegibilidade ----------------------------------------------------------------------------------------------------
-- Prazo do Perfil Estudante: o maior entre o fim do vínculo validado e o fim da carência.
CREATE OR REPLACE FUNCTION public.student_deadline(_user uuid) RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT greatest(
    (SELECT max(v.valid_until) FROM public.student_verifications v WHERE v.user_id = _user AND v.status = 'validado'),
    (SELECT lp.grace_until FROM public.learner_profiles lp WHERE lp.user_id = _user AND lp.profile_role = 'estudante'))
$$;
REVOKE ALL ON FUNCTION public.student_deadline(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_deadline(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.student_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.profile_role; dl timestamptz; v public.student_verifications; lp public.learner_profiles; valid boolean;
BEGIN
  r := public.current_profile_role();
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral') THEN RETURN NULL; END IF;
  SELECT * INTO lp FROM public.learner_profiles WHERE user_id = auth.uid() AND profile_role = 'estudante';
  IF NOT FOUND AND r = 'geral' THEN RETURN jsonb_build_object('role', r, 'can_return', false); END IF;
  dl := public.student_deadline(auth.uid());
  SELECT * INTO v FROM public.student_verifications WHERE user_id = auth.uid() ORDER BY submitted_at DESC LIMIT 1;
  valid := EXISTS (SELECT 1 FROM public.student_verifications x WHERE x.user_id = auth.uid() AND x.status = 'validado' AND x.valid_until > now());
  RETURN jsonb_build_object('role', r, 'can_return', r = 'geral', 'eligible', r = 'estudante' AND dl > now(), 'deadline', dl, 'grace_until', lp.grace_until, 'validated', valid,
    'partner_institution', lp.institution_id IS NOT NULL, 'institution_name', lp.institution_name,
    'verification', CASE WHEN v.id IS NULL THEN NULL ELSE jsonb_build_object('status', v.status, 'submitted_at', v.submitted_at, 'valid_until', v.valid_until, 'rejection_reason', v.rejection_reason) END,
    'pending', EXISTS (SELECT 1 FROM public.student_verifications x WHERE x.user_id = auth.uid() AND x.status = 'pendente'));
END $$;
REVOKE ALL ON FUNCTION public.student_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_status() TO authenticated;

-- Pode enviar declaração quem é Estudante, ou Geral que já foi Estudante (volta ao perfil quando validar).
CREATE OR REPLACE FUNCTION public.can_submit_declaration() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(auth.uid() IS NOT NULL AND (public.current_profile_role() = 'estudante' OR (public.current_profile_role() = 'geral' AND EXISTS (SELECT 1 FROM public.learner_profiles lp WHERE lp.user_id = auth.uid() AND lp.profile_role = 'estudante'))), false)
$$;
REVOKE ALL ON FUNCTION public.can_submit_declaration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_submit_declaration() TO authenticated;
DROP POLICY IF EXISTS declaration_upload ON storage.objects;
CREATE POLICY declaration_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-declarations' AND public.can_submit_declaration() AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] = 'estudante');

-- Migração entre perfis preservando o histórico (mesmo padrão do colaborador desligado) -----------------------------
CREATE OR REPLACE FUNCTION public.migrate_learner_role(_user uuid, _from public.profile_role, _to public.profile_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE geral_plan uuid;
BEGIN
  INSERT INTO public.learner_profiles(user_id, profile_role, education_level, institution_name, institution_id, scope_id, course_name, semester, registration_number, school_year, classroom, works, employer_name, seeks_job, target_area, target_position, matching_enabled, xp, level)
  SELECT user_id, _to, education_level, institution_name, institution_id, scope_id, course_name, semester, registration_number, school_year, classroom, works, employer_name, seeks_job, target_area, target_position, matching_enabled, xp, level
  FROM public.learner_profiles WHERE user_id = _user AND profile_role = _from
  ON CONFLICT (user_id, profile_role) DO UPDATE SET xp = greatest(public.learner_profiles.xp, EXCLUDED.xp), level = greatest(public.learner_profiles.level, EXCLUDED.level);
  INSERT INTO public.employability_preferences(user_id, profile_role, area, city, state, work_model, salary_range, contract_type, matching_enabled)
  SELECT user_id, _to, area, city, state, work_model, salary_range, contract_type, matching_enabled FROM public.employability_preferences WHERE user_id = _user AND profile_role = _from ON CONFLICT DO NOTHING;
  INSERT INTO public.enrollments(user_id, course_id, progress, completed_at, profile_role)
  SELECT user_id, course_id, progress, completed_at, _to FROM public.enrollments WHERE user_id = _user AND profile_role = _from
  ON CONFLICT (user_id, course_id, profile_role) DO UPDATE SET progress = greatest(public.enrollments.progress, EXCLUDED.progress), completed_at = COALESCE(public.enrollments.completed_at, EXCLUDED.completed_at);
  INSERT INTO public.certificates(user_id, course_id, code, hours, issued_at, profile_role, module_id, assessment_id, complementary, legacy, kind)
  SELECT user_id, course_id, code, hours, issued_at, _to, module_id, assessment_id, complementary, legacy, kind FROM public.certificates WHERE user_id = _user AND profile_role = _from ON CONFLICT DO NOTHING;
  INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at)
  SELECT user_id, _to, skill_id, level, origin, verified, acquired_at FROM public.user_competencies WHERE user_id = _user AND profile_role = _from
  ON CONFLICT (user_id, profile_role, skill_id, origin) DO UPDATE SET level = greatest(public.user_competencies.level, EXCLUDED.level), verified = public.user_competencies.verified OR EXCLUDED.verified;
  INSERT INTO public.behavioral_tests(user_id, profile_role, result, profile_label, taken_at, test_type)
  SELECT b.user_id, _to, b.result, b.profile_label, b.taken_at, b.test_type FROM public.behavioral_tests b WHERE b.user_id = _user AND b.profile_role = _from
    AND NOT EXISTS (SELECT 1 FROM public.behavioral_tests t WHERE t.user_id = _user AND t.profile_role = _to AND t.taken_at = b.taken_at AND t.test_type = b.test_type);
  -- Sugestões acompanham o perfil atual (a chave única é por usuário e vaga).
  UPDATE public.matches SET profile_role = _to WHERE user_id = _user AND profile_role = _from;
  UPDATE public.profiles SET role = _to, company_id = NULL, institution_id = NULL,
    matching_enabled = COALESCE((SELECT matching_enabled FROM public.learner_profiles WHERE user_id = _user AND profile_role = _to), false),
    xp = COALESCE((SELECT xp FROM public.learner_profiles WHERE user_id = _user AND profile_role = _to), xp),
    level = COALESCE((SELECT level FROM public.learner_profiles WHERE user_id = _user AND profile_role = _to), level)
  WHERE id = _user;
  -- Assinatura do Perfil Estudante passa ao plano equivalente do Geral no próximo ciclo; cobranças já realizadas não mudam.
  IF _from = 'estudante' AND _to = 'geral' THEN
    SELECT id INTO geral_plan FROM public.plans WHERE audience = 'geral' AND active ORDER BY position LIMIT 1;
    IF geral_plan IS NOT NULL THEN
      UPDATE public.subscriptions s SET pending_plan_id = geral_plan,
        pending_effective_at = COALESCE(s.current_period_end, now() + CASE WHEN s.cycle = 'anual' THEN interval '1 year' ELSE interval '1 month' END)
      FROM public.plans p WHERE s.user_id = _user AND s.plan_id = p.id AND p.audience = 'estudante' AND s.status NOT IN ('cancelada', 'cancelado', 'encerrada', 'expirada');
    END IF;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.migrate_learner_role(uuid, public.profile_role, public.profile_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_learner_role(uuid, public.profile_role, public.profile_role) TO service_role;

-- Convites: quando a pessoa cria a conta (ou entra) com o mesmo e-mail, vira Estudante com vínculo já validado.
CREATE OR REPLACE FUNCTION public.claim_student_invites() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE mail text; confirmed timestamptz; p public.profiles; inv public.student_invites; inst_name text; ver uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  SELECT lower(u.email), u.email_confirmed_at INTO mail, confirmed FROM auth.users u WHERE u.id = auth.uid();
  IF mail IS NULL OR confirmed IS NULL THEN RETURN 0; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND OR (p.role IS NOT NULL AND p.role NOT IN ('estudante', 'geral')) THEN RETURN 0; END IF;
  IF EXISTS (SELECT 1 FROM public.test_profile_access t WHERE t.user_id = auth.uid()) THEN RETURN 0; END IF;
  SELECT * INTO inv FROM public.student_invites WHERE status = 'pendente' AND lower(email) = mail AND valid_until > now() ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;
  SELECT name INTO inst_name FROM public.institutions WHERE id = inv.institution_id;

  IF p.role = 'geral' THEN PERFORM public.migrate_learner_role(auth.uid(), 'geral', 'estudante'); END IF;
  IF p.role IS NULL THEN UPDATE public.profiles SET role = 'estudante', matching_enabled = false WHERE id = auth.uid(); END IF;
  INSERT INTO public.learner_profiles(user_id, profile_role, education_level, institution_name, institution_id, scope_id, course_name, semester, registration_number, school_year, classroom)
  VALUES (auth.uid(), 'estudante', inv.education_level, inst_name, inv.institution_id, inv.scope_id, inv.course_name, inv.semester, inv.registration_number, inv.school_year, inv.classroom)
  ON CONFLICT (user_id, profile_role) DO UPDATE SET education_level = EXCLUDED.education_level, institution_name = EXCLUDED.institution_name, institution_id = EXCLUDED.institution_id, scope_id = EXCLUDED.scope_id,
    course_name = EXCLUDED.course_name, semester = EXCLUDED.semester, registration_number = EXCLUDED.registration_number, school_year = EXCLUDED.school_year, classroom = EXCLUDED.classroom;
  INSERT INTO public.student_verifications(user_id, institution_id, scope_id, file_path, status, validated_by, validated_at, valid_until, source, invite_id)
  VALUES (auth.uid(), inv.institution_id, inv.scope_id, NULL, 'validado', inv.created_by, now(), inv.valid_until, 'lote', inv.id) RETURNING id INTO ver;
  UPDATE public.student_invites SET status = 'aceito', claimed_by = auth.uid(), claimed_at = now() WHERE id = inv.id;
  INSERT INTO public.notifications(user_id, profile_role, title, body) VALUES (auth.uid(), 'estudante', 'Vínculo validado pela instituição', 'Seu Perfil Estudante está ativo até ' || to_char(inv.valid_until AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') || '.');
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, scope_id, action, entity, meta) VALUES (auth.uid(), inv.institution_id, 'ies', inv.scope_id, 'convite_aceito', 'student_invites', jsonb_build_object('invite_id', inv.id, 'verification_id', ver));
  RETURN 1;
END $$;
REVOKE ALL ON FUNCTION public.claim_student_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_student_invites() TO authenticated;

-- Autocadastro: envio da declaração (Estudante, ou Geral que já foi Estudante) -------------------------------------
CREATE OR REPLACE FUNCTION public.submit_student_verification(_file text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE learner public.learner_profiles; result uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_submit_declaration() OR split_part(_file, '/', 1) <> auth.uid()::text OR split_part(_file, '/', 2) <> 'estudante' THEN RAISE EXCEPTION 'Envio não autorizado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'student-declarations' AND name = _file) THEN RAISE EXCEPTION 'Arquivo não encontrado'; END IF;
  IF EXISTS (SELECT 1 FROM public.student_verifications WHERE user_id = auth.uid() AND status = 'pendente') THEN RAISE EXCEPTION 'Já existe uma declaração em análise'; END IF;
  SELECT * INTO learner FROM public.learner_profiles WHERE user_id = auth.uid() AND profile_role = 'estudante';
  INSERT INTO public.student_verifications(user_id, institution_id, scope_id, file_path) VALUES (auth.uid(), learner.institution_id, learner.scope_id, _file) RETURNING id INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.submit_student_verification(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_student_verification(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_student_verification(_id uuid, _approved boolean, _reason text, _until timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.student_verifications; owner_role public.profile_role;
BEGIN
  SELECT * INTO v FROM public.student_verifications WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_validate_student(v.institution_id, v.scope_id) THEN RAISE EXCEPTION 'Validação não autorizada'; END IF;
  IF v.status <> 'pendente' THEN RAISE EXCEPTION 'Este envio já foi analisado'; END IF;
  IF _approved AND (_until IS NULL OR _until <= now()) THEN RAISE EXCEPTION 'Informe validade futura'; END IF;
  IF NOT _approved AND length(trim(COALESCE(_reason, ''))) < 3 THEN RAISE EXCEPTION 'Informe o motivo da recusa'; END IF;
  UPDATE public.student_verifications SET status = CASE WHEN _approved THEN 'validado' ELSE 'recusado' END, validated_by = auth.uid(), validated_at = now(), valid_until = CASE WHEN _approved THEN _until ELSE NULL END, rejection_reason = CASE WHEN NOT _approved THEN _reason ELSE NULL END WHERE id = _id;
  SELECT role INTO owner_role FROM public.profiles WHERE id = v.user_id;
  -- Quem foi migrado ao Perfil Geral volta ao Perfil Estudante, com o histórico preservado.
  IF _approved AND owner_role = 'geral' AND EXISTS (SELECT 1 FROM public.learner_profiles WHERE user_id = v.user_id AND profile_role = 'estudante') AND NOT EXISTS (SELECT 1 FROM public.test_profile_access t WHERE t.user_id = v.user_id) THEN
    PERFORM public.migrate_learner_role(v.user_id, 'geral', 'estudante');
    owner_role := 'estudante';
  END IF;
  INSERT INTO public.notifications(user_id, profile_role, title, body)
  VALUES (v.user_id, COALESCE(owner_role, 'estudante'), CASE WHEN _approved THEN 'Vínculo validado' ELSE 'Declaração recusada' END,
    CASE WHEN _approved THEN 'Seu Perfil Estudante está ativo até ' || to_char(_until AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') || '.' ELSE _reason || '. Você pode enviar uma nova declaração.' END);
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, scope_id, action, entity, meta) VALUES (auth.uid(), v.institution_id, CASE WHEN v.institution_id IS NOT NULL THEN 'ies' END, v.scope_id, 'vinculo_validado', 'student_verifications', jsonb_build_object('verification_id', _id, 'approved', _approved));
END $$;
REVOKE ALL ON FUNCTION public.validate_student_verification(uuid, boolean, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_student_verification(uuid, boolean, text, timestamptz) TO authenticated;

-- Mensagem de expiração (a lógica de autorização permanece).
CREATE OR REPLACE FUNCTION public.expire_student_verifications() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v record; n integer := 0;
BEGIN
  FOR v IN SELECT * FROM public.student_verifications WHERE status = 'validado' AND valid_until <= now() LOOP
    IF auth.uid() <> v.user_id AND NOT public.can_validate_student(v.institution_id, v.scope_id) THEN CONTINUE; END IF;
    UPDATE public.student_verifications SET status = 'expirado' WHERE id = v.id;
    INSERT INTO public.notifications(user_id, profile_role, title, body) VALUES (v.user_id, 'estudante', 'Vínculo expirado', 'Envie uma nova declaração para continuar no Perfil Estudante.');
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- Planos do Perfil Estudante exigem vínculo validado e vigente ou carência (escritas diretas do cliente).
CREATE OR REPLACE FUNCTION public.guard_student_plan() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND NEW.plan_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.plan_id IS DISTINCT FROM OLD.plan_id)
     AND EXISTS (SELECT 1 FROM public.plans p WHERE p.id = NEW.plan_id AND p.audience = 'estudante')
     AND NOT (EXISTS (SELECT 1 FROM public.student_verifications v WHERE v.user_id = NEW.user_id AND v.status = 'validado' AND v.valid_until > now())
              OR EXISTS (SELECT 1 FROM public.learner_profiles lp WHERE lp.user_id = NEW.user_id AND lp.profile_role = 'estudante' AND lp.grace_until > now())) THEN
    RAISE EXCEPTION 'Planos do Perfil Estudante exigem vínculo validado e vigente ou período de carência';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS subscriptions_student_plan_guard ON public.subscriptions;
CREATE TRIGGER subscriptions_student_plan_guard BEFORE INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.guard_student_plan();
REVOKE EXECUTE ON FUNCTION public.guard_student_plan() FROM PUBLIC, anon, authenticated;

-- Rotina diária: expira vínculos, avisa, migra para o Perfil Geral e aplica trocas de plano agendadas ----------------
CREATE OR REPLACE FUNCTION public.run_student_lifecycle() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s public.platform_settings; v record; r record; expired integer := 0; warned integer := 0; migrated integer := 0; plans_applied integer := 0; days_left integer;
BEGIN
  SELECT * INTO s FROM public.platform_settings;
  FOR v IN SELECT * FROM public.student_verifications WHERE status = 'validado' AND valid_until <= now() LOOP
    UPDATE public.student_verifications SET status = 'expirado' WHERE id = v.id;
    INSERT INTO public.notifications(user_id, profile_role, title, body) SELECT v.user_id, p.role, 'Vínculo expirado', 'Envie uma nova declaração para continuar no Perfil Estudante.' FROM public.profiles p WHERE p.id = v.user_id;
    expired := expired + 1;
  END LOOP;
  FOR r IN
    SELECT p.id, lp.warned_for, public.student_deadline(p.id) dl FROM public.profiles p JOIN public.learner_profiles lp ON lp.user_id = p.id AND lp.profile_role = 'estudante'
    WHERE p.role = 'estudante' AND NOT EXISTS (SELECT 1 FROM public.test_profile_access t WHERE t.user_id = p.id)
  LOOP
    IF r.dl IS NULL THEN
      UPDATE public.learner_profiles SET grace_until = now() + make_interval(days => s.student_grace_days) WHERE user_id = r.id AND profile_role = 'estudante';
    ELSIF r.dl <= now() THEN
      PERFORM public.migrate_learner_role(r.id, 'estudante', 'geral');
      UPDATE public.learner_profiles SET migrated_notice_for = r.dl WHERE user_id = r.id AND profile_role = 'estudante';
      INSERT INTO public.notifications(user_id, profile_role, title, body) VALUES (r.id, 'geral', 'Sua conta foi migrada para o Perfil Geral', 'Seu vínculo estudantil não está vigente. Todo o seu histórico de cursos, certificados, horas e competências foi mantido. Envie uma nova declaração para voltar ao Perfil Estudante.');
      migrated := migrated + 1;
    ELSIF r.dl <= now() + make_interval(days => s.student_warning_days) AND r.warned_for IS DISTINCT FROM r.dl THEN
      days_left := greatest(1, ceil(extract(epoch FROM (r.dl - now())) / 86400)::integer);
      INSERT INTO public.notifications(user_id, profile_role, title, body) VALUES (r.id, 'estudante', 'Seu acesso ao Perfil Estudante termina em ' || days_left || ' dias', 'Envie ou renove sua declaração de matrícula até ' || to_char(r.dl AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') || ' para continuar. Depois disso sua conta passa ao Perfil Geral, mantendo todo o histórico.');
      UPDATE public.learner_profiles SET warned_for = r.dl WHERE user_id = r.id AND profile_role = 'estudante';
      warned := warned + 1;
    END IF;
  END LOOP;
  UPDATE public.subscriptions sub SET plan_id = sub.pending_plan_id, amount_cents = CASE WHEN sub.cycle = 'anual' THEN pl.price_year_cents ELSE pl.price_month_cents END, pending_plan_id = NULL, pending_effective_at = NULL
  FROM public.plans pl WHERE pl.id = sub.pending_plan_id AND sub.pending_effective_at <= now();
  GET DIAGNOSTICS plans_applied = ROW_COUNT;
  RETURN jsonb_build_object('expired', expired, 'warned', warned, 'migrated', migrated, 'plans_changed', plans_applied);
END $$;
REVOKE ALL ON FUNCTION public.run_student_lifecycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_student_lifecycle() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_run_student_lifecycle() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_upgrade_staff() THEN RAISE EXCEPTION 'Acesso restrito à equipe Upgrade'; END IF;
  RETURN public.run_student_lifecycle();
END $$;
REVOKE ALL ON FUNCTION public.admin_run_student_lifecycle() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_run_student_lifecycle() TO authenticated;

-- Agendamento diário (06:15 UTC) quando o pg_cron estiver disponível. Caso contrário, use a rota de servidor
-- /api/public/student-lifecycle (protegida por segredo) chamada por um agendador externo.
DO $cron$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_cron indisponível: %', SQLERRM;
  END;
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.schedule('student-lifecycle-daily', '15 6 * * *', 'SELECT public.run_student_lifecycle()');
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Não foi possível agendar a rotina: %', SQLERRM;
    END;
  END IF;
END $cron$;
