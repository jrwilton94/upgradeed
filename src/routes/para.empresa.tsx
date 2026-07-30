import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/empresa")({
  head: () => ({
    meta: [
      { title: "Planos para empresas — Upgrade Educação" },
      { name: "description", content: "Publique vagas, receba candidatos com competências verificadas e desenvolva colaboradores na mesma plataforma." },
      { property: "og:title", content: "Planos para empresas — Upgrade Educação" },
      { property: "og:description", content: "Publique vagas, receba candidatos com competências verificadas e desenvolva colaboradores na mesma plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.empresa} />,
});
