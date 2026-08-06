import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/aia")({
  head: () => ({
    meta: [
      { title: "AIA — Avaliação de Impacto Algorítmico — Upgrade Educação" },
      {
        name: "description",
        content:
          "Resumo público da Avaliação de Impacto Algorítmico do motor de matching da Upgrade Educação.",
      },
      { property: "og:title", content: "AIA — Avaliação de Impacto Algorítmico" },
      {
        property: "og:description",
        content: "Risco, mitigação e supervisão humana no sistema de recomendação da Upgrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Transparência algorítmica"
      title="Avaliação de Impacto Algorítmico"
      intro="Documentamos riscos, mitigações e garantias de supervisão humana do nosso motor de recomendação, segundo os princípios do PL 2338/2023."
      sections={[
        {
          heading: "Classificação de risco",
          body: [
            "O sistema é assistivo e informacional: gera sugestões de vagas e trilhas, sem produzir decisão automatizada com efeito jurídico ou de triagem.",
          ],
        },
        {
          heading: "Mitigações aplicadas",
          body: [
            "Exclusão de atributos sensíveis, explicação do cálculo de compatibilidade em cada sugestão, consentimento explícito antes de qualquer compartilhamento e possibilidade de desligar o matching a qualquer momento.",
          ],
        },
        {
          heading: "Supervisão humana",
          body: [
            "Em todos os momentos de consequência real — candidatura, avaliação e contratação — a decisão pertence a uma pessoa. A Upgrade apenas recomenda.",
          ],
        },
      ]}
    />
  ),
});