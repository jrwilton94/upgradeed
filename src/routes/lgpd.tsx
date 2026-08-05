import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/lgpd")({
  head: () => ({
    meta: [
      { title: "LGPD — Upgrade Educação" },
      {
        name: "description",
        content:
          "Como a Upgrade Educação trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados.",
      },
      { property: "og:title", content: "LGPD — Upgrade Educação" },
      { property: "og:description", content: "Bases legais, direitos do titular e minimização de dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Proteção de dados"
      title="LGPD"
      intro="Tratamos dados pessoais com finalidade específica, minimização e transparência, conforme a Lei 13.709/2018."
      sections={[
        {
          heading: "Finalidade e bases legais",
          body: [
            "Os dados são utilizados para viabilizar o acesso a cursos, emissão de certificados e, quando você autoriza, a sugestão de oportunidades compatíveis com suas competências.",
            "As bases legais aplicadas são a execução de contrato, o consentimento (para matching e compartilhamento com empresas) e o cumprimento de obrigação legal.",
          ],
        },
        {
          heading: "Minimização",
          body: [
            "Nunca utilizamos dados sensíveis como raça, gênero, idade, religião ou saúde em recomendações. Instituições e empresas acessam apenas indicadores agregados, exceto quando você aceita compartilhar seu perfil.",
          ],
        },
        {
          heading: "Direitos do titular",
          body: [
            "Você pode confirmar o tratamento, acessar, corrigir, portar, anonimizar ou eliminar seus dados, além de revogar o consentimento a qualquer momento nas preferências da sua conta ou pelo canal de contato.",
          ],
        },
      ]}
    />
  ),
});