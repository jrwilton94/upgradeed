import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/usuario-geral")({
  head: () => ({
    meta: [
      { title: "Para profissionais — Upgrade Educação" },
      { name: "description", content: "Continue evoluindo profissionalmente: cursos no seu ritmo, competências reconhecidas e oportunidades compatíveis." },
      { property: "og:title", content: "Para profissionais — Upgrade Educação" },
      { property: "og:description", content: "Continue evoluindo profissionalmente: cursos no seu ritmo, competências reconhecidas e oportunidades compatíveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.geral} />,
});
