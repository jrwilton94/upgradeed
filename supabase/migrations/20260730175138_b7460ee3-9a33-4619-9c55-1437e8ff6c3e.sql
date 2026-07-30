-- ENUMS
CREATE TYPE public.profile_role AS ENUM ('estudante','geral','colaborador','professor','ies','empresa');
CREATE TYPE public.match_status AS ENUM ('sugerida','aceita','ignorada');
CREATE TYPE public.job_status AS ENUM ('aberta','encerrada');

-- COMPANIES
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  industry text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_own" ON public.companies FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- INSTITUTIONS
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text, state text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.institutions TO authenticated;
GRANT SELECT ON public.institutions TO anon;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions_read" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "institutions_insert_own" ON public.institutions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "institutions_update_own" ON public.institutions FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  role public.profile_role,
  plan text NOT NULL DEFAULT 'free',
  avatar_url text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  current_position text,
  target_position text,
  education_level text,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  matching_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES / SKILLS
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE, icon text NOT NULL DEFAULT 'BookOpen'
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories FOR SELECT USING (true);

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_read" ON public.skills FOR SELECT USING (true);

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  instructor_id uuid,
  instructor_name text NOT NULL DEFAULT 'Upgrade Educação',
  hours numeric NOT NULL DEFAULT 1,
  level text NOT NULL DEFAULT 'Iniciante',
  rating numeric NOT NULL DEFAULT 4.8,
  students_count integer NOT NULL DEFAULT 0,
  minutes_watched integer NOT NULL DEFAULT 0,
  completion_rate numeric NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_own" ON public.courses FOR INSERT TO authenticated WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "courses_update_own" ON public.courses FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration_min integer NOT NULL DEFAULT 10,
  position integer NOT NULL DEFAULT 1
);
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_read" ON public.lessons FOR SELECT USING (true);

CREATE TABLE public.course_skills (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, skill_id)
);
GRANT SELECT ON public.course_skills TO anon, authenticated;
GRANT ALL ON public.course_skills TO service_role;
ALTER TABLE public.course_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_skills_read" ON public.course_skills FOR SELECT USING (true);

-- ENROLLMENTS
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_own" ON public.enrollments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT upper(substr(md5(random()::text),1,12)),
  hours numeric NOT NULL DEFAULT 0,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates_own" ON public.certificates FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- BEHAVIORAL TESTS
CREATE TABLE public.behavioral_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_label text,
  taken_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.behavioral_tests TO authenticated;
GRANT ALL ON public.behavioral_tests TO service_role;
ALTER TABLE public.behavioral_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "behavioral_own" ON public.behavioral_tests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- PREFERENCES
CREATE TABLE public.employability_preferences (
  user_id uuid PRIMARY KEY,
  area text,
  city text,
  state text,
  work_model text,
  salary_range text,
  contract_type text,
  matching_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.employability_preferences TO authenticated;
GRANT ALL ON public.employability_preferences TO service_role;
ALTER TABLE public.employability_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_own" ON public.employability_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT 'Tecnologia',
  required_skills text[] NOT NULL DEFAULT '{}',
  desired_skills text[] NOT NULL DEFAULT '{}',
  modality text NOT NULL DEFAULT 'Remoto',
  city text, state text,
  contract_type text NOT NULL DEFAULT 'CLT',
  culture_fit text,
  seniority text NOT NULL DEFAULT 'Júnior',
  salary_range text,
  status public.job_status NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_company(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = _company_id AND c.owner_id = auth.uid());
$$;

CREATE POLICY "jobs_read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert_owner" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.owns_company(company_id));
CREATE POLICY "jobs_update_owner" ON public.jobs FOR UPDATE TO authenticated USING (public.owns_company(company_id));

-- MATCHES
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  reasons text[] NOT NULL DEFAULT '{}',
  matched_skills text[] NOT NULL DEFAULT '{}',
  status public.match_status NOT NULL DEFAULT 'sugerida',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_job(_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j JOIN public.companies c ON c.id = j.company_id
    WHERE j.id = _job_id AND c.owner_id = auth.uid()
  );
$$;

CREATE POLICY "matches_own" ON public.matches FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "matches_company_accepted" ON public.matches FOR SELECT TO authenticated USING (status = 'aceita' AND public.owns_job(job_id));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_own" ON public.activity_logs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SEED
INSERT INTO public.categories (name, slug, icon) VALUES
 ('Tecnologia','tecnologia','Code'),
 ('Gestão e Negócios','gestao','Briefcase'),
 ('Dados e IA','dados','BrainCircuit'),
 ('Comunicação','comunicacao','MessagesSquare'),
 ('Saúde','saude','HeartPulse'),
 ('Direito','direito','Scale');

INSERT INTO public.skills (name, slug) VALUES
 ('Lógica de Programação','logica-programacao'),
 ('JavaScript','javascript'),
 ('SQL','sql'),
 ('Análise de Dados','analise-de-dados'),
 ('Python','python'),
 ('Gestão de Projetos','gestao-projetos'),
 ('Liderança','lideranca'),
 ('Comunicação Assertiva','comunicacao-assertiva'),
 ('Excel Avançado','excel-avancado'),
 ('Marketing Digital','marketing-digital'),
 ('LGPD','lgpd'),
 ('Atendimento ao Cliente','atendimento-cliente');

INSERT INTO public.courses (title, slug, description, category_id, instructor_name, hours, level, rating, students_count, minutes_watched, completion_rate) VALUES
 ('Lógica de Programação do Zero','logica-de-programacao-do-zero','Construa o raciocínio lógico necessário para programar em qualquer linguagem, com exercícios práticos e avaliação final certificada.', (SELECT id FROM public.categories WHERE slug='tecnologia'), 'Prof. Rafael Andrade', 20, 'Iniciante', 4.9, 1840, 62400, 71),
 ('JavaScript Essencial','javascript-essencial','Domine a linguagem da web moderna: variáveis, funções, DOM e consumo de APIs.', (SELECT id FROM public.categories WHERE slug='tecnologia'), 'Prof. Rafael Andrade', 24, 'Intermediário', 4.8, 1220, 48800, 64),
 ('SQL para Análise de Dados','sql-para-analise-de-dados','Consultas, joins e agregações aplicadas a problemas reais de negócio.', (SELECT id FROM public.categories WHERE slug='dados'), 'Profa. Camila Torres', 16, 'Intermediário', 4.9, 980, 32100, 69),
 ('Introdução à Inteligência Artificial','introducao-a-inteligencia-artificial','Fundamentos de IA, aprendizado de máquina e uso responsável de algoritmos.', (SELECT id FROM public.categories WHERE slug='dados'), 'Profa. Camila Torres', 12, 'Iniciante', 4.7, 2110, 40200, 58),
 ('Gestão de Projetos Ágeis','gestao-de-projetos-ageis','Scrum, Kanban e métricas de entrega para times de alta performance.', (SELECT id FROM public.categories WHERE slug='gestao'), 'Prof. Marcos Lima', 18, 'Intermediário', 4.8, 1440, 36900, 73),
 ('Liderança e Gestão de Pessoas','lideranca-e-gestao-de-pessoas','Desenvolva competências de liderança, feedback e desenvolvimento de equipes.', (SELECT id FROM public.categories WHERE slug='gestao'), 'Profa. Aline Souza', 14, 'Intermediário', 4.9, 1310, 29800, 77),
 ('Comunicação Assertiva no Trabalho','comunicacao-assertiva-no-trabalho','Fale com clareza, negocie melhor e apresente ideias com segurança.', (SELECT id FROM public.categories WHERE slug='comunicacao'), 'Profa. Aline Souza', 10, 'Iniciante', 4.8, 1690, 25400, 81),
 ('Excel Avançado para Negócios','excel-avancado-para-negocios','Tabelas dinâmicas, funções avançadas e dashboards executivos.', (SELECT id FROM public.categories WHERE slug='gestao'), 'Prof. Marcos Lima', 16, 'Intermediário', 4.7, 2050, 44100, 66),
 ('Marketing Digital na Prática','marketing-digital-na-pratica','Funil, tráfego, conteúdo e métricas para gerar resultado real.', (SELECT id FROM public.categories WHERE slug='comunicacao'), 'Prof. Diego Martins', 15, 'Iniciante', 4.6, 1770, 31200, 62),
 ('LGPD e Proteção de Dados','lgpd-e-protecao-de-dados','Princípios da LGPD aplicados ao dia a dia das organizações.', (SELECT id FROM public.categories WHERE slug='direito'), 'Profa. Helena Prado', 12, 'Iniciante', 4.8, 860, 18900, 74),
 ('Python para Iniciantes','python-para-iniciantes','Primeiros passos com Python, automações e manipulação de dados.', (SELECT id FROM public.categories WHERE slug='tecnologia'), 'Profa. Camila Torres', 22, 'Iniciante', 4.9, 2380, 71000, 68),
 ('Experiência do Cliente e Atendimento','experiencia-do-cliente-e-atendimento','Jornada do cliente, escuta ativa e resolução de conflitos.', (SELECT id FROM public.categories WHERE slug='saude'), 'Profa. Helena Prado', 10, 'Iniciante', 4.7, 940, 16400, 79);

INSERT INTO public.lessons (course_id, title, duration_min, position)
SELECT c.id, 'Aula ' || g || ' — ' || c.title, 10, g
FROM public.courses c CROSS JOIN generate_series(1,6) g;

INSERT INTO public.course_skills (course_id, skill_id)
SELECT c.id, s.id FROM public.courses c JOIN public.skills s ON true
WHERE (c.slug='logica-de-programacao-do-zero' AND s.slug IN ('logica-programacao','python'))
   OR (c.slug='javascript-essencial' AND s.slug IN ('javascript','logica-programacao'))
   OR (c.slug='sql-para-analise-de-dados' AND s.slug IN ('sql','analise-de-dados'))
   OR (c.slug='introducao-a-inteligencia-artificial' AND s.slug IN ('analise-de-dados','python'))
   OR (c.slug='gestao-de-projetos-ageis' AND s.slug IN ('gestao-projetos','lideranca'))
   OR (c.slug='lideranca-e-gestao-de-pessoas' AND s.slug IN ('lideranca','comunicacao-assertiva'))
   OR (c.slug='comunicacao-assertiva-no-trabalho' AND s.slug IN ('comunicacao-assertiva'))
   OR (c.slug='excel-avancado-para-negocios' AND s.slug IN ('excel-avancado','analise-de-dados'))
   OR (c.slug='marketing-digital-na-pratica' AND s.slug IN ('marketing-digital','comunicacao-assertiva'))
   OR (c.slug='lgpd-e-protecao-de-dados' AND s.slug IN ('lgpd'))
   OR (c.slug='python-para-iniciantes' AND s.slug IN ('python','logica-programacao'))
   OR (c.slug='experiencia-do-cliente-e-atendimento' AND s.slug IN ('atendimento-cliente','comunicacao-assertiva'));

INSERT INTO public.companies (name, code, industry) VALUES
 ('Nexa Tecnologia','NEXA2025','Tecnologia'),
 ('Orion Serviços Financeiros','ORION2025','Financeiro'),
 ('Verde Saúde','VERDE2025','Saúde');

INSERT INTO public.jobs (company_id, title, description, area, required_skills, desired_skills, modality, city, state, contract_type, culture_fit, seniority, salary_range) VALUES
 ((SELECT id FROM public.companies WHERE code='NEXA2025'),'Desenvolvedor(a) Front-end Júnior','Atuação em interfaces web com foco em qualidade e acessibilidade.','Tecnologia',ARRAY['JavaScript','Lógica de Programação'],ARRAY['Python'],'Remoto','São Paulo','SP','CLT','Colaboração e aprendizado contínuo','Júnior','R$ 3.000 - R$ 5.000'),
 ((SELECT id FROM public.companies WHERE code='NEXA2025'),'Analista de Dados Júnior','Construção de relatórios e dashboards para áreas de negócio.','Dados',ARRAY['SQL','Análise de Dados'],ARRAY['Excel Avançado','Python'],'Híbrido','Campinas','SP','CLT','Curiosidade analítica','Júnior','R$ 4.000 - R$ 6.000'),
 ((SELECT id FROM public.companies WHERE code='ORION2025'),'Estágio em Marketing Digital','Apoio em campanhas, conteúdo e análise de métricas.','Marketing',ARRAY['Marketing Digital'],ARRAY['Comunicação Assertiva'],'Presencial','Belo Horizonte','MG','Estágio','Criatividade e autonomia','Júnior','R$ 1.800'),
 ((SELECT id FROM public.companies WHERE code='ORION2025'),'Analista de Compliance Pleno','Adequação de processos internos à LGPD e políticas internas.','Direito',ARRAY['LGPD'],ARRAY['Comunicação Assertiva'],'Híbrido','São Paulo','SP','CLT','Ética e rigor','Pleno','R$ 7.000 - R$ 9.000'),
 ((SELECT id FROM public.companies WHERE code='VERDE2025'),'Coordenador(a) de Experiência do Cliente','Liderança de time de atendimento e melhoria da jornada do cliente.','Atendimento',ARRAY['Atendimento ao Cliente','Liderança'],ARRAY['Comunicação Assertiva'],'Presencial','Curitiba','PR','CLT','Empatia e cuidado','Pleno','R$ 6.500'),
 ((SELECT id FROM public.companies WHERE code='VERDE2025'),'Gerente de Projetos','Gestão de portfólio de projetos com metodologias ágeis.','Gestão',ARRAY['Gestão de Projetos','Liderança'],ARRAY['Excel Avançado'],'Remoto','Curitiba','PR','PJ','Autonomia com responsabilidade','Sênior','R$ 12.000');