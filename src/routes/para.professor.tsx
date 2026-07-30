import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/professor")({
  head: () => ({
    meta: [
      { title: "Seja professor parceiro — Upgrade Educação" },
      { name: "description", content: "Publique cursos sem mensalidade, acompanhe audiência e receba repasse por minutos assistidos e conclusões." },
      { property: "og:title", content: "Seja professor parceiro — Upgrade Educação" },
      { property: "og:description", content: "Publique cursos sem mensalidade, acompanhe audiência e receba repasse por minutos assistidos e conclusões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.professor} />,
});
