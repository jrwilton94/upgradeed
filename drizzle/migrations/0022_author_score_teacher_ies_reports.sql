-- Blocos E, G e H: painel real do professor, relatórios agregados da IES (k<5) e conclusão por módulo no score.
-- Aditiva: nenhuma tabela/coluna removida; calculate_author_fund mantém assinatura e colunas.

-- Minutos assistidos por aula em um período (regras do fundo: sessão >= 20s, teto de uma duração do vídeo por usuário/dia).
CREATE OR REPLACE FUNCTION public.lesson_minutes(_from date, _to date)
RETURNS TABLE(lesson_id uuid, minutes numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH daily AS (
    SELECT v.user_id, v.lesson_id, v.viewed_on,
      least(COALESCE(sum(v.seconds_watched) FILTER (WHERE v.seconds_watched >= 20), 0), max(l.duration_min) * 60) seconds
    FROM public.lesson_views v JOIN public.lessons l ON l.id = v.lesson_id
    WHERE v.viewed_on >= _from AND v.viewed_on < _to
    GROUP BY v.user_id, v.lesson_id, v.viewed_on)
  SELECT d.lesson_id, round(sum(d.seconds) / 60.0, 2) FROM daily d GROUP BY d.lesson_id HAVING sum(d.seconds) > 0
$$;
REVOKE ALL ON FUNCTION public.lesson_minutes(date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_minutes(date, date) TO service_role;

-- Correção: least(NULL, x) devolve x no Postgres; uma sessão < 20s contava como o vídeo inteiro. Agora conta zero.
-- H. Conclusão = média, entre os módulos do autor, de (aprovados / iniciantes no mês); depois por autor.
-- A taxa do autor é alocada às linhas por curso proporcionalmente à audiência, preservando a soma por curso.
-- "Iniciante" = usuário/perfil com sessão >= 20s em aula do módulo no mês. "Aprovado" = iniciante com aprovação no módulo no mês.
-- Produção continua contando apenas aulas com audiência no mês. Normalização final mantida (fundo inteiramente distribuído).
CREATE OR REPLACE FUNCTION public.calculate_author_fund(_month date)
 RETURNS TABLE(fund_type text, owner_id uuid, course_id uuid, title text, eligible_minutes numeric, approved_minutes numeric, completion numeric, audience numeric, production numeric, score numeric, estimated_cents bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
WITH daily AS(SELECT v.user_id,v.lesson_id,v.viewed_on,least(COALESCE(sum(v.seconds_watched) FILTER(WHERE v.seconds_watched>=20),0),max(l.duration_min)*60) seconds FROM public.lesson_views v JOIN public.lessons l ON l.id=v.lesson_id WHERE v.viewed_on>=_month AND v.viewed_on<_month+interval '1 month' GROUP BY v.user_id,v.lesson_id,v.viewed_on),
viewed AS(SELECT lesson_id,sum(seconds)/60.0 minutes FROM daily GROUP BY lesson_id HAVING sum(seconds)>0),
base AS(SELECT CASE WHEN c.institution_id IS NULL THEN 'professor' ELSE 'ies' END kind,COALESCE(c.institution_id,c.instructor_id) owner,c.id cid,c.title heading,sum(v.minutes) watched,sum(l.duration_min) FILTER(WHERE v.lesson_id IS NOT NULL)::numeric produced FROM public.courses c JOIN public.lessons l ON l.course_id=c.id LEFT JOIN viewed v ON v.lesson_id=l.id WHERE c.status='publicado' AND c.published AND (c.institution_id IS NOT NULL OR c.instructor_id IS NOT NULL) GROUP BY c.id HAVING sum(v.minutes)>0),
started AS(SELECT l.module_id,v.user_id,v.profile_role FROM public.lesson_views v JOIN public.lessons l ON l.id=v.lesson_id WHERE l.module_id IS NOT NULL AND v.seconds_watched>=20 AND v.viewed_on>=_month AND v.viewed_on<_month+interval '1 month' GROUP BY l.module_id,v.user_id,v.profile_role),
mod_rate AS(SELECT s.module_id,m.course_id,count(*)::numeric n_started,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM public.assessment_attempts a WHERE a.module_id=s.module_id AND a.user_id=s.user_id AND a.profile_role=s.profile_role AND a.passed AND a.created_at>=_month AND a.created_at<_month+interval '1 month'))::numeric n_ok FROM started s JOIN public.course_modules m ON m.id=s.module_id GROUP BY s.module_id,m.course_id),
author_rate AS(SELECT b.kind,b.owner,avg(r.n_ok/r.n_started) rate FROM base b JOIN mod_rate r ON r.course_id=b.cid GROUP BY b.kind,b.owner),
raw AS(SELECT b.*,COALESCE(ar.rate,0)*b.watched/NULLIF(sum(b.watched) OVER(PARTITION BY b.kind,b.owner),0) completed FROM base b LEFT JOIN author_rate ar ON ar.kind=b.kind AND ar.owner=b.owner),
shares AS(SELECT r.*,watched/NULLIF(sum(watched) OVER(PARTITION BY kind),0) aud,produced/NULLIF(sum(produced) OVER(PARTITION BY kind),0) prod,COALESCE(completed/NULLIF(sum(completed) OVER(PARTITION BY kind),0),0) comp FROM raw r),
weighted AS(SELECT sh.*,s.audience_weight*aud+s.production_weight*prod+s.completion_weight*comp weighted_score FROM shares sh CROSS JOIN public.fund_settings s),
normalized AS(SELECT w.*,weighted_score/NULLIF(sum(weighted_score) OVER(PARTITION BY kind),0) final_score FROM weighted w),
revenue AS(SELECT greatest(COALESCE(sum(amount_cents),0),0)::numeric total FROM public.payments WHERE status='pago' AND paid_at>=_month AND paid_at<_month+interval '1 month'),
allocation AS(SELECT n.*,round(r.total*CASE WHEN kind='professor' THEN .25 ELSE .10 END)::bigint fund,COALESCE(final_score,0)*round(r.total*CASE WHEN kind='professor' THEN .25 ELSE .10 END) exact_amount FROM normalized n CROSS JOIN revenue r),
rounded AS(SELECT a.*,floor(exact_amount)::bigint floor_amount,row_number() OVER(PARTITION BY kind ORDER BY exact_amount-floor(exact_amount) DESC,cid) remainder_rank FROM allocation a)
SELECT kind,owner,cid,heading,round(watched,2),produced,comp,aud,prod,COALESCE(final_score,0),floor_amount+CASE WHEN final_score>0 AND remainder_rank<=fund-sum(floor_amount) OVER(PARTITION BY kind) THEN 1 ELSE 0 END FROM rounded $function$;

-- E. Painel do professor com dados reais (sem dados de alunos; apenas agregados).
CREATE OR REPLACE FUNCTION public.teacher_dashboard(_month date DEFAULT (date_trunc('month', now()))::date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR public.current_profile_role() <> 'professor' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _month IS NULL OR date_trunc('month', _month)::date <> _month THEN RAISE EXCEPTION 'Mês inválido'; END IF;
  WITH mine AS (SELECT c.id, c.title, c.status FROM public.courses c WHERE c.instructor_id = uid AND c.institution_id IS NULL),
  lm AS (SELECT * FROM public.lesson_minutes(_month, (_month + interval '1 month')::date)),
  lm_all AS (SELECT * FROM public.lesson_minutes(DATE '2000-01-01', DATE '2100-01-01')),
  videos AS (SELECT l.id, l.title, m.title course_title, COALESCE(lm.minutes, 0) minutes, COALESCE(a.minutes, 0) total_minutes
    FROM public.lessons l JOIN mine m ON m.id = l.course_id LEFT JOIN lm ON lm.lesson_id = l.id LEFT JOIN lm_all a ON a.lesson_id = l.id),
  started AS (SELECT l.module_id, v.user_id, v.profile_role FROM public.lesson_views v JOIN public.lessons l ON l.id = v.lesson_id JOIN mine m ON m.id = l.course_id
    WHERE l.module_id IS NOT NULL AND v.seconds_watched >= 20 AND v.viewed_on >= _month AND v.viewed_on < _month + interval '1 month' GROUP BY l.module_id, v.user_id, v.profile_role),
  mods AS (SELECT cm.id, cm.title, cm.position, m.id course_id, m.title course_title, m.status,
      (SELECT count(*) FROM public.lessons l WHERE l.module_id = cm.id) lessons,
      (SELECT COALESCE(sum(v.minutes), 0) FROM videos v JOIN public.lessons l ON l.id = v.id WHERE l.module_id = cm.id) minutes,
      (SELECT count(*) FROM started s WHERE s.module_id = cm.id) n_started,
      (SELECT count(*) FROM started s WHERE s.module_id = cm.id AND EXISTS (SELECT 1 FROM public.assessment_attempts a WHERE a.module_id = cm.id AND a.user_id = s.user_id AND a.profile_role = s.profile_role AND a.passed AND a.created_at >= _month AND a.created_at < _month + interval '1 month')) n_ok
    FROM public.course_modules cm JOIN mine m ON m.id = cm.course_id),
  fund AS (SELECT COALESCE(sum(f.score), 0) score, COALESCE(sum(f.estimated_cents), 0) cents FROM public.calculate_author_fund(_month) f WHERE f.fund_type = 'professor' AND f.owner_id = uid),
  rev AS (SELECT round(greatest(COALESCE(sum(amount_cents), 0), 0) * .25)::bigint fund_cents FROM public.payments WHERE status = 'pago' AND paid_at >= _month AND paid_at < _month + interval '1 month')
  SELECT jsonb_build_object(
    'month', _month,
    'courses', (SELECT count(*) FROM mine),
    'watched_minutes', (SELECT COALESCE(sum(minutes), 0) FROM videos),
    'watched_minutes_total', (SELECT COALESCE(sum(total_minutes), 0) FROM videos),
    'top_videos', COALESCE((SELECT jsonb_agg(jsonb_build_object('lesson_id', id, 'title', title, 'course', course_title, 'minutes', minutes, 'total_minutes', total_minutes)) FROM (SELECT * FROM videos WHERE total_minutes > 0 OR minutes > 0 ORDER BY minutes DESC, total_minutes DESC, title LIMIT 10) t), '[]'),
    'modules', COALESCE((SELECT jsonb_agg(jsonb_build_object('module_id', id, 'title', title, 'course_id', course_id, 'course', course_title, 'status', status, 'lessons', lessons, 'minutes', minutes, 'started', n_started, 'approved', n_ok, 'completion_rate', CASE WHEN n_started > 0 THEN round(100.0 * n_ok / n_started, 1) END) ORDER BY course_title, position) FROM mods), '[]'),
    'completion_rate', (SELECT round(100 * avg(n_ok::numeric / n_started), 1) FROM mods WHERE n_started > 0),
    'score', (SELECT score FROM fund),
    'estimated_cents', (SELECT cents FROM fund),
    'fund_cents', (SELECT fund_cents FROM rev),
    'account', jsonb_build_object(
      'accrued_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM public.author_scores WHERE owner_id = uid AND fund_type = 'professor' AND payment_status <> 'pago'),
      'paid_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM public.author_scores WHERE owner_id = uid AND fund_type = 'professor' AND payment_status = 'pago'),
      'has_payout_account', EXISTS (SELECT 1 FROM public.payout_accounts WHERE owner_id = uid))
  ) INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.teacher_dashboard(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_dashboard(date) TO authenticated;

-- G. Supressão de grupos pequenos (k < 5). Em partições (grupos que somam o total) suprime também o menor grupo visível
-- quando apenas um grupo foi suprimido, para que o total não permita recalcular o valor oculto.
CREATE OR REPLACE FUNCTION public.ies_suppress(_rows jsonb, _partition boolean DEFAULT true, _k integer DEFAULT 5)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  WITH r AS (SELECT x.label, x.n, (x.n < _k) h FROM jsonb_to_recordset(_rows) AS x(label text, n integer)),
  c AS (SELECT count(*) FILTER (WHERE h) hc FROM r),
  m AS (SELECT label FROM r WHERE NOT h ORDER BY n, label LIMIT 1),
  f AS (SELECT r.label, r.n, (r.h OR (_partition AND c.hc = 1 AND r.label = (SELECT label FROM m))) hide FROM r CROSS JOIN c)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('label', label, 'n', CASE WHEN hide THEN NULL ELSE n END, 'suppressed', hide) ORDER BY label) FILTER (WHERE _partition OR NOT hide), '[]'::jsonb) FROM f
$$;

-- Escopo de relatórios: NULL = toda a instituição; array = apenas os escopos do subperfil. Sem permissão: erro.
CREATE OR REPLACE FUNCTION public.ies_report_scopes(_institution uuid) RETURNS uuid[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s uuid[];
BEGIN
  IF auth.uid() IS NULL OR _institution IS NULL OR public.current_profile_role()::text <> 'ies' THEN RAISE EXCEPTION 'Relatórios exigem acesso institucional'; END IF;
  IF public.organization_permission(_institution, 'ies', 'relatorios') THEN RETURN NULL; END IF;
  SELECT m.scope_ids INTO s FROM public.organization_memberships m WHERE m.organization_id = _institution AND m.organization_type = 'ies' AND m.user_id = auth.uid() AND m.status = 'ativo' AND 'relatorios' = ANY(m.permissions) AND cardinality(m.scope_ids) > 0;
  IF s IS NULL THEN RAISE EXCEPTION 'Relatórios exigem acesso institucional'; END IF;
  RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.ies_report_scopes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ies_report_scopes(uuid) TO service_role;

-- Relatório agregado da IES: empregabilidade, competências e perfil socioeconômico (apenas atributos não sensíveis:
-- nível de escolaridade, situação de trabalho e busca de emprego). Nunca devolve linhas individuais.
CREATE OR REPLACE FUNCTION public.ies_aggregate_report(_institution uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sc uuid[]; total integer; r jsonb;
BEGIN
  sc := public.ies_report_scopes(_institution);
  SELECT count(*) INTO total FROM public.learner_profiles lp WHERE lp.institution_id = _institution AND lp.profile_role = 'estudante' AND (sc IS NULL OR lp.scope_id = ANY(sc));
  IF total < 5 THEN
    RETURN jsonb_build_object('insufficient', true, 'min_group', 5, 'message', 'Dados insuficientes: grupos com menos de 5 estudantes não são exibidos.');
  END IF;
  WITH k AS MATERIALIZED (
    SELECT lp.user_id, lp.matching_enabled matching, COALESCE(lp.works, false) works, COALESCE(lp.seeks_job, false) seeks, COALESCE(NULLIF(lp.education_level, ''), 'Não informado') level,
      EXISTS (SELECT 1 FROM public.matches m WHERE m.user_id = lp.user_id AND m.profile_role = 'estudante' AND m.status = 'aceita') accepted
    FROM public.learner_profiles lp WHERE lp.institution_id = _institution AND lp.profile_role = 'estudante' AND (sc IS NULL OR lp.scope_id = ANY(sc)))
  SELECT jsonb_build_object(
    'insufficient', false, 'min_group', 5, 'students', total,
    'hours', (SELECT COALESCE(sum(c.hours), 0) FROM public.certificates c JOIN k ON k.user_id = c.user_id WHERE c.profile_role = 'estudante'),
    'completion', (SELECT COALESCE(round(100.0 * count(*) FILTER (WHERE e.progress >= 100) / NULLIF(count(*), 0)), 0) FROM public.enrollments e JOIN k ON k.user_id = e.user_id WHERE e.profile_role = 'estudante'),
    'employability', jsonb_build_object(
      'matching', public.ies_suppress((SELECT jsonb_agg(jsonb_build_object('label', l, 'n', n)) FROM (SELECT CASE WHEN matching THEN 'Matching ativado' ELSE 'Matching desativado' END l, count(*)::int n FROM k GROUP BY 1) t)),
      'seeking_job', public.ies_suppress((SELECT jsonb_agg(jsonb_build_object('label', l, 'n', n)) FROM (SELECT CASE WHEN seeks THEN 'Busca emprego' ELSE 'Não busca emprego' END l, count(*)::int n FROM k GROUP BY 1) t)),
      'accepted_candidacy', public.ies_suppress((SELECT jsonb_agg(jsonb_build_object('label', l, 'n', n)) FROM (SELECT CASE WHEN accepted THEN 'Com candidatura aceita' ELSE 'Sem candidatura aceita' END l, count(*)::int n FROM k GROUP BY 1) t))),
    'competencies', public.ies_suppress((SELECT COALESCE(jsonb_agg(jsonb_build_object('label', name, 'n', n)), '[]') FROM (SELECT s.name, count(DISTINCT uc.user_id)::int n FROM public.user_competencies uc JOIN k ON k.user_id = uc.user_id JOIN public.skills s ON s.id = uc.skill_id WHERE uc.profile_role = 'estudante' GROUP BY s.name ORDER BY n DESC, s.name LIMIT 30) t), false),
    'socioeconomic', jsonb_build_object(
      'working', public.ies_suppress((SELECT jsonb_agg(jsonb_build_object('label', l, 'n', n)) FROM (SELECT CASE WHEN works THEN 'Trabalha' ELSE 'Não trabalha' END l, count(*)::int n FROM k GROUP BY 1) t)),
      'education_level', public.ies_suppress((SELECT jsonb_agg(jsonb_build_object('label', level, 'n', n)) FROM (SELECT level, count(*)::int n FROM k GROUP BY 1) t))))
  INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.ies_aggregate_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ies_aggregate_report(uuid) TO authenticated;
