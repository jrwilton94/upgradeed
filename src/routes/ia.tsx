import { createFileRoute } from "@tanstack/react-router";
import { Check, ShieldOff, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "Como funciona nossa IA — Upgrade Educação" },
      {
        name: "description",
        content:
          "Transparência algorítmica: a IA da Upgrade apenas sugere vagas, não decide, não elimina candidatos e não usa dados sensíveis.",
      },
      { property: "og:title", content: "Como funciona nossa IA — Upgrade Educação" },
      {
        property: "og:description",
        content: "Sugestão informacional, agência humana e conformidade com LGPD e PL 2338/2023.",
      },
    ],
  }),
  component: IaPage,
});

const USES = [
  "Cursos concluídos na plataforma",
  "Competências desenvolvidas e verificadas",
  "Preferências declaradas por você",
  "Objetivos de carreira informados",
  "Certificados emitidos",
  "Teste comportamental (quando realizado voluntariamente)",
];

const NEVER = [
  "Raça",
  "Sexo ou gênero",
  "Idade",
  "Religião",
  "Dados de saúde",
  "Quaisquer dados sensíveis (Art. 5º, II da LGPD)",
];

function IaPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="bg-hero-glow">
          <div className="mx-auto w-full max-w-4xl px-5 py-20">
            <p className="text-sm font-semibold tracking-wide text-brand uppercase">
              Transparência algorítmica
            </p>
            <h1 className="mt-3 text-4xl font-extrabold text-foreground sm:text-5xl">
              Como funciona nossa IA
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              O motor de matching da Upgrade Educação é uma ferramenta assistiva de sugestão
              informacional. Não é um sistema de triagem nem de decisão automatizada de
              recrutamento.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 py-16">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand/50 bg-brand-soft p-6">
              <ShieldCheck className="size-5 text-brand-foreground" />
              <h2 className="mt-3 font-display text-xl font-bold text-foreground">A IA faz</h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>Compara o seu perfil com os requisitos de vagas publicadas</li>
                <li>Gera um índice de compatibilidade</li>
                <li>Notifica você quando há correspondência relevante</li>
                <li>Explica por que cada vaga foi sugerida</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <ShieldOff className="size-5 text-destructive" />
              <h2 className="mt-3 font-display text-xl font-bold text-foreground">A IA não faz</h2>
              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                <li>Não toma decisões de contratação</li>
                <li>Não elimina candidatos automaticamente</li>
                <li>Não rankeia candidatos publicamente</li>
                <li>Não envia seu currículo sem a sua aceitação</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                As recomendações são baseadas em
              </h2>
              <ul className="mt-4 space-y-2">
                {USES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Dados que nunca utilizamos
              </h2>
              <ul className="mt-4 space-y-2">
                {NEVER.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                    <ShieldOff className="mt-0.5 size-4 shrink-0 text-destructive" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-secondary/50 p-6">
            <h2 className="font-display text-xl font-bold text-foreground">Sua agência</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Você escolhe o que estudar, declara suas preferências de vaga e pode ativar ou
              desativar o matching a qualquer momento. Ao desativar, seu perfil de empregabilidade é
              congelado e deixa de ser considerado em novas sugestões. Nenhum dado pessoal é enviado
              a uma empresa antes da sua aceitação explícita.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}