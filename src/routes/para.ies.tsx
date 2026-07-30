import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/ies")({
  head: () => ({
    meta: [
      { title: "Planos para IES — Upgrade Educação" },
      { name: "description", content: "Indicadores agregados, horas complementares automáticas e relatórios regulatórios para instituições de ensino." },
      { property: "og:title", content: "Planos para IES — Upgrade Educação" },
      { property: "og:description", content: "Indicadores agregados, horas complementares automáticas e relatórios regulatórios para instituições de ensino." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.ies} />,
});
