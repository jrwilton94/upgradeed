import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

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
      sections={[
        {
          heading: "O certificado tem carga horária?",
          body: [
            "Sim. Ao ser aprovado na avaliação final, o certificado é emitido com a carga horária do curso e pode ser usado como horas complementares.",
          ],
        },
        {
          heading: "Como funciona a sugestão de vagas?",
          body: [
            "O matching compara suas competências verificadas e preferências declaradas com os requisitos das vagas. Ele só funciona se você ativar, e seu perfil só chega à empresa depois que você aceita.",
          ],
        },
        {
          heading: "Posso cancelar quando quiser?",
          body: [
            "Sim. O cancelamento é feito na própria conta e mantém o acesso até o fim do período já pago.",
          ],
        },
        {
          heading: "Minha instituição vê minhas notas individuais?",
          body: [
            "Não. Instituições acompanham apenas indicadores agregados, como engajamento, horas complementares e empregabilidade.",
          ],
        },
      ]}
    />
  ),
});