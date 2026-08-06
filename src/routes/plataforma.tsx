import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Handshake,
  Lightbulb,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { PROFILES } from "@/lib/profiles";

export const Route = createFileRoute("/plataforma")({
  head: () => ({
    meta: [
      { title: "A plataforma — Upgrade Educação" },
      {
        name: "description",
        content:
          "Conectando competências e oportunidades: entenda o ecossistema de Skills Intelligence da Upgrade e como nossa IA funciona.",
      },
      { property: "og:title", content: "A plataforma — Upgrade Educação" },
      {
        property: "og:description",
        content: "Competências verificadas, conexões inteligentes e IA responsável.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlataformaPage,
});

const PILLARS = [
  {
    icon: Brain,
    title: "Competências Verificadas",
    text: "Uma base confiável para acompanhar a evolução de pessoas e organizações.",
  },
  {
    icon: Handshake,
    title: "Conexões Inteligentes",
    text: "Aproximamos talentos, especialistas, instituições de ensino e empresas.",
  },
  {
    icon: Lightbulb,
    title: "Desenvolvimento Contínuo",
    text: "Cada interação fortalece competências e amplia novas possibilidades.",
  },
  {
    icon: BarChart3,
    title: "Decisões Estratégicas",
    text: "Transformamos dados em inteligência para apoiar pessoas, empresas e instituições.",
  },
];

const ECOSYSTEM_ROLES: Record<string, string> = {
  estudante: "Construa competências e conquiste oportunidades.",
  geral: "Aprenda continuamente e evolua profissionalmente.",
  colaborador: "Desenvolva seu potencial e cresça na empresa.",
  professor: "Compartilhe conhecimento e transforme carreiras.",
  ies: "Transforme formação em inteligência.",
  empresa: "Contrate melhor. Desenvolva pessoas. Reduza o turnover.",
};

const AI_USES = [
  "Cursos concluídos na plataforma",
  "Competências desenvolvidas e verificadas",
  "Preferências declaradas por você",
  "Objetivos de carreira informados",
  "Certificados emitidos",
  "Teste comportamental (quando realizado voluntariamente)",
];

const AI_NEVER = [
  "Raça",
  "Sexo ou gênero",
  "Idade",
  "Religião",
  "Dados de saúde",
  "Quaisquer dados sensíveis (Art. 5º, II da LGPD)",
];

function PlataformaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="bg-hero-glow">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <h1 className="max-w-3xl text-4xl font-extrabold text-foreground sm:text-5xl">
              Conectando competências e oportunidades.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              A Upgrade é um ecossistema de Skills Intelligence onde competências se transformam em
              inteligência compartilhada. Cada interação fortalece uma base viva de inteligência que
              impulsiona o desenvolvimento de pessoas, instituições e organizações.
            </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="rounded-2xl border border-border bg-card p-6">
                  <pillar.icon className="size-5 text-brand" />
                  <p className="mt-3 font-display text-lg font-bold text-foreground">
                    {pillar.title}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-extrabold text-foreground">Seis perfis. Um único ecossistema.</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Cada perfil contribui de uma forma diferente, mas todos compartilham a mesma base de
            competências verificadas. É essa inteligência compartilhada que transforma aprendizado em
            desenvolvimento, conexões e oportunidades.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70 text-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Perfil</th>
                  <th className="px-5 py-3 font-semibold">Como participa do ecossistema</th>
                </tr>
              </thead>
              <tbody>
                {PROFILES.map((profile) => (
                  <tr key={profile.role} className="border-t border-border">
                    <td className="px-5 py-4 align-top">
                      <Link
                        to={profile.path}
                        className="flex items-center gap-2 font-semibold text-foreground hover:text-brand"
                      >
                        <profile.icon className="size-4 text-brand" />
                        {profile.label}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {ECOSYSTEM_ROLES[profile.role]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="ia" className="border-y border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-5xl px-5 py-20">
            <p className="text-sm font-semibold tracking-wide text-brand uppercase">
              Transparência algorítmica
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-foreground">
              Como funciona nossa IA
            </h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              O motor de matching da Upgrade Educação é uma ferramenta assistiva de sugestão
              informacional. Não é um sistema de triagem nem de decisão automatizada de
              recrutamento.
            </p>

            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-brand/50 bg-brand-soft p-6">
                <ShieldCheck className="size-5 text-brand-foreground" />
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">A IA faz</h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  <li>Compara o seu perfil com os requisitos de vagas publicadas</li>
                  <li>Gera um índice de compatibilidade</li>
                  <li>Notifica você quando há correspondência relevante</li>
                  <li>Explica por que cada vaga foi sugerida</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <ShieldOff className="size-5 text-destructive" />
                <h3 className="mt-3 font-display text-xl font-bold text-foreground">
                  A IA não faz
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  <li>Não toma decisões de contratação</li>
                  <li>Não elimina candidatos automaticamente</li>
                  <li>Não rankeia candidatos publicamente</li>
                  <li>Não envia seu currículo sem a sua aceitação</li>
                </ul>
              </div>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  As recomendações são baseadas em
                </h3>
                <ul className="mt-4 space-y-2">
                  {AI_USES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Dados que nunca utilizamos
                </h3>
                <ul className="mt-4 space-y-2">
                  {AI_NEVER.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                      <ShieldOff className="mt-0.5 size-4 shrink-0 text-destructive" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-bold text-foreground">Sua agência</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Você escolhe o que estudar, declara suas preferências de vaga e pode ativar ou
                desativar o matching a qualquer momento. Nenhum dado pessoal é enviado a uma empresa
                antes da sua aceitação explícita.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-foreground">
            Do aprendizado à contratação
          </h2>
          <FlowDiagram />
        </section>

        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
            <h2 className="text-3xl font-extrabold text-foreground">Pronto para começar?</h2>
            <p className="mt-3 text-muted-foreground">
              Crie sua conta, escolha seu perfil e comece a construir competências verificadas hoje.
            </p>
            <Button asChild size="lg" className="mt-7 h-12 px-7">
              <Link to="/auth" search={{ mode: "signup" }}>
                Criar minha conta <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}