CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','staff'));
$$;

CREATE POLICY user_roles_admin_all ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  audience public.profile_role NOT NULL,
  description text NOT NULL DEFAULT '',
  price_month_cents integer NOT NULL DEFAULT 0,
  price_year_cents integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'por usuário',
  features text[] NOT NULL DEFAULT '{}',
  highlight boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_read ON public.plans FOR SELECT USING (active OR public.is_admin());
CREATE POLICY plans_admin_write ON public.plans FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id),
  company_id uuid REFERENCES public.companies(id),
  institution_id uuid REFERENCES public.institutions(id),
  status text NOT NULL DEFAULT 'trial',
  cycle text NOT NULL DEFAULT 'mensal',
  seats integer NOT NULL DEFAULT 1,
  amount_cents integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_own ON public.subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY subscriptions_admin ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  method text NOT NULL DEFAULT 'pix',
  reference text,
  description text NOT NULL DEFAULT '',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_own_read ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY payments_admin ON public.payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY companies_admin_all ON public.companies FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY institutions_admin_all ON public.institutions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY courses_admin_all ON public.courses FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plans (code, name, audience, description, price_month_cents, price_year_cents, unit, features, highlight, position) VALUES
('estudante_incluso','Incluso pela instituição','estudante','Acesso liberado para alunos de instituições parceiras.',0,0,'por aluno','{"Trilhas e cursos completos","Certificados com carga horária","Teste comportamental","Sugestões de vagas opcionais"}',true,1),
('estudante_plus','Estudante Plus','estudante','Para quem quer acelerar a empregabilidade por conta própria.',2990,29900,'por aluno','{"Tudo do plano incluso","Mentoria de carreira mensal","Prioridade em novas trilhas"}',false,2),
('geral_mensal','Upgrade Pessoal','geral','Plano individual para quem não tem vínculo institucional.',4990,49900,'por usuário','{"Catálogo completo de cursos","Certificados verificados","Matching de vagas","Teste comportamental"}',true,1),
('colaborador_incluso','Incluso pela empresa','colaborador','Licença paga pela empresa empregadora.',0,0,'por colaborador','{"Plano de desenvolvimento individual","Trilhas de mobilidade interna","Certificados internos","Sem matching externo"}',true,1),
('professor_free','Professor Parceiro','professor','Publique cursos e receba por audiência.',0,0,'sem mensalidade','{"Publicação ilimitada de cursos","Painel de audiência e score","Repasse de 60% da receita gerada","Suporte pedagógico"}',true,1),
('ies_essencial','IES Essencial','ies','Para instituições que querem empregabilidade mensurável.',149000,1490000,'por instituição','{"Até 1.000 alunos ativos","Indicadores agregados","Relatórios para MEC","Horas complementares automáticas"}',false,1),
('ies_avancado','IES Avançado','ies','Escala institucional com integração e suporte dedicado.',349000,3490000,'por instituição','{"Alunos ilimitados","Integração com o acadêmico","Gestor de sucesso dedicado","Relatórios personalizados"}',true,2),
('empresa_starter','Empresa Starter','empresa','Para times que estão começando a estruturar talentos.',99000,990000,'até 50 colaboradores','{"Publicação de vagas ilimitada","Matching por competências verificadas","Trilhas para colaboradores","Indicadores de desenvolvimento"}',false,1),
('empresa_scale','Empresa Scale','empresa','Para operações com alto volume de contratação.',249000,2490000,'até 250 colaboradores','{"Tudo do Starter","Gestão de múltiplas unidades","Relatórios de skills gap","Suporte prioritário"}',true,2);