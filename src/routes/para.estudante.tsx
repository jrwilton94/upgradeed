import { createFileRoute } from "@tanstack/react-router";
import { ProfileLanding } from "@/components/profile-landing";
import { LANDING_CONTENT } from "@/lib/plan-content";

export const Route = createFileRoute("/para/estudante")({
  head: () => ({
    meta: [
      { title: "Planos para estudantes — Upgrade Educação" },
      { name: "description", content: "Cursos, certificados com carga horária e sugestões de vagas para estudantes. Veja planos e como ativar seu acesso." },
      { property: "og:title", content: "Planos para estudantes — Upgrade Educação" },
      { property: "og:description", content: "Cursos, certificados com carga horária e sugestões de vagas para estudantes. Veja planos e como ativar seu acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileLanding content={LANDING_CONTENT.estudante} />,
});
