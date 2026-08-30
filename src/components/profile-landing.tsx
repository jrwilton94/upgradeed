import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePlans } from "@/hooks/use-plans";
import { formatBRL, type LandingContent, type LandingPricing } from "@/lib/plan-content";
import { profileByRole } from "@/lib/profiles";

function LeadForm({ variant }: { variant: "indicate" | "quote" }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl border border-brand/50 bg-brand-soft p-8">
        <Check className="size-6 text-brand-foreground" />
        <p className="mt-3 font-display text-xl font-bold text-foreground">Recebemos seu contato</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nosso time entra em contato em breve pelo e-mail informado.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="lead-name">Seu nome</Label>
        <Input id="lead-name" name="name" required placeholder="Nome completo" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lead-email">E-mail</Label>
        <Input id="lead-email" name="email" type="email" required placeholder="voce@email.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lead-company">Empresa</Label>
        <Input id="lead-company" name="company" required placeholder="Nome da empresa" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lead-contact">
          {variant === "indicate" ? "Contato do RH (opcional)" : "Telefone"}
        </Label>
        <Input
          id="lead-contact"
          name="contact"
          placeholder={variant === "indicate" ? "e-mail ou telefone do RH" : "(00) 00000-0000"}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="lead-message">
          {variant === "indicate" ? "Por que a Upgrade faria sentido aí?" : "Conte sobre sua necessidade"}
        </Label>
        <Textarea
          id="lead-message"
          name="message"
          rows={4}
          placeholder={
            variant === "indicate"
              ? "Área, número aproximado de colaboradores, desafios de desenvolvimento…"
              : "Número de colaboradores, objetivos de contratação e desenvolvimento…"
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg">
          {variant === "indicate" ? "Indicar minha empresa" : "Pedir orçamento"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

function PricingSection({ pricing, role }: { pricing: LandingPricing; role: LandingContent["role"] }) {
  const { data: plans, isLoading } = usePlans(role);

  return (
    <section id="planos" className="border-y border-border bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        {pricing.kind === "form" ? (
          <>
            <h2 className="font-display text-3xl font-extrabold text-foreground">{pricing.title}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{pricing.description}</p>
            <div className="mt-8 max-w-3xl">
              <LeadForm variant={pricing.variant} />
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl font-extrabold text-foreground">Planos e valores</h2>
            {pricing.kind === "fixed" ? (
              <div className="mt-8 max-w-md rounded-2xl border border-brand bg-card p-8 shadow-lift ring-1 ring-brand/30">
                <h3 className="font-display text-xl font-bold text-foreground">{pricing.name}</h3>
                <p className="mt-4 font-display text-5xl font-extrabold text-brand">
                  {pricing.price}
                  <span className="text-base font-semibold text-muted-foreground">
                    {pricing.period}
                  </span>
                </p>
                {pricing.note && (
                  <p className="mt-4 text-sm text-muted-foreground">{pricing.note}</p>
                )}
                <Button asChild size="lg" className="mt-6 w-full">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Assinar agora <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Preços em reais, sem taxa de implantação. Cobrança mensal ou anual com 2 meses de
                  desconto.
                </p>
                {isLoading && <p className="mt-8 text-muted-foreground">Carregando planos…</p>}
                <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {(plans ?? []).map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex flex-col rounded-2xl border bg-card p-6 shadow-soft ${
                        plan.highlight ? "border-brand ring-1 ring-brand/30" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                        {plan.highlight && <Badge>Recomendado</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                      <div className="mt-5">
                        <p className="font-display text-3xl font-extrabold text-foreground">
                          {plan.price_month_cents === 0 ? "Sem custo" : formatBRL(plan.price_month_cents)}
                          {plan.price_month_cents > 0 && (
                            <span className="text-sm font-medium text-muted-foreground"> /mês</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.unit}
                          {plan.price_year_cents > 0 && ` · ${formatBRL(plan.price_year_cents)} no anual`}
                        </p>
                      </div>
                      <ul className="mt-5 flex-1 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="mt-6" variant={plan.highlight ? "default" : "outline"}>
                        <Link to="/auth" search={{ mode: "signup" }}>
                          {plan.price_month_cents === 0 ? "Ativar acesso" : "Contratar"}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function ProfileLanding({ content }: { content: LandingContent }) {
  const definition = profileByRole(content.role);
  const Icon = definition?.icon;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-brand-soft/40">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              {Icon && <Icon className="size-4" />}
              {content.eyebrow}
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{content.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {content.ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {content.secondaryCtaLabel ? (
                <Button asChild size="lg" variant="outline">
                  <a href="#planos">{content.secondaryCtaLabel}</a>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link to="/plataforma">Conhecer a plataforma</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-14">
          <div
            className={`grid gap-5 sm:grid-cols-2 ${
              content.highlights.length === 4 ? "lg:grid-cols-4" : "md:grid-cols-3"
            }`}
          >
            {content.highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-display text-lg font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <PricingSection pricing={content.pricing} role={content.role} />

        {content.steps && content.steps.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="font-display text-3xl font-extrabold text-foreground">Como contratar</h2>
            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {content.steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-soft font-display font-bold text-brand">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto w-full max-w-4xl px-5 py-16">
            <h2 className="font-display text-3xl font-extrabold text-foreground">Perguntas frequentes</h2>
            <div className="mt-6 space-y-4">
              {content.faq.map((item) => (
                <div key={item.q} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-semibold text-foreground">{item.q}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
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
