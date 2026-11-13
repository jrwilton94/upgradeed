-- Relatório agregado da IES: totais (estudantes, horas, conclusão) sempre exibidos; a supressão de grupos com menos de 5
-- pessoas vale apenas para as quebras por grupo (empregabilidade, competências, socioeconômico). Aditiva (CREATE OR REPLACE).
CREATE OR REPLACE FUNCTION public.ies_aggregate_report(_institution uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE sc uuid[]; total integer; r jsonb;
BEGIN
  sc := public.ies_report_scopes(_institution);
  SELECT count(*) INTO total FROM public.learner_profiles lp WHERE lp.institution_id = _institution AND lp.profile_role = 'estudante' AND (sc IS NULL OR lp.scope_id = ANY(sc));
  WITH k AS MATERIALIZED (
    SELECT lp.user_id, lp.matching_enabled matching, COALESCE(lp.works, false) works, COALESCE(lp.seeks_job, false) seeks, COALESCE(NULLIF(lp.education_level, ''), 'Não informado') level,
      EXISTS (SELECT 1 FROM public.matches m WHERE m.user_id = lp.user_id AND m.profile_role = 'estudante' AND m.status = 'aceita') accepted
    FROM public.learner_profiles lp WHERE lp.institution_id = _institution AND lp.profile_role = 'estudante' AND (sc IS NULL OR lp.scope_id = ANY(sc)))
  SELECT jsonb_build_object(
    'insufficient', false, 'min_group', 5, 'small_cohort', total < 5, 'students', total,
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
