import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/profissional")({
  head: () => ({ meta: [
    { title: "Para profissionais — Upgrade Educação" },
    { name: "description", content: "Plano profissional individual: cursos, certificados, trilhas e oportunidades compatíveis, sem vínculo institucional." },
    { property: "og:title", content: "Para profissionais — Upgrade Educação" },
    { property: "og:description", content: "Desenvolva competências e encontre oportunidades com autonomia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <ProfileLanding content={LANDING_CONTENT.geral} />,
});