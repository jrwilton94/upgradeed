import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection, MetricStrip } from "@/components/dashboard-workspace";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";

export const Route = createFileRoute("/_authenticated/ies/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios agregados — Upgrade Educação" },
      {
        name: "description",
        content: "Empregabilidade, competências e perfil socioeconômico agregados dos estudantes.",
      },
      { property: "og:title", content: "Relatórios agregados — Upgrade Educação" },
      { property: "og:description", content: "Indicadores agregados sem dados individuais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IesReportPage,
});

type Row = { label: string; n: number | null; suppressed: boolean };
type Report =
  | { insufficient: true; message: string; min_group: number }
  | {
      insufficient: false;
      students: number;
      hours: number;
      completion: number;
      employability: { matching: Row[]; seeking_job: Row[]; accepted_candidacy: Row[] };
      competencies: Row[];
      socioeconomic: { working: Row[]; education_level: Row[] };
    };

const INSUFFICIENT = "Dados insuficientes";
const LEVELS: Record<string, string> = {
  basico: "Ensino básico",
  medio: "Ensino médio",
  graduacao: "Graduação",
  pos: "Pós-graduação",
};

function Rows({ rows, map }: { rows: Row[]; map?: Record<string, string> }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <>
      {rows.map((r) => (
        <div key={r.label} className="workspace-row flex justify-between gap-3 text-sm">
          <span>{map?.[r.label] ?? r.label}</span>
          <span className="text-muted-foreground">
            {r.suppressed || r.n === null ? INSUFFICIENT : r.n}
          </span>
        </div>
      ))}
    </>
  );
}

function csvCell(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function IesReportPage() {
  const org = useOrganization();
  const { data, isLoading, error } = useQuery({
    queryKey: ["ies-aggregate-report", org.id, org.data],
    enabled: Boolean(org.type === "ies" && org.id),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ies_aggregate_report", {
        _institution: org.id as string,
      });
      if (error) throw error;
      return data as unknown as Report;
    },
  });

  function exportCsv() {
    if (!data || data.insufficient) return;
    const lines: (string | number)[][] = [
      ["Seção", "Indicador", "Valor"],
      ["Geral", "Estudantes", data.students],
      ["Geral", "Horas certificadas", data.hours],
      ["Geral", "Conclusão dos cursos (%)", data.completion],
    ];
    const add = (section: string, rows: Row[], map?: Record<string, string>) =>
      rows.forEach((r) =>
        lines.push([
          section,
          map?.[r.label] ?? r.label,
          r.suppressed || r.n === null ? INSUFFICIENT : r.n,
        ]),
      );
    add("Empregabilidade — matching", data.employability.matching);
    add("Empregabilidade — busca de emprego", data.employability.seeking_job);
    add("Empregabilidade — candidaturas", data.employability.accepted_candidacy);
    add("Competências", data.competencies);
    add("Socioeconômico — trabalho", data.socioeconomic.working);
    add("Socioeconômico — escolaridade", data.socioeconomic.education_level, LEVELS);
    const blob = new Blob(["﻿" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-agregado-ies.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!org.profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={org.profile.role} userName={org.profile.full_name}>
      <div className="workspace-shell">
        <WorkspaceHeader
          icon={BarChart3}
          eyebrow="Instituição / Indicadores"
          title="Relatórios agregados."
          subtitle="Sem dados individuais · grupos com menos de 5 pessoas não são exibidos"
          action={
            data && !data.insufficient ? (
              <Button onClick={exportCsv}>
                <Download className="size-4" />
                Exportar CSV
              </Button>
            ) : undefined
          }
        />
        {isLoading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : error ? (
          <p role="alert" className="text-muted-foreground">
            Acesso não autorizado ou indisponível.
          </p>
        ) : !data ? null : data.insufficient ? (
          <WorkspaceSection title={INSUFFICIENT}>
            <p className="text-sm text-muted-foreground">{data.message}</p>
          </WorkspaceSection>
        ) : (
          <>
            <MetricStrip
              items={[
                { label: "Estudantes vinculados", value: data.students, icon: BarChart3 },
                {
                  label: "Horas certificadas",
                  value: Number(data.hours).toLocaleString("pt-BR"),
                  icon: BarChart3,
                },
                { label: "Conclusão dos cursos", value: `${data.completion}%`, icon: BarChart3 },
              ]}
            />
            <WorkspaceSection title="Empregabilidade">
              <Rows rows={data.employability.matching} />
              <Rows rows={data.employability.seeking_job} />
              <Rows rows={data.employability.accepted_candidacy} />
            </WorkspaceSection>
            <WorkspaceSection title="Competências (mínimo de 5 estudantes)">
              <Rows rows={data.competencies} />
            </WorkspaceSection>
            <WorkspaceSection title="Perfil socioeconômico">
              <Rows rows={data.socioeconomic.working} />
              <Rows rows={data.socioeconomic.education_level} map={LEVELS} />
            </WorkspaceSection>
            <p className="text-xs text-muted-foreground">
              Indicadores agregados da plataforma; não constituem documento oficial do MEC. Não são
              usados raça, gênero, idade, religião ou saúde.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
