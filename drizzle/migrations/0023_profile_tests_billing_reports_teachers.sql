-- Blocos F1, F3, F4, F5, F6, F7 e I. Aditiva: nenhuma tabela/coluna removida; nenhum registro apagado.

-- ============================================================ F1. Histórico acadêmico (estrutura; extração por IA pendente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('academic-history', 'academic-history', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.academic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_role public.profile_role NOT NULL,
  file_path text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando_extracao' CHECK (status IN ('aguardando_extracao', 'extraido', 'falha')),
  extracted_skills text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, file_path)
);
ALTER TABLE public.academic_documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.academic_documents TO authenticated;
GRANT ALL ON public.academic_documents TO service_role;
CREATE POLICY academic_documents_own ON public.academic_documents FOR SELECT TO authenticated USING (user_id = auth.uid() AND profile_role = public.current_profile_role());
CREATE POLICY academic_documents_role_guard ON public.academic_documents AS RESTRICTIVE FOR SELECT TO authenticated USING (public.current_profile_role() IN ('estudante', 'geral', 'colaborador'));

-- Arquivo privado: somente o dono, no perfil de aprendizado ativo. Ninguém mais (IES, professor, empresa) lê.
DROP POLICY IF EXISTS academic_history_insert ON storage.objects;
CREATE POLICY academic_history_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'academic-history' AND public.current_profile_role() IN ('estudante', 'geral', 'colaborador') AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] = public.current_profile_role()::text);
DROP POLICY IF EXISTS academic_history_read ON storage.objects;
CREATE POLICY academic_history_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'academic-history' AND (storage.foldername(name))[1] = auth.uid()::text AND (storage.foldername(name))[2] = public.current_profile_role()::text);

CREATE OR REPLACE FUNCTION public.register_academic_document(_path text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.profile_role := public.current_profile_role(); id uuid; sz numeric;
BEGIN
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral', 'colaborador') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _path IS NULL OR _path !~ ('^' || auth.uid()::text || '/' || r::text || '/[^/]+\.(pdf|jpe?g|png)$') THEN RAISE EXCEPTION 'Arquivo inválido: use PDF, JPG ou PNG'; END IF;
  SELECT (metadata ->> 'size')::numeric INTO sz FROM storage.objects WHERE bucket_id = 'academic-history' AND name = _path;
  IF NOT FOUND THEN RAISE EXCEPTION 'Arquivo não encontrado'; END IF;
  IF sz IS NOT NULL AND sz > 10485760 THEN RAISE EXCEPTION 'Arquivo acima de 10 MB'; END IF;
  INSERT INTO public.academic_documents(user_id, profile_role, file_path) VALUES (auth.uid(), r, _path) ON CONFLICT (user_id, file_path) DO UPDATE SET file_path = EXCLUDED.file_path RETURNING academic_documents.id INTO id;
  RETURN id;
END $$;
REVOKE ALL ON FUNCTION public.register_academic_document(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_academic_document(text) TO authenticated;

-- Aplicação do resultado da extração: somente servidor (service_role). Só aceita nomes do catálogo de competências;
-- qualquer outro conteúdo (inclusive atributos sensíveis) é descartado e nunca persistido.
CREATE OR REPLACE FUNCTION public.apply_academic_extraction(_doc uuid, _skills text[]) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d public.academic_documents; n integer;
BEGIN
  SELECT * INTO d FROM public.academic_documents WHERE id = _doc;
  IF NOT FOUND THEN RAISE EXCEPTION 'Documento não encontrado'; END IF;
  WITH matched AS (SELECT s.id, s.name FROM public.skills s WHERE public.normalize_text(s.name) = ANY (SELECT public.normalize_text(x) FROM unnest(_skills) x)),
  ins AS (INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified) SELECT d.user_id, d.profile_role, m.id, 30, 'historico', false FROM matched m
    ON CONFLICT (user_id, profile_role, skill_id, origin) DO NOTHING RETURNING 1)
  SELECT count(*) INTO n FROM ins;
  UPDATE public.academic_documents SET status = 'extraido', extracted_skills = ARRAY(SELECT name FROM public.skills WHERE public.normalize_text(name) = ANY (SELECT public.normalize_text(x) FROM unnest(_skills) x)) WHERE id = _doc;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.apply_academic_extraction(uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_academic_extraction(uuid, text[]) TO service_role;

-- ============================================================ F3. Testes comportamental, de raciocínio e vocacional
-- Pontuação no servidor; gabaritos ficam fora do alcance do navegador. Conteúdo inicial é um conjunto mínimo a ser revisado.
CREATE TABLE IF NOT EXISTS public.profile_tests (
  test_type text PRIMARY KEY CHECK (test_type IN ('comportamental', 'raciocinio', 'vocacional')),
  title text NOT NULL,
  questions jsonb NOT NULL
);
ALTER TABLE public.profile_tests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profile_tests TO service_role;

INSERT INTO public.profile_tests(test_type, title, questions) VALUES
('comportamental', 'Teste comportamental', '[
 {"q":"Prefiro trabalhar em equipe a trabalhar sozinho(a).","dimension":"Trabalho em equipe"},
 {"q":"Costumo ajudar colegas quando precisam.","dimension":"Trabalho em equipe"},
 {"q":"Explico minhas ideias com clareza.","dimension":"Comunicação"},
 {"q":"Escuto com atenção antes de opinar.","dimension":"Comunicação"},
 {"q":"Planejo minhas tarefas e cumpro prazos.","dimension":"Organização"},
 {"q":"Mantenho minhas atividades em ordem.","dimension":"Organização"},
 {"q":"Continuo tentando quando algo dá errado.","dimension":"Resiliência"},
 {"q":"Aprendo com meus erros.","dimension":"Resiliência"}]'),
('raciocinio', 'Teste de raciocínio lógico', '[
 {"q":"Qual número completa a sequência 2, 4, 8, 16, ?","options":["18","24","32","64"],"answer":2},
 {"q":"Se todos os A são B e todos os B são C, então todos os A são:","options":["C","nenhum C","apenas B","não é possível saber"],"answer":0},
 {"q":"Qual é o dobro de 3,5?","options":["6","7","7,5","8"],"answer":1},
 {"q":"Em uma fila, Ana está antes de Bia e Bia antes de Carla. Quem está no meio?","options":["Ana","Bia","Carla","não é possível saber"],"answer":1},
 {"q":"Qual número não pertence ao grupo: 2, 3, 5, 9, 11?","options":["2","3","9","11"],"answer":2}]'),
('vocacional', 'Teste vocacional (ensino médio)', '[
 {"q":"Gosto de resolver problemas com números e lógica.","area":"Tecnologia"},
 {"q":"Gosto de montar ou programar coisas.","area":"Tecnologia"},
 {"q":"Gosto de cuidar de pessoas e do bem-estar.","area":"Saúde"},
 {"q":"Tenho curiosidade sobre o corpo humano.","area":"Saúde"},
 {"q":"Gosto de criar textos, desenhos ou vídeos.","area":"Comunicação e Artes"},
 {"q":"Gosto de apresentar ideias ao público.","area":"Comunicação e Artes"},
 {"q":"Gosto de organizar planos, orçamentos e equipes.","area":"Gestão e Negócios"},
 {"q":"Gosto de negociar e vender ideias.","area":"Gestão e Negócios"}]')
ON CONFLICT (test_type) DO NOTHING;

-- Bloqueia escrita direta no navegador: o resultado só nasce da função abaixo.
CREATE POLICY behavioral_no_client_insert ON public.behavioral_tests AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY behavioral_no_client_update ON public.behavioral_tests AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY behavioral_no_client_delete ON public.behavioral_tests AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.get_profile_test(_type text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.profile_role := public.current_profile_role(); t public.profile_tests;
BEGIN
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral', 'colaborador') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO t FROM public.profile_tests WHERE test_type = _type;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teste não encontrado'; END IF;
  IF _type = 'vocacional' AND NOT EXISTS (SELECT 1 FROM public.learner_profiles WHERE user_id = auth.uid() AND profile_role = r AND education_level = 'medio') THEN RAISE EXCEPTION 'O teste vocacional é exclusivo do ensino médio'; END IF;
  RETURN jsonb_build_object('type', t.test_type, 'title', t.title,
    'questions', (SELECT jsonb_agg(CASE WHEN q ? 'options' THEN jsonb_build_object('q', q -> 'q', 'options', q -> 'options') ELSE jsonb_build_object('q', q -> 'q') END ORDER BY ord) FROM jsonb_array_elements(t.questions) WITH ORDINALITY AS e(q, ord)),
    'scale', CASE WHEN _type = 'raciocinio' THEN NULL ELSE '1 = discordo totalmente · 5 = concordo totalmente' END);
END $$;
REVOKE ALL ON FUNCTION public.get_profile_test(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_test(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_profile_test(_type text, _answers jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.profile_role := public.current_profile_role(); t public.profile_tests; n integer; res jsonb; label text; matching boolean;
BEGIN
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral', 'colaborador') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT * INTO t FROM public.profile_tests WHERE test_type = _type;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teste não encontrado'; END IF;
  IF _type = 'vocacional' AND NOT EXISTS (SELECT 1 FROM public.learner_profiles WHERE user_id = auth.uid() AND profile_role = r AND education_level = 'medio') THEN RAISE EXCEPTION 'O teste vocacional é exclusivo do ensino médio'; END IF;
  n := jsonb_array_length(t.questions);
  IF jsonb_typeof(_answers) <> 'array' OR jsonb_array_length(_answers) <> n THEN RAISE EXCEPTION 'Responda todas as perguntas'; END IF;
  IF _type = 'raciocinio' THEN
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(_answers) WITH ORDINALITY a(v, i) WHERE jsonb_typeof(a.v) <> 'number' OR (a.v #>> '{}')::int NOT BETWEEN 0 AND jsonb_array_length(t.questions -> (a.i - 1)::int -> 'options') - 1) THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
    res := jsonb_build_object('score', (SELECT round(100.0 * count(*) FILTER (WHERE (a.v #>> '{}')::int = (t.questions -> (a.i - 1)::int ->> 'answer')::int) / n) FROM jsonb_array_elements(_answers) WITH ORDINALITY a(v, i)));
    label := 'Raciocínio lógico';
  ELSE
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(_answers) a(v) WHERE jsonb_typeof(a.v) <> 'number' OR (a.v #>> '{}')::int NOT BETWEEN 1 AND 5) THEN RAISE EXCEPTION 'Resposta inválida'; END IF;
    res := jsonb_build_object('dimensions', (SELECT jsonb_object_agg(k, v) FROM (SELECT COALESCE(q ->> 'dimension', q ->> 'area') k, round(20.0 * avg((a.v #>> '{}')::int)) v FROM jsonb_array_elements(t.questions) WITH ORDINALITY e(q, i) JOIN jsonb_array_elements(_answers) WITH ORDINALITY a(v, j) ON j = i GROUP BY 1) d));
    SELECT key INTO label FROM jsonb_each_text(res -> 'dimensions') ORDER BY value::int DESC, key LIMIT 1;
  END IF;
  INSERT INTO public.behavioral_tests(user_id, profile_role, result, profile_label, test_type) VALUES (auth.uid(), r, res, label, _type);
  -- Competências geradas pelo teste (origem "teste", não verificadas); o matching usa a mesma tabela.
  IF _type = 'raciocinio' THEN
    INSERT INTO public.skills(name, slug) VALUES ('Raciocínio lógico', 'raciocinio-logico') ON CONFLICT (slug) DO NOTHING;
    INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at) SELECT auth.uid(), r, id, (res ->> 'score')::int, 'teste', false, now() FROM public.skills WHERE slug = 'raciocinio-logico'
      ON CONFLICT (user_id, profile_role, skill_id, origin) DO UPDATE SET level = EXCLUDED.level, acquired_at = now();
  ELSIF _type = 'comportamental' THEN
    INSERT INTO public.skills(name, slug) SELECT k, public.normalize_text(replace(k, ' ', '-')) FROM jsonb_object_keys(res -> 'dimensions') k ON CONFLICT (slug) DO NOTHING;
    INSERT INTO public.user_competencies(user_id, profile_role, skill_id, level, origin, verified, acquired_at) SELECT auth.uid(), r, s.id, d.value::int, 'teste', false, now()
      FROM jsonb_each_text(res -> 'dimensions') d JOIN public.skills s ON s.slug = public.normalize_text(replace(d.key, ' ', '-'))
      ON CONFLICT (user_id, profile_role, skill_id, origin) DO UPDATE SET level = EXCLUDED.level, acquired_at = now();
  END IF;
  SELECT COALESCE(lp.matching_enabled, false) INTO matching FROM public.learner_profiles lp WHERE lp.user_id = auth.uid() AND lp.profile_role = r;
  IF r IN ('estudante', 'geral') AND matching THEN PERFORM public.create_matches(NULL, auth.uid()); END IF;
  RETURN jsonb_build_object('type', _type, 'label', label, 'result', res);
END $$;
REVOKE ALL ON FUNCTION public.submit_profile_test(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_profile_test(text, jsonb) TO authenticated;

-- ============================================================ F4. Licenças e faturamento da empresa (permissão "faturamento", sem escopo)
CREATE OR REPLACE FUNCTION public.company_billing(_company uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.organization_permission(_company, 'empresa', 'faturamento') THEN RAISE EXCEPTION 'Faturamento exige permissão específica sem restrição de escopo'; END IF;
  RETURN jsonb_build_object(
    'seats_used', (SELECT count(*) FROM public.company_employees e WHERE e.company_id = _company AND e.ended_at IS NULL),
    'subscription', (SELECT jsonb_build_object('status', s.status, 'cycle', s.cycle, 'seats', s.seats, 'amount_cents', s.amount_cents, 'plan', p.name, 'current_period_end', s.current_period_end) FROM public.subscriptions s LEFT JOIN public.plans p ON p.id = s.plan_id WHERE s.company_id = _company ORDER BY s.created_at DESC LIMIT 1),
    'payments', COALESCE((SELECT jsonb_agg(jsonb_build_object('amount_cents', x.amount_cents, 'status', x.status, 'method', x.method, 'paid_at', x.paid_at, 'description', x.description) ORDER BY x.created_at DESC) FROM (SELECT py.* FROM public.payments py JOIN public.subscriptions s ON s.id = py.subscription_id WHERE s.company_id = _company ORDER BY py.created_at DESC LIMIT 24) x), '[]'));
END $$;
REVOKE ALL ON FUNCTION public.company_billing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_billing(uuid) TO authenticated;

-- ============================================================ F5. Relatórios da empresa (permissão "relatorios", respeita escopo)
CREATE OR REPLACE FUNCTION public.company_report(_company uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sc uuid[]; unrestricted boolean := false;
BEGIN
  IF auth.uid() IS NULL OR _company IS NULL OR public.current_profile_role()::text <> 'empresa' THEN RAISE EXCEPTION 'Relatórios exigem acesso da empresa'; END IF;
  IF public.organization_permission(_company, 'empresa', 'relatorios') THEN unrestricted := true;
  ELSE
    SELECT m.scope_ids INTO sc FROM public.organization_memberships m WHERE m.organization_id = _company AND m.organization_type = 'empresa' AND m.user_id = auth.uid() AND m.status = 'ativo' AND 'relatorios' = ANY(m.permissions) AND cardinality(m.scope_ids) > 0;
    IF sc IS NULL THEN RAISE EXCEPTION 'Relatórios exigem acesso da empresa'; END IF;
  END IF;
  RETURN (WITH emp AS (SELECT e.user_id FROM public.company_employees e WHERE e.company_id = _company AND e.ended_at IS NULL AND (unrestricted OR e.scope_id = ANY(sc)))
    SELECT jsonb_build_object(
      'scoped', NOT unrestricted,
      'employees', (SELECT count(*) FROM emp),
      'certificates', (SELECT count(*) FROM public.certificates c JOIN emp ON emp.user_id = c.user_id WHERE c.profile_role = 'colaborador'),
      'hours', (SELECT COALESCE(sum(c.hours), 0) FROM public.certificates c JOIN emp ON emp.user_id = c.user_id WHERE c.profile_role = 'colaborador'),
      'completion', (SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE en.progress >= 100) / NULLIF(count(*), 0)), 0) FROM public.enrollments en JOIN emp ON emp.user_id = en.user_id WHERE en.profile_role = 'colaborador'),
      'top_competencies', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', name, 'n', n)) FROM (SELECT s.name, count(DISTINCT uc.user_id)::int n FROM public.user_competencies uc JOIN emp ON emp.user_id = uc.user_id JOIN public.skills s ON s.id = uc.skill_id WHERE uc.profile_role = 'colaborador' GROUP BY s.name ORDER BY n DESC, s.name LIMIT 10) t), '[]'),
      'jobs', CASE WHEN unrestricted THEN jsonb_build_object('open', (SELECT count(*) FROM public.jobs j WHERE j.company_id = _company AND j.status = 'aberta'), 'closed', (SELECT count(*) FROM public.jobs j WHERE j.company_id = _company AND j.status <> 'aberta'), 'accepted_candidacies', (SELECT count(*) FROM public.matches m JOIN public.jobs j ON j.id = m.job_id WHERE j.company_id = _company AND m.status = 'aceita')) END));
END $$;
REVOKE ALL ON FUNCTION public.company_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_report(uuid) TO authenticated;

-- ============================================================ F6. Professores vinculados à IES (permissão "professores", sem escopo)
CREATE TABLE IF NOT EXISTS public.ies_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id),
  professor_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'removido')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, professor_id)
);
ALTER TABLE public.ies_teachers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ies_teachers TO authenticated;
GRANT ALL ON public.ies_teachers TO service_role;
CREATE POLICY ies_teachers_read ON public.ies_teachers FOR SELECT TO authenticated USING (public.organization_permission(institution_id, 'ies', 'professores') OR (professor_id = auth.uid() AND public.current_profile_role() = 'professor'));

CREATE OR REPLACE FUNCTION public.ies_link_teacher(_institution uuid, _email text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.profiles; id uuid;
BEGIN
  IF NOT public.organization_permission(_institution, 'ies', 'professores') THEN RAISE EXCEPTION 'Permissão necessária: gerenciar professores vinculados'; END IF;
  SELECT * INTO p FROM public.profiles WHERE lower(email) = lower(btrim(_email)) AND role = 'professor';
  IF NOT FOUND THEN RAISE EXCEPTION 'Professor não encontrado: o cadastro de professores é feito pela equipe Upgrade'; END IF;
  INSERT INTO public.ies_teachers(institution_id, professor_id, created_by) VALUES (_institution, p.id, auth.uid())
    ON CONFLICT (institution_id, professor_id) DO UPDATE SET status = 'ativo' RETURNING ies_teachers.id INTO id;
  INSERT INTO public.notifications(user_id, profile_role, title, body) VALUES (p.id, 'professor', 'Vínculo com instituição', 'Você foi vinculado(a) a uma instituição de ensino parceira.');
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, action, entity, meta) VALUES (auth.uid(), _institution, 'ies', 'professor_vinculado', 'ies_teachers', jsonb_build_object('teacher_link', id));
  RETURN id;
END $$;
CREATE OR REPLACE FUNCTION public.ies_unlink_teacher(_link uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t public.ies_teachers;
BEGIN
  SELECT * INTO t FROM public.ies_teachers WHERE id = _link;
  IF NOT FOUND OR NOT public.organization_permission(t.institution_id, 'ies', 'professores') THEN RAISE EXCEPTION 'Permissão necessária: gerenciar professores vinculados'; END IF;
  UPDATE public.ies_teachers SET status = 'removido' WHERE id = _link;
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, action, entity, meta) VALUES (auth.uid(), t.institution_id, 'ies', 'professor_desvinculado', 'ies_teachers', jsonb_build_object('teacher_link', _link));
END $$;
CREATE OR REPLACE FUNCTION public.ies_list_teachers(_institution uuid) RETURNS TABLE(link_id uuid, full_name text, email text, status text, linked_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.organization_permission(_institution, 'ies', 'professores') THEN RAISE EXCEPTION 'Permissão necessária: gerenciar professores vinculados'; END IF;
  RETURN QUERY SELECT t.id, p.full_name, p.email, t.status, t.created_at FROM public.ies_teachers t JOIN public.profiles p ON p.id = t.professor_id WHERE t.institution_id = _institution ORDER BY t.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.ies_link_teacher(uuid, text), public.ies_unlink_teacher(uuid), public.ies_list_teachers(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ies_link_teacher(uuid, text), public.ies_unlink_teacher(uuid), public.ies_list_teachers(uuid) TO authenticated;

-- ============================================================ F7. Cursos da IES por escopo (permissão "cursos")
-- Turmas não ganham estrutura própria: o escopo (curso/campus/centro) já cumpre o papel de agrupador. Decisão registrada no relatório.
CREATE OR REPLACE FUNCTION public.ies_list_courses(_institution uuid) RETURNS TABLE(course_id uuid, title text, status text, hours numeric, scope_id uuid, scope_name text, modules bigint, enrollments bigint) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sc uuid[]; unrestricted boolean;
BEGIN
  IF auth.uid() IS NULL OR public.current_profile_role()::text <> 'ies' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  unrestricted := public.organization_permission(_institution, 'ies', 'cursos');
  IF NOT unrestricted THEN
    SELECT m.scope_ids INTO sc FROM public.organization_memberships m WHERE m.organization_id = _institution AND m.organization_type = 'ies' AND m.user_id = auth.uid() AND m.status = 'ativo' AND 'cursos' = ANY(m.permissions) AND cardinality(m.scope_ids) > 0;
    IF sc IS NULL THEN RAISE EXCEPTION 'Permissão necessária: gerenciar cursos e turmas'; END IF;
  END IF;
  RETURN QUERY SELECT c.id, c.title, c.status, c.hours, c.scope_id, s.name, (SELECT count(*) FROM public.course_modules cm WHERE cm.course_id = c.id), (SELECT count(*) FROM public.enrollments e WHERE e.course_id = c.id)
    FROM public.courses c LEFT JOIN public.organization_scopes s ON s.id = c.scope_id WHERE c.institution_id = _institution AND (unrestricted OR c.scope_id = ANY(sc)) ORDER BY c.title;
END $$;
CREATE OR REPLACE FUNCTION public.ies_set_course_scope(_course uuid, _scope uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c public.courses;
BEGIN
  SELECT * INTO c FROM public.courses WHERE id = _course AND institution_id IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Curso não encontrado'; END IF;
  IF _scope IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organization_scopes s WHERE s.id = _scope AND s.organization_id = c.institution_id AND s.organization_type = 'ies') THEN RAISE EXCEPTION 'Escopo inválido'; END IF;
  -- precisa poder gerenciar o escopo de origem e o de destino (escopo nulo = só quem não tem restrição)
  IF NOT public.organization_permission(c.institution_id, 'ies', 'cursos', c.scope_id) OR NOT public.organization_permission(c.institution_id, 'ies', 'cursos', _scope) THEN RAISE EXCEPTION 'Permissão necessária: gerenciar cursos e turmas neste escopo'; END IF;
  UPDATE public.courses SET scope_id = _scope WHERE id = _course;
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, scope_id, action, entity, meta) VALUES (auth.uid(), c.institution_id, 'ies', _scope, 'curso_escopo_alterado', 'courses', jsonb_build_object('course', _course, 'from', c.scope_id, 'to', _scope));
END $$;
REVOKE ALL ON FUNCTION public.ies_list_courses(uuid), public.ies_set_course_scope(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ies_list_courses(uuid), public.ies_set_course_scope(uuid, uuid) TO authenticated;

-- ============================================================ I1. Cadastro de professor por função administrativa (com log)
CREATE OR REPLACE FUNCTION public.admin_register_professor(_email text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p public.profiles;
BEGIN
  IF NOT public.is_upgrade_staff() THEN RAISE EXCEPTION 'Acesso restrito à equipe Upgrade'; END IF;
  SELECT * INTO p FROM public.profiles WHERE lower(email) = lower(btrim(_email));
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhuma conta encontrada com este e-mail. Peça o cadastro primeiro.'; END IF;
  IF p.role IS NOT NULL AND p.role <> 'professor' AND EXISTS (SELECT 1 FROM public.company_employees e WHERE e.user_id = p.id AND e.ended_at IS NULL) THEN RAISE EXCEPTION 'A conta é de colaborador ativo'; END IF;
  UPDATE public.profiles SET role = 'professor' WHERE id = p.id;
  INSERT INTO public.activity_logs(user_id, action, entity, meta) VALUES (auth.uid(), 'professor_habilitado', 'profiles', jsonb_build_object('professor', p.id, 'role_before', p.role));
  RETURN p.id;
END $$;
REVOKE ALL ON FUNCTION public.admin_register_professor(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_register_professor(text) TO authenticated;

-- ============================================================ I3. Troca de perfis de teste só com a chave de plataforma ligada (padrão: desligada)
CREATE OR REPLACE FUNCTION public.switch_test_profile(_role public.profile_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE access_row public.test_profile_access; learner public.learner_profiles;
BEGIN
  IF NOT public.test_switch_enabled() THEN RAISE EXCEPTION 'Troca de perfis de teste desativada neste ambiente'; END IF;
  SELECT * INTO access_row FROM public.test_profile_access WHERE user_id = auth.uid() AND role = _role;
  IF NOT FOUND THEN RAISE EXCEPTION 'Acesso de teste não autorizado'; END IF;
  IF _role IN ('estudante', 'geral', 'colaborador') THEN
    INSERT INTO public.learner_profiles(user_id, profile_role, institution_id) VALUES (auth.uid(), _role, access_row.institution_id) ON CONFLICT DO NOTHING;
    SELECT * INTO learner FROM public.learner_profiles WHERE user_id = auth.uid() AND profile_role = _role;
  END IF;
  UPDATE public.profiles SET role = _role, company_id = access_row.company_id, institution_id = access_row.institution_id, matching_enabled = COALESCE(learner.matching_enabled, false), xp = COALESCE(learner.xp, 0), level = COALESCE(learner.level, 1), plan = 'teste' WHERE id = auth.uid();
END $$;

-- ============================================================ Contagens "depois" (comparáveis às "antes:" registradas na 0016)
INSERT INTO public.data_migration_log(migration, metric, value)
SELECT '0023', 'depois:' || metric, value FROM (
  SELECT 'profiles' metric, count(*) value FROM public.profiles
  UNION ALL SELECT 'courses', count(*) FROM public.courses
  UNION ALL SELECT 'enrollments', count(*) FROM public.enrollments
  UNION ALL SELECT 'certificates', count(*) FROM public.certificates
  UNION ALL SELECT 'lesson_views', count(*) FROM public.lesson_views
  UNION ALL SELECT 'student_verifications', count(*) FROM public.student_verifications
  UNION ALL SELECT 'learner_profiles', count(*) FROM public.learner_profiles
) t;
