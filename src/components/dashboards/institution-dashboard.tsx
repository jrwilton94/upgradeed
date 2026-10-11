import { useQuery } from "@tanstack/react-query";
import { Award, Download, GraduationCap, Landmark, Layers, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WorkspaceHeader, MetricStrip, WorkspaceSection, WorkspaceEmpty, ProgressOrbit } from "@/components/dashboard-workspace";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function InstitutionDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const [tab, setTab] = useState("indicators");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["institution", profile.institution_id],
    enabled: Boolean(profile.institution_id),
    queryFn: async () => {
      if (!profile.institution_id) return null;
      const [institutionRes, indicatorsRes] = await Promise.all([
        supabase.from("institutions").select("name").eq("id", profile.institution_id).maybeSingle(),
        supabase.rpc("institution_indicators", { _institution_id: profile.institution_id }),
      ]);
      if (institutionRes.error) throw institutionRes.error;
      if (indicatorsRes.error) throw indicatorsRes.error;
      return {
        institution: institutionRes.data,
        indicators: indicatorsRes.data?.[0],
      };
    },
  });

  if (!profile.institution_id) {
    return (
      <p className="text-muted-foreground">
        Nenhuma instituição vinculada ao seu perfil. Solicite o vínculo à gestão da Upgrade.
      </p>
    );
  }
  if (isError) return <p role="alert" className="text-destructive">Não foi possível consultar os indicadores da instituição.</p>;
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando indicadores…</p>;

  const completion = Number(data.indicators?.completion ?? 0);
  const hours = Number(data.indicators?.hours ?? 0);

  function exportIndicators() {
    const rows = [
      "Indicador;Valor",
      `Estudantes vinculados;${data?.indicators?.students ?? 0}`,
      `Matrículas;${data?.indicators?.enrollments ?? 0}`,
      `Horas complementares;${hours}`,
      `Conclusão (%);${completion}`,
    ];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "upgrade-indicadores-institucionais.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="workspace-shell">
    <WorkspaceHeader eyebrow="IES / Inteligência institucional" title={data.institution?.name ?? "Observatório acadêmico"} subtitle="Aprendizagem e trajetória acadêmica em uma visão agregada." icon={Landmark} action={<Button onClick={exportIndicators}><Download className="size-4" />Exportar indicadores</Button>} />
    <MetricStrip items={[
      {label:"Estudantes vinculados",value:data.indicators?.students ?? 0,icon:GraduationCap},
      {label:"Matrículas",value:data.indicators?.enrollments ?? 0,icon:Layers},
      {label:"Horas complementares",value:`${hours}h`,icon:Award},
      {label:"Taxa de conclusão",value:`${completion}%`,icon:TrendingUp},
    ]} />
    <div className="workspace-tabs" role="tablist" aria-label="Observatório institucional">{[['indicators','Observatório'],['content','Conteúdo institucional'],['fund','Participação no fundo']].map(([key,label]) => <Button key={key} role="tab" variant="ghost" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</Button>)}</div>
    {tab === 'indicators' && <div className="workspace-grid"><WorkspaceSection title="Conclusão e engajamento"><div className="flex flex-wrap items-center gap-8"><ProgressOrbit value={completion} label="conclusão média dos cursos iniciados" /><div><p className="font-display text-3xl font-bold text-foreground">{hours}h</p><p className="mt-2 text-sm text-muted-foreground">complementares registradas</p></div></div><div className="workspace-note mt-8"><h3 className="font-semibold text-foreground">Relatório de aprendizagem</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Estudantes vinculados, matrículas, horas e conclusão. Sem identificação individual.</p><Button variant="outline" className="mt-5" onClick={exportIndicators}><Download className="size-4" />Baixar relatório CSV</Button><p className="mt-4 text-xs text-muted-foreground">Não substitui documentos oficiais exigidos pelo MEC.</p></div></WorkspaceSection><div className="lg:border-l lg:border-border lg:pl-7"><WorkspaceSection title="Privacidade institucional"><ShieldCheck className="mb-4 size-7 text-brand" /><p className="text-sm leading-relaxed text-muted-foreground">Somente indicadores agregados dos estudantes vinculados à instituição.</p></WorkspaceSection><WorkspaceSection title="Empregabilidade"><WorkspaceEmpty icon={TrendingUp} title="Indicadores ainda não disponíveis" text="Dados sociais, econômicos e de empregabilidade não estão incluídos no relatório atual." /></WorkspaceSection></div></div>}
    {tab === 'content' && <WorkspaceSection title="Vitrine de conteúdo"><WorkspaceEmpty icon={Layers} title="Publicação institucional ainda não disponível" text="O envio de aulas e a aprovação de conteúdos não estão ativos neste painel. Conteúdos livres não conferem diploma de graduação." /></WorkspaceSection>}
    {tab === 'fund' && <div className="workspace-grid"><WorkspaceSection title="Fundo institucional"><p className="font-display text-5xl font-bold text-foreground">10%</p><p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">da receita mensal, em fundo separado para instituições com conteúdo ativo.</p></WorkspaceSection><WorkspaceSection title="Recebimentos"><WorkspaceEmpty icon={Award} title="Nenhum demonstrativo disponível" text="Apuração do score, cadastro bancário e transferências ainda não estão ativos." /></WorkspaceSection></div>}
  </div>;
}
