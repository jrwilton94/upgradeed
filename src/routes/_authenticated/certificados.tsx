import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { AppShell, SectionCard, StatCard } from "@/components/app-shell";
import { useProfile } from "@/hooks/use-profile";
import { useLearnerData } from "@/hooks/use-learner-data";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/certificados")({
  head: () => ({
    meta: [
      { title: "Meus certificados — Upgrade Educação" },
      { name: "description", content: "Consulte certificados e horas complementares." },
      { property: "og:title", content: "Meus certificados — Upgrade Educação" },
      { property: "og:description", content: "Certificados da sua jornada de aprendizagem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { data: profile } = useProfile();
  const { data } = useLearnerData(profile?.id);

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  if (!["estudante", "geral", "colaborador"].includes(profile.role ?? ""))
    return <Navigate to="/painel" />;
  const certificates = data?.certificates ?? [];

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Certificados</h1>
          <p className="mt-1 text-muted-foreground">
            Um certificado por módulo aprovado e um do curso completo, sempre com a carga horária.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Certificados emitidos" value={certificates.length} icon={Award} />
          <StatCard label="Horas certificadas" value={`${data?.hours ?? 0}h`} />
        </div>

        <SectionCard title="Seus certificados">
          {profile.role === "estudante" && (
            <Button asChild variant="outline" className="mb-5">
              <Link to="/vinculos">Vínculo estudantil</Link>
            </Button>
          )}
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum certificado emitido ainda.</p>
          ) : (
            <ul className="space-y-3">
              {certificates.map((certificate) => (
                <li
                  key={certificate.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {certificate.kind === "modulo"
                        ? `Módulo: ${certificate.course_modules?.title ?? ""}`
                        : "Curso completo"}{" "}
                      · {certificate.courses?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código {certificate.code} ·{" "}
                      {new Date(certificate.issued_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand">{certificate.hours}h</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
