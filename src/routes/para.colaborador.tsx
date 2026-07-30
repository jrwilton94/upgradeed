import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/colaborador")({
  head: () => ({
    meta: [
      { title: "Acesso para colaboradores — Upgrade Educação" },
      { name: "description", content: "Plano de desenvolvimento, trilhas internas e certificados para colaboradores de empresas parceiras." },
      { property: "og:title", content: "Acesso para colaboradores — Upgrade Educação" },
      { property: "og:description", content: "Plano de desenvolvimento, trilhas internas e certificados para colaboradores de empresas parceiras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.colaborador} />,
});
