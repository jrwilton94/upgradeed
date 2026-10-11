import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Award, BookOpen, Compass, GraduationCap, Sparkles, Target } from "lucide-react";
import { WorkspaceHeader, MetricStrip, WorkspaceSection, WorkspaceEmpty, ProgressOrbit } from "@/components/dashboard-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { computeMatch } from "@/lib/matching";
import { useLearnerData, useOpenJobs } from "@/hooks/use-learner-data";
import type { Tables } from "@/integrations/supabase/types";

export function StudentDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useLearnerData(profile.id);
  const { data: jobs } = useOpenJobs();
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando sua trajetória…</p>;
  const professional = profile.role === "geral";
  const inProgress = data.enrollments.filter(e => e.progress < 100);
  const matchingOn = profile.matching_enabled && (data.preferences?.matching_enabled ?? false);
  const completion = data.enrollments.length ? Math.round(data.completed.length / data.enrollments.length * 100) : 0;
  const suggestions = matchingOn ? (jobs ?? []).map(job => ({ job, match: computeMatch(job, {
    completedSkills: data.skills, interests: [], studyHours: data.hours, certificates: data.certificates.length,
    behavioralDone: Boolean(data.behavioral), preferences: data.preferences,
  }) })).sort((a,b) => b.match.score-a.match.score).slice(0,3) : [];
  const learning = <WorkspaceSection title={professional ? "Seu próximo passo" : "Retomar aprendizado"} count={inProgress.length}
    action={<Button asChild variant="ghost" size="sm"><Link to="/meus-cursos">Meus cursos<ArrowUpRight className="size-4" /></Link></Button>}>
    {!inProgress.length ? <WorkspaceEmpty icon={BookOpen} title="Sua próxima competência começa aqui" text={professional ? "Escolha um curso alinhado ao seu objetivo profissional." : "Nenhum curso em andamento. Explore os módulos para iniciar sua trajetória acadêmica."} to="/cursos" label="Explorar catálogo" /> :
      inProgress.map(e => <article key={e.id} className="workspace-row">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-foreground">{e.courses?.title}</p><p className="mt-1 text-xs text-muted-foreground">{e.courses?.level} · {e.courses?.hours}h · {e.progress}% concluído</p></div>
          {e.courses?.slug && <Button asChild size="sm"><Link to="/cursos/$slug" params={{slug:e.courses.slug}}>Continuar<ArrowUpRight className="size-4" /></Link></Button>}
        </div><Progress value={e.progress} className="mt-4 h-1.5" />
      </article>)}
  </WorkspaceSection>;
  const opportunities = <WorkspaceSection title="Oportunidades para você" count={suggestions.length}
    action={<Button asChild variant="ghost" size="sm"><Link to="/preferencias"><Target className="size-4" />Preferências</Link></Button>}>
    {!matchingOn ? <WorkspaceEmpty icon={Compass} title="Matching desativado" text="Você decide se quer receber sugestões de vagas. Seu perfil só é enviado após confirmar uma candidatura." to="/preferencias" label="Definir objetivo" /> : !suggestions.length ?
      <WorkspaceEmpty icon={Target} title="Nenhuma vaga disponível no momento" text="Suas preferências estão ativas. Continue ampliando suas competências." /> : suggestions.map(({job,match}) =>
      <article className="workspace-row" key={job.id}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-foreground">{job.title}</h3><Badge variant="secondary">{match.score}% compatível</Badge></div>
        <p className="mt-2 text-xs text-muted-foreground">{job.companies?.name} · {job.modality}</p><p className="mt-2 text-xs text-muted-foreground">{match.reasons.slice(0,2).join(" · ")}</p>
        <Button asChild variant="link" size="sm" className="mt-2 px-0"><Link to="/vagas/$id" params={{id:job.id}}>Avaliar oportunidade<ArrowUpRight className="size-4" /></Link></Button>
      </article>)}
  </WorkspaceSection>;
  return <div className="workspace-shell">
    <WorkspaceHeader eyebrow={professional ? "Profissional / Carreira & competências" : "Estudante / Jornada acadêmica"} icon={professional ? Compass : GraduationCap}
      title={professional ? "Sua carreira, em movimento." : `Sua trajetória, ${profile.full_name.split(" ")[0]}.`}
      subtitle={professional ? (profile.target_position ? `Próximo objetivo: ${profile.target_position}` : "Conhecimento, competências e novas possibilidades profissionais.") : profile.education_level || "Aprendizado e horas complementares para o seu futuro."}
      action={<Button asChild><Link to={professional ? "/preferencias" : "/cursos"}>{professional ? "Meu objetivo profissional" : "Explorar cursos"}<ArrowUpRight className="size-4" /></Link></Button>} />
    <MetricStrip items={[
      {label:professional ? "Horas de desenvolvimento" : "Horas complementares",value:`${data.hours}h`,icon:BookOpen},
      {label:"Competências verificadas",value:data.skills.length,icon:Sparkles},
      {label:"Certificados",value:data.certificates.length,icon:Award},
      {label:"Cursos concluídos",value:data.completed.length,icon:GraduationCap},
    ]} />
    <div className="workspace-grid"><div>{professional ? opportunities : learning}
      <WorkspaceSection title="Mapa de competências" count={data.skills.length}>
        {data.skills.length ? <div className="flex flex-wrap gap-2">{data.skills.map(skill => <Badge key={skill} variant="secondary" className="rounded-md px-3 py-2">{skill}</Badge>)}</div> : <WorkspaceEmpty icon={Sparkles} title="Competências ainda não verificadas" text="As competências dos cursos aprovados aparecem na sua trajetória." />}
      </WorkspaceSection>{professional ? learning : opportunities}</div>
      <div className="lg:border-l lg:border-border lg:pl-7">
        <WorkspaceSection title={professional ? "Evolução profissional" : "Percurso acadêmico"}><ProgressOrbit value={completion} label="dos cursos iniciados foram concluídos" />
          <div className="workspace-note mt-6 flex justify-between text-sm"><span className="text-muted-foreground">Experiência acumulada</span><span className="font-semibold text-foreground">{profile.xp} XP · Nível {profile.level}</span></div>
          {!professional && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">O aproveitamento de horas complementares depende da sua instituição.</p>}
        </WorkspaceSection>
        <WorkspaceSection title="Conquistas" count={data.certificates.length} action={<Button asChild variant="ghost" size="sm"><Link to="/certificados"><ArrowUpRight className="size-4" /><span className="sr-only">Ver certificados</span></Link></Button>}>
          {!data.certificates.length ? <WorkspaceEmpty icon={Award} title="Seu primeiro certificado está por vir" /> : data.certificates.slice(0,4).map(c => <div key={c.id} className="workspace-row flex items-start gap-3"><Award className="mt-1 size-4 shrink-0 text-brand" /><div><p className="text-sm font-semibold text-foreground">{c.courses?.title}</p><p className="mt-1 text-xs text-muted-foreground">{c.hours}h certificadas</p></div></div>)}
        </WorkspaceSection>
      </div>
    </div>
  </div>;
}
