import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContentPage } from "@/components/content-page";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Upgrade Educação" },
      {
        name: "description",
        content:
          "Fale com o time da Upgrade Educação sobre planos, parcerias com instituições de ensino, empresas e professores.",
      },
      { property: "og:title", content: "Contato — Upgrade Educação" },
      {
        property: "og:description",
        content: "Canais de atendimento para estudantes, empresas, IES e professores parceiros.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContatoPage,
});

const CHANNELS = [
  { icon: Mail, label: "E-mail", value: "contato@upgradeeducacao.com.br" },
  { icon: Phone, label: "WhatsApp", value: "+55 (11) 90000-0000" },
  { icon: MapPin, label: "Atendimento", value: "100% online, em todo o Brasil" },
];

function ContatoPage() {
  return (
    <ContentPage
      eyebrow="Fale com a gente"
      title="Contato"
      intro="Quer conhecer os planos, firmar parceria ou tirar dúvidas sobre a plataforma? Nosso time responde em até um dia útil."
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <div key={channel.label} className="rounded-2xl border border-border bg-card p-6">
            <channel.icon className="size-5 text-brand" />
            <p className="mt-3 font-display font-bold text-foreground">{channel.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{channel.value}</p>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}