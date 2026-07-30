import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/usuario-geral")({
  head: () => ({
    meta: [
      { title: "Plano individual — Upgrade Educação" },
      { name: "description", content: "Assinatura individual com catálogo completo, certificados verificados e matching de vagas por competências." },
      { property: "og:title", content: "Plano individual — Upgrade Educação" },
      { property: "og:description", content: "Assinatura individual com catálogo completo, certificados verificados e matching de vagas por competências." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.geral} />,
});
