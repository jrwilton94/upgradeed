import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, Clock, GaugeCircle, Presentation, Wallet } from "lucide-react";
import { useState } from "react";
import {
  WorkspaceHeader,
  MetricStrip,
  WorkspaceSection,
  WorkspaceEmpty,
} from "@/components/dashboard-workspace";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AuthorWallet } from "@/components/author-wallet";
import type { Tables } from "@/integrations/supabase/types";

type TeacherData = {
  month: string;
  courses: number;
  watched_minutes: number;
  watched_minutes_total: number;
  top_videos: {
    lesson_id: string;
    title: string;
    course: string;
    minutes: number;
    total_minutes: number;
  }[];
  modules: {
    module_id: string;
    title: string;
    course_id: string;
    course: string;
    status: string;
    lessons: number;
    minutes: number;
    started: number;
    approved: number;
    completion_rate: number | null;
  }[];
  completion_rate: number | null;
  score: number;
  estimated_cents: number;
  fund_cents: number;
  account: { accrued_cents: number; paid_cents: number; has_payout_account: boolean };
};

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const num = (v: number) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  em_avaliacao: "Em avaliação",
  publicado: "Publicado",
  suspenso: "Suspenso",
};

/** Painel do professor: tudo vem de teacher_dashboard() — agregados reais, sem dados de alunos. */
export function TeacherDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const [tab, setTab] = useState("modules");
  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-dashboard", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("teacher_dashboard", {});
      if (error) throw error;
      return data as unknown as TeacherData;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Carregando seu painel…</p>;
  if (error || !data)
    return (
      <p className="text-destructive" role="alert">
        Não foi possível carregar o painel.
      </p>
    );
  const month = new Date(`${data.month}T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="workspace-shell">
      <WorkspaceHeader
        eyebrow="Professor / Estúdio de conteúdo"
        title="Seu conhecimento. Seu impacto."
        subtitle={`${profile.full_name} · ${month}`}
        icon={Presentation}
        action={
          <Button asChild>
            <Link to="/conteudo">
              Meus conteúdos
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <MetricStrip
        items={[
          { label: "Cursos", value: data.courses, icon: BookOpen },
          { label: "Minutos assistidos no mês", value: num(data.watched_minutes), icon: Clock },
          {
            label: "Conclusão dos módulos",
            value: data.completion_rate === null ? "—" : `${num(data.completion_rate)}%`,
            icon: GaugeCircle,
          },
          { label: "Estimativa do mês", value: brl(Number(data.estimated_cents)), icon: Wallet },
        ]}
      />
      <div className="workspace-tabs" role="tablist" aria-label="Estúdio do professor">
        {(
          [
            ["modules", "Meus módulos"],
            ["audience", "Audiência"],
            ["earnings", "Score e conta"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant="ghost"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "modules" && (
        <div className="workspace-grid">
          <WorkspaceSection title="Todos os módulos" count={data.modules.length}>
            {!data.modules.length ? (
              <WorkspaceEmpty
                icon={BookOpen}
                title="Nenhum módulo cadastrado"
                text="Cadastre seus cursos e módulos no estúdio de conteúdo."
              />
            ) : (
              data.modules.map((m) => (
                <article key={m.module_id} className="workspace-row">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{m.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.course} · {STATUS[m.status] ?? m.status} · {m.lessons} aulas ·{" "}
                        {num(m.minutes)} min assistidos no mês
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {m.completion_rate === null
                        ? "Sem iniciantes no mês"
                        : `${num(m.completion_rate)}% de conclusão`}
                    </p>
                  </div>
                  {m.completion_rate !== null && (
                    <Progress value={m.completion_rate} className="mt-3 h-1.5" />
                  )}
                  {m.completion_rate !== null && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {m.approved} aprovados de {m.started} que iniciaram no mês
                    </p>
                  )}
                </article>
              ))
            )}
          </WorkspaceSection>
          <div className="lg:border-l lg:border-border lg:pl-7">
            <WorkspaceSection title="Padrão de publicação">
              <ol className="space-y-5">
                {[
                  "Módulo com pelo menos 1 hora",
                  "4 aulas de 15 min ou 6 de 10 min",
                  "Jogo de fixação",
                  "Avaliação para liberar certificado",
                ].map((text, i) => (
                  <li key={text} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-display font-bold text-brand">0{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ol>
            </WorkspaceSection>
          </div>
        </div>
      )}

      {tab === "audience" && (
        <WorkspaceSection title="Vídeos mais assistidos no mês" count={data.top_videos.length}>
          {!data.top_videos.length ? (
            <WorkspaceEmpty icon={Clock} title="Ainda não há audiência registrada" />
          ) : (
            data.top_videos.map((v, i) => (
              <div key={v.lesson_id} className="workspace-row">
                <div className="flex justify-between gap-4">
                  <p className="min-w-0 text-sm font-semibold text-foreground">
                    <span className="mr-3 text-brand">{i + 1}</span>
                    {v.title}
                    <span className="block pl-6 text-xs font-normal text-muted-foreground">
                      {v.course}
                    </span>
                  </p>
                  <p className="shrink-0 text-right text-sm text-muted-foreground">
                    {num(v.minutes)} min
                    <span className="block text-xs">{num(v.total_minutes)} min no total</span>
                  </p>
                </div>
              </div>
            ))
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Contam sessões de pelo menos 20 segundos, limitadas à duração do vídeo por pessoa e por
            dia. Nenhum dado de aluno é exibido.
          </p>
        </WorkspaceSection>
      )}

      {tab === "earnings" && (
        <>
          <WorkspaceSection title="Score do mês e conta digital">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Participação no fundo dos professores
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {(Number(data.score) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                  %
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimativa do mês (não é pagamento)</p>
                <p className="mt-2 text-2xl font-bold">{brl(Number(data.estimated_cents))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo apurado a receber</p>
                <p className="mt-2 text-2xl font-bold">{brl(Number(data.account.accrued_cents))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recebimentos registrados</p>
                <p className="mt-2 text-2xl font-bold">{brl(Number(data.account.paid_cents))}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Fundo do mês: {brl(Number(data.fund_cents))}. O saldo é um registro de apuração;
              transferências bancárias dependem de serviço financeiro contratado e não são feitas
              automaticamente.
            </p>
          </WorkspaceSection>
          <AuthorWallet />
        </>
      )}
    </div>
  );
}
