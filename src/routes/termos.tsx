import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Upgrade Educação" },
      {
        name: "description",
        content:
          "Termos de Uso da Upgrade Educação: regras de acesso, planos, conteúdos e responsabilidades das partes.",
      },
      { property: "og:title", content: "Termos de Uso — Upgrade Educação" },
      { property: "og:description", content: "Regras de acesso, assinaturas, conteúdos e conduta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ContentPage
      eyebrow="Termos"
      title="Termos de Uso"
      intro="Ao criar uma conta na Upgrade Educação você concorda com as condições abaixo."
      sections={[
        {
          heading: "Conta e acesso",
          body: [
            "O acesso é pessoal e intransferível. Você é responsável por manter suas credenciais seguras e pela veracidade das informações fornecidas.",
          ],
        },
        {
          heading: "Planos e pagamentos",
          body: [
            "Planos podem ser mensais ou anuais, sem taxa de implantação. O cancelamento interrompe as próximas cobranças e mantém o acesso até o fim do período vigente.",
          ],
        },
        {
          heading: "Conteúdos e certificados",
          body: [
            "Os conteúdos pertencem aos seus autores e à Upgrade. Certificados são emitidos apenas após aprovação na avaliação final e refletem a carga horária do curso.",
          ],
        },
        {
          heading: "Limites da plataforma",
          body: [
            "A Upgrade recomenda oportunidades, mas não contrata, não elimina candidatos e não garante colocação profissional.",
          ],
        },
      ]}
    />
  ),
});