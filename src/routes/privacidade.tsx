import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Upgrade Educação" },
      {
        name: "description",
        content:
          "Política de Privacidade da Upgrade Educação: quais dados coletamos, como usamos e com quem compartilhamos.",
      },
      { property: "og:title", content: "Política de Privacidade — Upgrade Educação" },
      { property: "og:description", content: "Coleta, uso, compartilhamento e retenção de dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      intro="Esta política descreve como coletamos, usamos, compartilhamos e protegemos os dados de quem usa a Upgrade Educação."
      sections={[
        {
          heading: "Dados que coletamos",
          body: [
            "Dados cadastrais (nome, e-mail e perfil), dados de uso da plataforma (cursos, aulas, avaliações e certificados) e preferências declaradas de carreira.",
          ],
        },
        {
          heading: "Como usamos",
          body: [
            "Para dar acesso ao conteúdo, registrar progresso, emitir certificados, gerar indicadores agregados e, mediante sua autorização, sugerir oportunidades compatíveis.",
          ],
        },
        {
          heading: "Compartilhamento",
          body: [
            "Empresas só recebem seu perfil após você aceitar explicitamente uma candidatura. Instituições de ensino visualizam apenas indicadores agregados.",
          ],
        },
        {
          heading: "Retenção e segurança",
          body: [
            "Mantemos os dados enquanto sua conta estiver ativa ou pelo prazo exigido por lei. Utilizamos criptografia em trânsito e controles de acesso por papel.",
          ],
        },
      ]}
    />
  ),
});