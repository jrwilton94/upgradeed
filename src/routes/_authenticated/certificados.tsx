import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { AppShell, SectionCard, StatCard } from "@/components/app-shell";
import { useProfile } from "@/hooks/use-profile";
import { useLearnerData } from "@/hooks/use-learner-data";

export const Route = createFileRoute("/_authenticated/certificados")({
  component: CertificatesPage,
});

function CertificatesPage() {
  const { data: profile } = useProfile();
  const { data } = useLearnerData(profile?.id);

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  const certificates = data?.certificates ?? [];

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Certificados</h1>
          <p className="mt-1 text-muted-foreground">
            Emitidos após aprovação na avaliação final, com horas complementares.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Certificados emitidos" value={certificates.length} icon={Award} />
          <StatCard label="Horas complementares" value={`${data?.hours ?? 0}h`} />
        </div>

        <SectionCard title="Seus certificados">
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
                    <p className="font-semibold text-foreground">{certificate.courses?.title}</p>
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