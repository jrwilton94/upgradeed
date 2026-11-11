-- Bloco A: vincular o aluno à instituição parceira (institution_id) e rotear a declaração.

-- Escopo (curso) da instituição correspondente ao nome informado; só resolve quando há exatamente um.
CREATE OR REPLACE FUNCTION public.resolve_institution_scope(_institution uuid, _course text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN count(*) = 1 THEN (array_agg(s.id))[1] END
  FROM public.organization_scopes s
  WHERE s.organization_id = _institution AND s.organization_type = 'ies'
    AND length(public.normalize_text(_course)) > 0
    AND public.normalize_text(s.name) = public.normalize_text(_course)
$$;
REVOKE ALL ON FUNCTION public.resolve_institution_scope(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_institution_scope(uuid, text) TO service_role;

-- Busca de instituições cadastradas para o onboarding (a leitura direta da tabela é restrita).
CREATE OR REPLACE FUNCTION public.search_institutions(_query text) RETURNS TABLE(id uuid, name text, city text, state text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT i.id, i.name, i.city, i.state FROM public.institutions i
  WHERE auth.uid() IS NOT NULL AND i.status = 'ativo' AND length(btrim(COALESCE(_query, ''))) >= 2
    AND public.normalize_text(i.name) LIKE '%' || public.normalize_text(_query) || '%'
  ORDER BY i.name LIMIT 20
$$;
REVOKE ALL ON FUNCTION public.search_institutions(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_institutions(text) TO authenticated;

-- Migração de dados: preenche institution_id quando o nome coincide exatamente (sem diferenciar caixa/acentos)
-- com UMA instituição. Casos ambíguos ou sem correspondência ficam sem vínculo e são contados.
DO $$
DECLARE candidates bigint; linked bigint; scoped bigint; routed bigint;
BEGIN
  SELECT count(*) INTO candidates FROM public.learner_profiles WHERE institution_id IS NULL AND length(btrim(COALESCE(institution_name, ''))) > 0;
  WITH m AS (
    SELECT lp.user_id, lp.profile_role, array_agg(i.id) ids
    FROM public.learner_profiles lp JOIN public.institutions i ON public.normalize_text(i.name) = public.normalize_text(lp.institution_name)
    WHERE lp.institution_id IS NULL AND length(btrim(COALESCE(lp.institution_name, ''))) > 0
    GROUP BY lp.user_id, lp.profile_role
  )
  UPDATE public.learner_profiles lp SET institution_id = m.ids[1] FROM m
  WHERE lp.user_id = m.user_id AND lp.profile_role = m.profile_role AND cardinality(m.ids) = 1;
  GET DIAGNOSTICS linked = ROW_COUNT;

  UPDATE public.learner_profiles lp SET scope_id = public.resolve_institution_scope(lp.institution_id, lp.course_name)
  WHERE lp.institution_id IS NOT NULL AND lp.scope_id IS NULL AND lp.course_name IS NOT NULL;
  GET DIAGNOSTICS scoped = ROW_COUNT;

  -- Declarações já enviadas passam a constar na fila da instituição do aluno.
  UPDATE public.student_verifications v SET institution_id = lp.institution_id, scope_id = COALESCE(v.scope_id, lp.scope_id)
  FROM public.learner_profiles lp
  WHERE lp.user_id = v.user_id AND lp.profile_role = 'estudante' AND v.institution_id IS NULL AND lp.institution_id IS NOT NULL;
  GET DIAGNOSTICS routed = ROW_COUNT;

  INSERT INTO public.data_migration_log(migration, metric, value) VALUES
    ('0017', 'learner_profiles com instituição em texto e sem institution_id', candidates),
    ('0017', 'learner_profiles vinculados a uma instituição', linked),
    ('0017', 'learner_profiles sem correspondência única (ficam sem vínculo)', candidates - linked),
    ('0017', 'learner_profiles com escopo de curso resolvido', scoped),
    ('0017', 'declarações redirecionadas para a fila da instituição', routed);
END $$;

-- Cadastro: grava institution_id quando a instituição é parceira e inicia a carência do estudante.
CREATE OR REPLACE FUNCTION public.configure_profile(_role public.profile_role, _details jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.profiles; org uuid; level_value text; inst_id uuid; inst_name text; scope uuid; grace integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  SELECT * INTO p FROM public.profiles WHERE id = auth.uid();
  IF p.role IS NOT NULL THEN RAISE EXCEPTION 'Perfil já configurado; use os acessos autorizados'; END IF;
  IF _role IN ('professor', 'colaborador') THEN RAISE EXCEPTION 'Esse perfil depende de vínculo autorizado pela organização ou Upgrade'; END IF;

  IF _role = 'estudante' THEN
    level_value := _details->>'education_level';
    inst_name := trim(COALESCE(_details->>'institution_name', ''));
    IF COALESCE(_details->>'institution_id', '') <> '' THEN
      SELECT i.id, i.name INTO inst_id, inst_name FROM public.institutions i WHERE i.id = (_details->>'institution_id')::uuid AND i.status = 'ativo';
      IF inst_id IS NULL THEN RAISE EXCEPTION 'Instituição parceira não encontrada'; END IF;
    END IF;
    IF level_value NOT IN ('basico', 'medio', 'graduacao', 'pos') OR length(inst_name) < 2 THEN RAISE EXCEPTION 'Informe nível de ensino e instituição'; END IF;
    IF level_value IN ('graduacao', 'pos') AND (length(trim(COALESCE(_details->>'course_name', ''))) = 0 OR length(trim(COALESCE(_details->>'semester', ''))) = 0 OR length(trim(COALESCE(_details->>'registration_number', ''))) = 0) THEN RAISE EXCEPTION 'Curso, semestre e número de matrícula são obrigatórios'; END IF;
    IF level_value IN ('medio', 'basico') AND (length(trim(COALESCE(_details->>'school_year', ''))) = 0 OR length(trim(COALESCE(_details->>'classroom', ''))) = 0) THEN RAISE EXCEPTION 'Série e turma são obrigatórias'; END IF;
    IF inst_id IS NOT NULL THEN scope := public.resolve_institution_scope(inst_id, _details->>'course_name'); END IF;
  END IF;

  IF _role = 'empresa' THEN
    IF length(trim(COALESCE(_details->>'organization_name', ''))) < 2 THEN RAISE EXCEPTION 'Informe o nome da empresa'; END IF;
    INSERT INTO public.companies(name, code, owner_id, cnpj) VALUES (trim(_details->>'organization_name'), upper(substr(md5(gen_random_uuid()::text), 1, 10)), auth.uid(), NULLIF(regexp_replace(COALESCE(_details->>'cnpj', ''), '\D', '', 'g'), '')) RETURNING id INTO org;
  ELSIF _role = 'ies' THEN
    IF length(trim(COALESCE(_details->>'organization_name', ''))) < 2 THEN RAISE EXCEPTION 'Informe o nome da instituição'; END IF;
    INSERT INTO public.institutions(name, owner_id, cnpj) VALUES (trim(_details->>'organization_name'), auth.uid(), NULLIF(regexp_replace(COALESCE(_details->>'cnpj', ''), '\D', '', 'g'), '')) RETURNING id INTO org;
  END IF;

  UPDATE public.profiles SET role = _role, company_id = CASE WHEN _role = 'empresa' THEN org ELSE NULL END, institution_id = CASE WHEN _role = 'ies' THEN org ELSE NULL END, matching_enabled = false WHERE id = auth.uid();

  IF _role IN ('estudante', 'geral') THEN
    SELECT student_grace_days INTO grace FROM public.platform_settings;
    INSERT INTO public.learner_profiles(user_id, profile_role, education_level, institution_name, institution_id, scope_id, course_name, semester, registration_number, school_year, classroom, works, employer_name, seeks_job, target_area, target_position, grace_until)
    VALUES (auth.uid(), _role, _details->>'education_level', CASE WHEN _role = 'estudante' THEN inst_name ELSE _details->>'institution_name' END, inst_id, scope, _details->>'course_name', _details->>'semester', _details->>'registration_number', _details->>'school_year', _details->>'classroom', COALESCE((_details->>'works')::boolean, false), _details->>'employer_name', COALESCE((_details->>'seeks_job')::boolean, false), _details->>'target_area', _details->>'target_position',
      CASE WHEN _role = 'estudante' THEN now() + make_interval(days => grace) END);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.configure_profile(public.profile_role, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configure_profile(public.profile_role, jsonb) TO authenticated;
