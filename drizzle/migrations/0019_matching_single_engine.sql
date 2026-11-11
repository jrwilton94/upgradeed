-- Bloco D: um único motor de matching, no servidor.

-- Gera sugestões (e notificações) apenas para candidatos compatíveis, sem duplicar as já existentes.
-- Compatível = ao menos uma competência obrigatória da vaga no perfil de competências; se a vaga não tem
-- competências obrigatórias, a área pretendida do usuário deve ser igual à área da vaga.
-- Perfil Colaborador só recebe vagas internas da própria empresa; matching externo é só Estudante/Geral com matching ligado.
CREATE OR REPLACE FUNCTION public.create_matches(_job uuid DEFAULT NULL, _user uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  WITH pairs AS (
    SELECT lp.user_id, lp.profile_role, j.id job_id, j.title, j.area, j.required_skills, j.desired_skills, mine.names,
           (SELECT COALESCE(array_agg(x), '{}') FROM unnest(j.required_skills) x WHERE lower(x) = ANY (SELECT lower(y) FROM unnest(mine.names) y)) req_hit,
           (SELECT COALESCE(array_agg(x), '{}') FROM unnest(j.desired_skills) x WHERE lower(x) = ANY (SELECT lower(y) FROM unnest(mine.names) y)) des_hit,
           (cardinality(j.required_skills) = 0 AND length(public.normalize_text(lp.target_area)) > 0 AND public.normalize_text(lp.target_area) = public.normalize_text(j.area)) area_hit
    FROM public.jobs j
    JOIN public.learner_profiles lp ON lp.matching_enabled
    JOIN public.profiles p ON p.id = lp.user_id AND p.role = lp.profile_role
    CROSS JOIN LATERAL (SELECT COALESCE(array_agg(DISTINCT s.name), '{}') names FROM public.user_competencies uc JOIN public.skills s ON s.id = uc.skill_id WHERE uc.user_id = lp.user_id AND uc.profile_role = lp.profile_role) mine
    WHERE j.status = 'aberta' AND (_job IS NULL OR j.id = _job) AND (_user IS NULL OR lp.user_id = _user)
      AND ((j.job_type = 'externa' AND lp.profile_role IN ('estudante', 'geral'))
        OR (j.job_type = 'interna' AND lp.profile_role = 'colaborador' AND EXISTS (SELECT 1 FROM public.company_employees e WHERE e.user_id = lp.user_id AND e.company_id = j.company_id AND e.ended_at IS NULL AND (j.scope_id IS NULL OR e.scope_id = j.scope_id))))
      AND NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.user_id = lp.user_id AND m.job_id = j.id)
  ), eligible AS (
    SELECT * FROM pairs WHERE cardinality(req_hit) > 0 OR area_hit
  ), ins AS (
    INSERT INTO public.matches(user_id, job_id, profile_role, score, matched_skills, reasons)
    SELECT e.user_id, e.job_id, e.profile_role,
      CASE WHEN cardinality(e.required_skills || e.desired_skills) = 0 THEN 35 ELSE least(99, round(99.0 * cardinality(e.req_hit || e.des_hit) / cardinality(e.required_skills || e.desired_skills))::integer) END,
      e.req_hit || e.des_hit,
      array_remove(ARRAY[
        CASE WHEN cardinality(e.req_hit) > 0 THEN 'Você tem competências exigidas pela vaga: ' || array_to_string(e.req_hit, ', ') END,
        CASE WHEN cardinality(e.des_hit) > 0 THEN 'Você também tem competências desejáveis: ' || array_to_string(e.des_hit, ', ') END,
        CASE WHEN e.area_hit THEN 'A vaga é da área que você pretende: ' || e.area END], NULL)
    FROM eligible e
    ON CONFLICT (user_id, job_id) DO NOTHING
    RETURNING user_id, job_id, profile_role
  ), notified AS (
    INSERT INTO public.notifications(user_id, profile_role, title, body)
    SELECT i.user_id, i.profile_role, 'Nova oportunidade sugerida', j.title || ' — confira os requisitos e decida se deseja se candidatar.' FROM ins i JOIN public.jobs j ON j.id = i.job_id
    RETURNING 1
  )
  SELECT count(*) INTO n FROM ins;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.create_matches(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_matches(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.generate_job_matches(_job uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE j public.jobs; n integer;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id = _job;
  IF NOT FOUND OR NOT public.organization_permission(j.company_id, 'empresa', CASE WHEN j.job_type = 'interna' THEN 'vagas_internas' ELSE 'vagas_externas' END, j.scope_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  n := public.create_matches(_job, NULL);
  INSERT INTO public.activity_logs(user_id, organization_id, organization_type, scope_id, action, entity, meta) VALUES (auth.uid(), j.company_id, 'empresa', j.scope_id, 'matching_gerado', 'jobs', jsonb_build_object('job_id', _job, 'count', n));
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.generate_job_matches(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_job_matches(uuid) TO authenticated;

-- Ao ligar o matching, o usuário passa a receber sugestões das vagas externas já abertas. Vale imediatamente.
CREATE OR REPLACE FUNCTION public.set_matching(_enabled boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r public.profile_role;
BEGIN
  r := public.current_profile_role();
  IF auth.uid() IS NULL OR r NOT IN ('estudante', 'geral') THEN RAISE EXCEPTION 'Matching externo indisponível neste perfil'; END IF;
  INSERT INTO public.employability_preferences(user_id, profile_role, matching_enabled) VALUES (auth.uid(), r, _enabled) ON CONFLICT (user_id, profile_role) DO UPDATE SET matching_enabled = _enabled;
  INSERT INTO public.learner_profiles(user_id, profile_role, matching_enabled) VALUES (auth.uid(), r, _enabled) ON CONFLICT (user_id, profile_role) DO UPDATE SET matching_enabled = _enabled;
  UPDATE public.profiles SET matching_enabled = _enabled WHERE id = auth.uid();
  IF _enabled THEN PERFORM public.create_matches(NULL, auth.uid()); END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_matching(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_matching(boolean) TO authenticated;

-- Matching desligado: sugestões pendentes deixam de aparecer (respond_match já impede aceitá-las).
CREATE POLICY matches_pending_requires_matching ON public.matches AS RESTRICTIVE FOR SELECT TO authenticated
USING (status <> 'sugerida' OR profile_role NOT IN ('estudante', 'geral')
  OR EXISTS (SELECT 1 FROM public.learner_profiles lp WHERE lp.user_id = matches.user_id AND lp.profile_role = matches.profile_role AND lp.matching_enabled));
