import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Briefcase, Building2, Plus, ShieldCheck, Sparkles, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { WorkspaceHeader, MetricStrip, WorkspaceSection, WorkspaceEmpty } from "@/components/dashboard-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function CompanyDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const [tab, setTab] = useState("recruiting");
  const { data, isLoading } = useQuery({
    queryKey: ["company-dashboard", profile.company_id],
    enabled: Boolean(profile.company_id),
    queryFn: async () => {
      if (!profile.company_id) return null;
      const [companyRes, jobsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", profile.company_id).maybeSingle(),
        supabase
          .from("jobs")
          .select("*")
          .eq("company_id", profile.company_id)
          .order("created_at", { ascending: false }),
      ]);
      const jobs = jobsRes.data ?? [];
      const jobIds = jobs.map((j) => j.id);
      const matchesRes = jobIds.length
        ? await supabase
            .from("matches")
            .select("*, jobs(title)")
            .in("job_id", jobIds)
            .eq("status", "aceita")
        : { data: [] };
      const matches = matchesRes.data ?? [];
      const userIds = Array.from(new Set(matches.map((m) => m.user_id)));
      const namesRes = userIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] };
      const names = new Map((namesRes.data ?? []).map((p) => [p.id, p.full_name]));
      return {
        company: companyRes.data,
        jobs,
        matches: matches.map((m) => ({ ...m, candidateName: names.get(m.user_id) ?? "Candidato" })),
      };
    },
  });

  if (!profile.company_id) {
    return (
      <p className="text-muted-foreground">
        Nenhuma empresa vinculada. Refaça o onboarding para cadastrar sua empresa.
      </p>
    );
  }
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando painel…</p>;

  const open = data.jobs.filter((j) => j.status === "aberta");

  return <div className="workspace-shell">
    <WorkspaceHeader eyebrow="Empresa / Central de talentos" title={data.company?.name ?? "Talentos & oportunidades"} subtitle={`Código de vínculo: ${data.company?.code ?? "—"}`} icon={Building2} action={<Button asChild><Link to="/vagas/nova"><Plus className="size-4" />Publicar vaga</Link></Button>} />
    <MetricStrip items={[{label:"Vagas abertas",value:open.length,icon:Briefcase},{label:"Vagas publicadas",value:data.jobs.length,icon:Sparkles},{label:"Candidaturas consentidas",value:data.matches.length,icon:UserCheck},{label:"Código da empresa",value:data.company?.code ?? "—",icon:Building2}]} />
    <div className="workspace-tabs" role="tablist" aria-label="Central de talentos">{[['recruiting','Recrutamento'],['team','Colaboradores'],['academy','Academia corporativa']].map(([key,label]) => <Button role="tab" key={key} variant="ghost" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</Button>)}</div>
    {tab === 'recruiting' && <div className="workspace-grid"><div><WorkspaceSection title="Vagas da empresa" count={data.jobs.length} action={<Button asChild variant="ghost" size="sm"><Link to="/vagas">Gerenciar<ArrowUpRight className="size-4" /></Link></Button>}>
      {!data.jobs.length ? <WorkspaceEmpty icon={Briefcase} title="Sua próxima contratação começa aqui" text="Nenhuma vaga publicada ainda." to="/vagas/nova" label="Publicar primeira vaga" /> : data.jobs.slice(0,5).map(job => <article key={job.id} className="workspace-row"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-foreground">{job.title}</h3><p className="mt-2 text-xs text-muted-foreground">{job.area} · {job.modality} · {job.seniority}</p></div><Badge variant={job.status === 'aberta' ? 'default' : 'secondary'}>{job.status}</Badge></div></article>)}
    </WorkspaceSection><WorkspaceSection title="Candidaturas recebidas" count={data.matches.length}>
      {!data.matches.length ? <WorkspaceEmpty icon={UserCheck} title="Nenhuma candidatura recebida" text="Os candidatos aparecem aqui somente após aceitarem participar da seleção." /> : data.matches.map(m => <article key={m.id} className="workspace-row"><div className="flex flex-wrap justify-between gap-3"><p className="font-semibold text-foreground">{m.candidateName}</p><Badge variant="secondary">{m.score}% compatível</Badge></div><p className="mt-2 text-xs text-muted-foreground">{m.jobs?.title}</p><div className="mt-3 flex flex-wrap gap-2">{m.matched_skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></article>)}
    </WorkspaceSection></div><div className="lg:border-l lg:border-border lg:pl-7"><WorkspaceSection title="Seleção responsável"><ShieldCheck className="mb-4 size-7 text-brand" /><p className="text-sm leading-relaxed text-muted-foreground">A IA recomenda compatibilidades. A avaliação e a decisão final são humanas.</p><p className="workspace-note mt-6 text-xs leading-relaxed text-muted-foreground">Dados de candidatos externos são compartilhados apenas com candidatura consentida.</p></WorkspaceSection><WorkspaceSection title="Talentos internos"><WorkspaceEmpty icon={Users} title="Mobilidade interna não ativa" text="Vagas internas e avaliações para promoção ainda não estão disponíveis." /></WorkspaceSection></div></div>}
    {tab === 'team' && <WorkspaceSection title="Equipe e desenvolvimento"><WorkspaceEmpty icon={Users} title="Gestão de colaboradores ainda não disponível" text={`Código de vínculo da empresa: ${data.company?.code ?? "—"}. O cadastro e a visão completa dos colaboradores ainda não estão ativos neste painel.`} /></WorkspaceSection>}
    {tab === 'academy' && <WorkspaceSection title="Academia corporativa"><WorkspaceEmpty icon={Building2} title="Academia corporativa ainda não ativa" text="Atribuição de trilhas, avaliação de colaboradores e acompanhamento de mobilidade interna ainda não estão disponíveis." /></WorkspaceSection>}
  </div>;
}
