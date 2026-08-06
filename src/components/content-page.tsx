import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export type ContentSection = { heading: string; body: string[] };

export function ContentPage({
  eyebrow,
  title,
  intro,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections?: ContentSection[];
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="bg-hero-glow">
          <div className="mx-auto w-full max-w-4xl px-5 py-16">
            <p className="text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-extrabold text-foreground sm:text-5xl">{title}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{intro}</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-4xl px-5 py-14">
          <div className="space-y-8">
            {(sections ?? []).map((section) => (
              <div key={section.heading} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl font-bold text-foreground">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
          {children}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}