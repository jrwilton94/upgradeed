import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";
import { PROFILES } from "@/lib/profiles";
import { PROFILE_FAQ } from "@/lib/profile-faq";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas Frequentes — Upgrade Educação" },
      {
        name: "description",
        content:
          "Dúvidas sobre planos, certificados, matching de vagas e privacidade na Upgrade Educação.",
      },
      { property: "og:title", content: "Perguntas Frequentes — Upgrade Educação" },
      { property: "og:description", content: "Respostas rápidas sobre a plataforma e os planos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Ajuda"
      title="Perguntas Frequentes"
      intro="As dúvidas mais comuns de estudantes, profissionais, professores, instituições e empresas."
      sections={PROFILES.flatMap((profile) => PROFILE_FAQ[profile.role].map((item) => ({
        heading: `${profile.label} — ${item.q}`,
        body: [item.a],
      })))}
    />
  ),
});