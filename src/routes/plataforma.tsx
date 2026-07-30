import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
          "Entenda como o Hub de Skills Intelligence da Upgrade transforma cursos, certificados e testes em um perfil de competências verificadas.",
      },
      { property: "og:title", content: "A plataforma — Upgrade Educação" },
      {
        property: "og:description",
        content: "Competências verificadas alimentando um motor de empregabilidade responsável.",
      },
    ],
  }),
  component: PlataformaPage,
});

const PILLARS = [
  {
    title: "Educação",
    text: "Cursos rápidos com avaliação final, certificado automático e horas complementares reconhecidas.",
  },
  {
    title: "Competências",
    text: "Cada aula assistida, quiz respondido e certificado emitido alimenta o perfil de competências.",
  },
  {
    title: "Empregabilidade",
    text: "O motor de matching sugere vagas compatíveis apenas quando o usuário ativa o recebimento.",
  },
  {
    title: "Inteligência",
    text: "IES e empresas acompanham indicadores agregados, sem acesso a dados individuais.",
  },
];

function PlataformaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="bg-hero-glow">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <h1 className="max-w-3xl text-4xl font-extrabold text-foreground sm:text-5xl">
              Não é só uma plataforma de cursos. É um Hub de Skills Intelligence.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Nossa missão é conectar educação, empregabilidade e empresas através das competências
              desenvolvidas pelos usuários durante sua trajetória acadêmica. A plataforma nunca toma
              decisões de contratação — ela apenas conecta talentos e oportunidades.
            </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="rounded-2xl border border-border bg-card p-6">
                  <p className="font-display text-lg font-bold text-foreground">{pillar.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-extrabold text-foreground">Perfis e permissões</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70 text-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Perfil</th>
                  <th className="px-5 py-3 font-semibold">O que faz</th>
                </tr>
              </thead>
              <tbody>
                {PROFILES.map((profile) => (
                  <tr key={profile.role} className="border-t border-border">
                    <td className="px-5 py-4 align-top">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <profile.icon className="size-4 text-brand" />
                        {profile.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {profile.bullets.join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <h2 className="mb-10 text-center text-3xl font-extrabold text-foreground">
              Do aprendizado à contratação
            </h2>
            <FlowDiagram />
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