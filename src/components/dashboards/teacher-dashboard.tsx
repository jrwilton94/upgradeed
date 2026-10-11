import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Clock, GaugeCircle, Presentation, Star, Wallet } from "lucide-react";
import { useState } from "react";
import { WorkspaceHeader, MetricStrip, WorkspaceSection, WorkspaceEmpty, ProgressOrbit } from "@/components/dashboard-workspace";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function TeacherDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const [tab, setTab] = useState("modules");
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-courses", profile.id],
    queryFn: async () => {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", profile.id);
      if (error) throw error;
      return courses ?? [];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando seu painel…</p>;

  const courses = data ?? [];
  const students = courses.reduce((sum, c) => sum + c.students_count, 0);
  const minutes = courses.reduce((sum, c) => sum + c.minutes_watched, 0);
  const avgRating = courses.length
    ? (courses.reduce((sum, c) => sum + Number(c.rating), 0) / courses.length).toFixed(1)
    : "—";
  const avgCompletion = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + Number(c.completion_rate), 0) / courses.length)
    : 0;

  const ranked = [...courses].sort((a,b) => b.minutes_watched-a.minutes_watched);
  return <div className="workspace-shell">
    <WorkspaceHeader eyebrow="Professor / Estúdio de conteúdo" title="Seu conhecimento. Seu impacto." subtitle={profile.full_name} icon={Presentation} />
    <MetricStrip items={[
      {label:"Módulos publicados",value:courses.length,icon:BookOpen},
      {label:"Minutos assistidos",value:minutes.toLocaleString("pt-BR"),icon:Clock},
      {label:"Conclusão média",value:`${avgCompletion}%`,icon:GaugeCircle},
      {label:"Avaliação média",value:avgRating,icon:Star},
    ]} />
    <div className="workspace-tabs" role="tablist" aria-label="Estúdio do professor">{([['modules','Meus módulos'],['audience','Audiência'],['earnings','Remuneração']] as const).map(([key,label]) => <Button key={key} variant="ghost" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</Button>)}</div>
    {tab === 'modules' && <div className="workspace-grid"><WorkspaceSection title="Biblioteca de módulos" count={courses.length}>
      {!courses.length ? <WorkspaceEmpty icon={BookOpen} title="Nenhum módulo publicado ainda" text="O envio e a aprovação de novos conteúdos ainda não estão disponíveis neste painel." /> : courses.map(c => <article key={c.id} className="workspace-row"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-foreground">{c.title}</h3><p className="mt-2 text-xs text-muted-foreground">{c.minutes_watched} min assistidos · {c.completion_rate}% conclusão</p></div><Button asChild variant="outline" size="sm"><Link to="/cursos/$slug" params={{slug:c.slug}}>Abrir<ArrowUpRight className="size-4" /></Link></Button></div></article>)}
    </WorkspaceSection><div className="lg:border-l lg:border-border lg:pl-7"><WorkspaceSection title="Padrão de publicação"><ol className="space-y-5">{['Módulo com pelo menos 1 hora','4 aulas de 15 min ou 6 de 10 min','Jogo de fixação','Avaliação para liberar certificado'].map((text,i) => <li key={text} className="flex gap-3 text-sm text-muted-foreground"><span className="font-display font-bold text-brand">0{i+1}</span>{text}</li>)}</ol></WorkspaceSection><p className="workspace-note text-xs text-muted-foreground">Nenhum dado individual de alunos é exibido neste perfil.</p></div></div>}
    {tab === 'audience' && <div className="workspace-grid"><WorkspaceSection title="Conteúdos mais assistidos" count={ranked.length}>{!ranked.length ? <WorkspaceEmpty icon={Clock} title="Ainda não há audiência registrada" /> : ranked.map((c,i) => <div key={c.id} className="workspace-row"><div className="flex justify-between gap-4"><p className="text-sm font-semibold text-foreground"><span className="mr-3 text-brand">{i+1}</span>{c.title}</p><p className="shrink-0 text-sm text-muted-foreground">{c.minutes_watched} min</p></div><Progress value={minutes ? c.minutes_watched/minutes*100 : 0} className="mt-3 h-1.5" /></div>)}</WorkspaceSection><WorkspaceSection title="Conclusão dos módulos"><ProgressOrbit value={avgCompletion} label="taxa média de conclusão" /><p className="workspace-note mt-6 text-sm text-muted-foreground">{students} matrículas nos seus conteúdos.</p></WorkspaceSection></div>}
    {tab === 'earnings' && <div className="workspace-grid"><WorkspaceSection title="Demonstrativo de remuneração"><WorkspaceEmpty icon={Wallet} title="Nenhum repasse apurado" text="O cálculo do score, os pagamentos e as transferências bancárias ainda não estão ativos." /><div className="mt-6 grid grid-cols-2 gap-6"><div><p className="text-xs text-muted-foreground">Score para remuneração</p><p className="mt-2 text-xl font-bold text-foreground">Não apurado</p></div><div><p className="text-xs text-muted-foreground">Saldo disponível</p><p className="mt-2 text-xl font-bold text-foreground">Não disponível</p></div></div></WorkspaceSection><WorkspaceSection title="Composição do fundo"><p className="font-display text-4xl font-bold text-foreground">25%</p><p className="mt-2 text-sm text-muted-foreground">da receita mensal. Fundo separado das IES.</p><div className="workspace-note mt-6 space-y-3">{[['Audiência','50%'],['Produção','40%'],['Conclusão','10%']].map(([label,value]) => <p key={label} className="flex justify-between text-sm text-muted-foreground"><span>{label}</span><span className="font-semibold text-foreground">{value}</span></p>)}</div><p className="mt-5 text-xs text-muted-foreground">Pesos da fase MVP.</p></WorkspaceSection></div>}
  </div>;
}
