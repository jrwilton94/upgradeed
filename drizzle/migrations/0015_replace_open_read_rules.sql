DROP POLICY IF EXISTS courses_read ON public.courses;
CREATE POLICY courses_read ON public.courses FOR SELECT USING (published AND status = 'publicado');

DROP POLICY IF EXISTS lessons_read ON public.lessons;
CREATE POLICY lessons_read ON public.lessons FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id));

DROP POLICY IF EXISTS course_skills_read ON public.course_skills;
CREATE POLICY course_skills_read ON public.course_skills FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_skills.course_id));

DROP POLICY IF EXISTS categories_read ON public.categories;
CREATE POLICY categories_read ON public.categories FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.category_id = categories.id) OR public.is_admin());

DROP POLICY IF EXISTS skills_read ON public.skills;
CREATE POLICY skills_read ON public.skills FOR SELECT USING (EXISTS (SELECT 1 FROM public.course_skills cs WHERE cs.skill_id = skills.id) OR public.is_admin());

DROP POLICY IF EXISTS jobs_read ON public.jobs;
CREATE POLICY jobs_read ON public.jobs FOR SELECT USING (
  status = 'aberta'
  OR public.organization_permission(company_id, 'empresa', CASE WHEN job_type = 'interna' THEN 'vagas_internas' ELSE 'vagas_externas' END, scope_id)
  OR public.is_admin());

DROP POLICY IF EXISTS companies_read ON public.companies;
CREATE POLICY companies_read ON public.companies FOR SELECT USING (
  owner_id = auth.uid()
  OR public.organization_member(id, 'empresa')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = companies.id)
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.company_id = companies.id));

DROP POLICY IF EXISTS institutions_read ON public.institutions;
CREATE POLICY institutions_read ON public.institutions FOR SELECT USING (
  owner_id = auth.uid()
  OR public.organization_member(id, 'ies')
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.institution_id = institutions.id)
  OR EXISTS (SELECT 1 FROM public.courses c WHERE c.institution_id = institutions.id));

DROP POLICY IF EXISTS fund_settings_read ON public.fund_settings;
CREATE POLICY fund_settings_read ON public.fund_settings FOR SELECT TO authenticated USING (public.is_admin());