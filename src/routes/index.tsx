import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Building2, LineChart, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FlowDiagram } from "@/components/flow-diagram";
import { Button } from "@/components/ui/button";
import { PROFILES } from "@/lib/profiles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Upgrade Educação — Aprendizado que vira oportunidade" },
      {
        name: "description",
        content:
          "Hub de Skills Intelligence que conecta estudantes, profissionais, instituições de ensino e empresas por meio de competências verificadas.",
      },
      { property: "og:title", content: "Upgrade Educação — Aprendizado que vira oportunidade" },
      {
        property: "og:description",
        content:
          "Competências verificadas que viram oportunidades reais de carreira, com matching transparente e centrado no usuário.",
      },
    ],
  }),
  component: Index,
});

const STATS = [
  { value: "6", label: "perfis integrados" },
  { value: "100%", label: "das decisões com pessoas" },
  { value: "0", label: "dados sensíveis usados" },
  { value: "24h", label: "para o certificado sair" },
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
              Aprendizado que vira{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">oportunidade.</span>
            </h1>
            <p className="animate-rise mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Somos um Hub de Skills Intelligence que conecta estudantes, profissionais,
              instituições de ensino e empresas por meio de competências verificadas, transformando
              aprendizado em oportunidades reais de carreira, desenvolvimento profissional e
              inteligência para o mercado.
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
            <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl font-extrabold text-foreground">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            Seis perfis, um ecossistema
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cada perfil alimenta e se beneficia da mesma base viva de competências.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILES.map((profile) => (
              <article
                key={profile.role}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-foreground">
                  <profile.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                  {profile.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{profile.tagline}</p>
                <ul className="mt-4 space-y-1.5">
                  {profile.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-foreground/80">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                O fluxo da plataforma
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Em cinco dos seis momentos de consequência real, a decisão pertence a uma pessoa.
              </p>
            </div>
            <FlowDiagram />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                Uma base viva da educação brasileira
              </h2>
              <p className="mt-4 text-muted-foreground">
                Mapeamos a trajetória do estudante do Ensino Médio ao fim da graduação, eliminando o
                ponto cego da transição acadêmica. Isso gera inteligência que nenhuma instituição ou
                empresa possui isoladamente.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link to="/cursos">Ver catálogo de cursos</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/ia">Como funciona nossa IA</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: LineChart,
                  title: "Indicadores agregados",
                  text: "IES acompanham empregabilidade e evasão sem acessar dados individuais.",
                },
                {
                  icon: Building2,
                  title: "Talento pré-verificado",
                  text: "Empresas recebem apenas perfis que aceitaram compartilhar seus dados.",
                },
                {
                  icon: BadgeCheck,
                  title: "Certificados automáticos",
                  text: "Horas complementares reconhecidas ao concluir a avaliação final.",
                },
                {
                  icon: Sparkles,
                  title: "Trilhas internas",
                  text: "Colaboradores evoluem rumo ao cargo desejado com trilhas guiadas.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
                  <item.icon className="size-5 text-brand" />
                  <p className="mt-3 font-display font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
