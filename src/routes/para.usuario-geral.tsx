import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/para/usuario-geral")({
  beforeLoad: () => { throw redirect({ to: "/para/profissional", statusCode: 301 }); },
  head: () => ({
    meta: [
      { title: "Para profissionais — Upgrade Educação" },
      { name: "description", content: "Continue evoluindo profissionalmente: cursos no seu ritmo, competências reconhecidas e oportunidades compatíveis." },
      { property: "og:title", content: "Para profissionais — Upgrade Educação" },
      { property: "og:description", content: "Continue evoluindo profissionalmente: cursos no seu ritmo, competências reconhecidas e oportunidades compatíveis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
