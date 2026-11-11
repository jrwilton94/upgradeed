import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection, MetricStrip } from "@/components/dashboard-workspace";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { hasPermission } from "@/lib/organization";

export const Route = createFileRoute("/_authenticated/empresa/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios da empresa — Upgrade Educação" },
      {
        name: "description",
        content: "Indicadores agregados de desenvolvimento dos colaboradores.",
      },
      { property: "og:title", content: "Relatórios da empresa — Upgrade Educação" },
      { property: "og:description", content: "Indicadores agregados da academia corporativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyReportPage,
});

type Report = {
  scoped: boolean;
  employees: number;
  certificates: number;
  hours: number;
  completion: number;
  top_competencies: { label: string; n: number }[];
  jobs: { open: number; closed: number; accepted_candidacies: number } | null;
};

function CompanyReportPage() {
  const org = useOrganization();
  const allowed =
    org.type === "empresa" &&
    (hasPermission(org.data, "relatorios") ||
      Boolean(org.data?.permissions.includes("relatorios")));
  const { data, isLoading, error } = useQuery({
    queryKey: ["company-report", org.id, org.data],
    enabled: Boolean(allowed && org.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("company_report", { _company: org.id as string });
      if (error) throw error;
      return data as unknown as Report;
    },
  });
  if (!org.profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={org.profile.role} userName={org.profile.full_name}>
      {!allowed ? (
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      ) : (
        <div className="workspace-shell">
          <WorkspaceHeader
            icon={BarChart3}
            eyebrow="Empresa / Análises"
            title="Relatórios da empresa."
            subtitle={data?.scoped ? "Visão limitada ao seu escopo" : "Toda a organização"}
          />
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : error || !data ? (
            <p role="alert" className="text-destructive">
              Não foi possível carregar o relatório.
            </p>
          ) : (
            <>
              <MetricStrip
                items={[
                  { label: "Colaboradores ativos", value: data.employees, icon: BarChart3 },
                  { label: "Certificados", value: data.certificates, icon: BarChart3 },
                  {
                    label: "Horas certificadas",
                    value: Number(data.hours).toLocaleString("pt-BR"),
                    icon: BarChart3,
                  },
                  { label: "Conclusão dos cursos", value: `${data.completion}%`, icon: BarChart3 },
                ]}
              />
              <WorkspaceSection
                title="Competências mais presentes"
                count={data.top_competencies.length}
              >
                {!data.top_competencies.length ? (
                  <p className="text-sm text-muted-foreground">Sem competências registradas.</p>
                ) : (
                  data.top_competencies.map((c) => (
                    <div key={c.label} className="workspace-row flex justify-between text-sm">
                      <span>{c.label}</span>
                      <span className="text-muted-foreground">{c.n} colaborador(es)</span>
                    </div>
                  ))
                )}
              </WorkspaceSection>
              {data.jobs && (
                <WorkspaceSection title="Vagas">
                  <p className="text-sm text-muted-foreground">
                    {data.jobs.open} abertas · {data.jobs.closed} encerradas ·{" "}
                    {data.jobs.accepted_candidacies} candidaturas aceitas pelos candidatos
                  </p>
                </WorkspaceSection>
              )}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
