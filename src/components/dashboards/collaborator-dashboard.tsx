import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Award, BookOpen, Building2, Route as RouteIcon, Sparkles } from "lucide-react";
import { WorkspaceHeader, MetricStrip, WorkspaceSection, WorkspaceEmpty, ProgressOrbit } from "@/components/dashboard-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLearnerData } from "@/hooks/use-learner-data";
import type { Tables } from "@/integrations/supabase/types";

export function CollaboratorDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useLearnerData(profile.id);
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando desenvolvimento…</p>;
  const inProgress = data.enrollments.filter(e => e.progress < 100);
  const completion = data.enrollments.length ? Math.round(data.completed.length / data.enrollments.length * 100) : 0;
  return <div className="workspace-shell">
    <WorkspaceHeader eyebrow="Colaborador / Desenvolvimento interno" title="Cresça dentro da sua empresa." icon={Building2} subtitle={profile.full_name} action={<Button asChild><Link to="/cursos">Explorar aprendizado<ArrowUpRight className="size-4" /></Link></Button>} />
    <div className="mb-8 grid gap-6 border-y border-border py-6 sm:grid-cols-3">
      <div><p className="text-xs text-muted-foreground">Cargo atual</p><p className="mt-2 font-display text-xl font-bold text-foreground">{profile.current_position || "Não informado"}</p></div>
      <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowRight className="size-4 text-brand" />Próximo objetivo interno</p><p className="mt-2 font-display text-xl font-bold text-foreground">{profile.target_position || "Ainda não definido"}</p></div>
      <div className="flex items-center"><ProgressOrbit value={completion} label="dos cursos iniciados concluídos" /></div>
    </div>
    <div className="workspace-grid"><div>
      <WorkspaceSection title="Aprendizado em andamento" count={inProgress.length}>
        {!inProgress.length ? <WorkspaceEmpty icon={RouteIcon} title="Nenhum curso em andamento" text="Encontre conteúdos para desenvolver novas competências profissionais." to="/cursos" label="Escolher curso" /> : inProgress.map(e => <article key={e.id} className="workspace-row"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-foreground">{e.courses?.title}</p><p className="mt-1 text-xs text-muted-foreground">{e.progress}% concluído</p></div>{e.courses?.slug && <Button asChild size="sm"><Link to="/cursos/$slug" params={{slug:e.courses.slug}}>Continuar<ArrowUpRight className="size-4" /></Link></Button>}</div><Progress value={e.progress} className="mt-4 h-1.5" /></article>)}
      </WorkspaceSection>
      <WorkspaceSection title="Competências desenvolvidas" count={data.skills.length}>{data.skills.length ? <div className="flex flex-wrap gap-2">{data.skills.map(s => <Badge key={s} variant="secondary" className="rounded-md px-3 py-2">{s}</Badge>)}</div> : <WorkspaceEmpty icon={Sparkles} title="Seu mapa de competências está começando" />}</WorkspaceSection>
    </div><div className="lg:border-l lg:border-border lg:pl-7">
      <WorkspaceSection title="Seu desenvolvimento"><MetricStrip items={[{label:"Cursos concluídos",value:data.completed.length,icon:BookOpen},{label:"Certificados",value:data.certificates.length,icon:Award},{label:"Horas de estudo",value:`${data.hours}h`,icon:RouteIcon},{label:"Experiência",value:`${profile.xp} XP`,icon:Sparkles}]} /></WorkspaceSection>
      <WorkspaceSection title="Mobilidade interna"><p className="text-sm leading-relaxed text-muted-foreground">Nenhuma oportunidade interna disponível neste momento.</p><p className="workspace-note mt-5 text-xs leading-relaxed text-muted-foreground">A academia corporativa e a gestão de oportunidades internas ainda não estão ativas. Este perfil não participa do matching externo.</p></WorkspaceSection>
      <Button asChild variant="outline"><Link to="/certificados"><Award className="size-4" />Meus certificados</Link></Button>
    </div></div>
  </div>;
}
