import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () => ({
    meta: [
      { title: "Trabalhe conosco — Upgrade Educação" },
      {
        name: "description",
        content:
          "Faça parte do time que está construindo a maior base viva de competências da América Latina.",
      },
      { property: "og:title", content: "Trabalhe conosco — Upgrade Educação" },
      { property: "og:description", content: "Vagas, cultura e como se candidatar na Upgrade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Carreiras"
      title="Trabalhe conosco"
      intro="Estamos construindo a maior base viva de competências da América Latina — e queremos gente que acredita em tecnologia responsável."
      sections={[
        {
          heading: "Como trabalhamos",
          body: [
            "Time remoto, decisões orientadas por evidência e produtos desenhados com privacidade desde a origem.",
          ],
        },
        {
          heading: "Candidaturas espontâneas",
          body: [
            "Envie seu currículo e um breve relato do que você quer construir para carreiras@upgradeeducacao.com.br. Analisamos todas as candidaturas.",
          ],
        },
        {
          heading: "Professores parceiros",
          body: [
            "Se você quer ensinar na plataforma, o caminho é a página Sou professor — sem mensalidade e com repasse por audiência e conclusões.",
          ],
        },
      ]}
    />
  ),
});