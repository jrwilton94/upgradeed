import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { PROFILES } from "@/lib/profiles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Upgrade Educação — Transformamos competências em oportunidades" },
      {
        name: "description",
        content:
          "Educação complementar no Brasil, competências adquiridas e oportunidades de trabalho compatíveis com cada trajetória.",
      },
      {
        property: "og:title",
        content: "Upgrade Educação — Transformamos competências em oportunidades",
      },
      {
        property: "og:description",
        content:
          "Competências verificadas que viram oportunidades reais, com matching transparente e decisões sempre humanas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ECOSYSTEM = [
  {
    icon: TrendingDown,
    title: "Redução de turnover",
    text: "Desenvolva colaboradores por competências e fortaleça a retenção de talentos.",
  },
  {
    icon: Zap,
    title: "Conexões Inteligentes",
    text: "Desenvolva competências e receba oportunidades alinhadas ao seu perfil.",
  },
  {
    icon: Layers,
    title: "Ecossistema Integrado",
    text: "Quem aprende, quem ensina e quem contrata em uma única plataforma.",
  },
  {
    icon: ShieldCheck,
    title: "IA Responsável",
    text: "Tecnologia transparente com decisões finais sempre humanas.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-hero-glow">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:py-28">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft px-4 py-1.5 text-xs font-semibold text-brand-foreground">
              <Sparkles className="size-3.5" />
              Hub de Skills Intelligence
            </div>
            <h1 className="animate-rise mt-6 max-w-4xl text-4xl leading-[1.05] font-extrabold text-foreground sm:text-6xl lg:text-7xl">
              Transformamos competências em{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">oportunidades.</span>
            </h1>
            <p className="animate-rise mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Ampliamos o acesso à educação complementar no Brasil, conectando aprendizagem,
              competências e oportunidades de trabalho.
            </p>
            <div className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Começar Agora <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                <Link to="/plataforma">Conheça a Plataforma</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="text-3xl font-extrabold text-foreground">Nossa missão</h2>
            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-muted-foreground">
              Transformar e ampliar o acesso à educação complementar no Brasil, monitorando a
              trajetória dos usuários, as competências adquiridas e a propensão a uma melhor
              aderência às vagas oferecidas pelo mercado.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Qual perfil mais se encaixa com você?
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Conecte-se às oportunidades certas.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILES.map((profile) => (
              <article
                key={profile.role}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-foreground">
                  <profile.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                  {profile.label}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{profile.summary}</p>
                <Button asChild variant="outline" className="mt-5 self-start">
                  <Link to={profile.path}>
                    Saiba mais <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                Mais do que uma plataforma. Um ecossistema de oportunidades.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada competência desenvolvida fortalece uma base viva de inteligência que conecta
                estudantes, especialistas, instituições de ensino e empresas.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ECOSYSTEM.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <item.icon className="size-5 text-brand" />
                  <p className="mt-3 font-display font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
          <h2 className="text-3xl font-extrabold text-foreground">Pronto para começar?</h2>
          <p className="mt-3 text-muted-foreground">
            Crie sua conta, escolha seu perfil e comece a construir competências verificadas hoje.
          </p>
          <Button asChild size="lg" className="mt-7 h-12 px-7">
            <Link to="/auth" search={{ mode: "signup" }}>
              Criar minha conta <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}