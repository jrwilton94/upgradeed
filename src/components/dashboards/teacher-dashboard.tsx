import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, GaugeCircle, Star, Users } from "lucide-react";
import { SectionCard, StatCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function TeacherDashboard({ profile }: { profile: Tables<"profiles"> }) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">Painel do professor</h1>
        <p className="mt-1 text-muted-foreground">
          Módulos de pelo menos uma hora, com jogo de fixação e avaliação final.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunos alcançados" value={students} icon={Users} />
        <StatCard label="Minutos assistidos" value={minutes.toLocaleString("pt-BR")} icon={Clock} />
        <StatCard label="Avaliação média" value={avgRating} icon={Star} />
        <StatCard label="Taxa de conclusão" value={`${avgCompletion}%`} icon={GaugeCircle} />
      </div>

      <SectionCard
        title="Seus módulos"
        description="Desempenho por curso publicado."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/cursos">Ver catálogo</Link>
          </Button>
        }
      >
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum módulo publicado ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.students_count} alunos · nota {course.rating} · conclusão{" "}
                    {course.completion_rate}%
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/cursos/$slug" params={{ slug: course.slug }}>
                    Abrir
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Roteiro pedagógico Upgrade" description="Padrão de produção dos módulos.">
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Abertura com o problema real que a competência resolve.</li>
          <li>2. Explicação em blocos curtos, com exemplos aplicados.</li>
          <li>3. Jogo de fixação ao final de cada bloco.</li>
          <li>4. Avaliação final para liberar o certificado.</li>
          <li>5. Indicação das competências geradas no perfil do aluno.</li>
        </ol>
      </SectionCard>

      <SectionCard title="Remuneração">
        <p className="text-sm text-muted-foreground">Fundo de professores: 25% da receita mensal, separado do fundo das IES. No MVP, o score considera audiência (50%), produção (40%) e conclusão (10%).</p>
        <p className="mt-3 text-sm text-muted-foreground">Ainda não há demonstrativo de repasse disponível. O cálculo e a liquidação financeira não estão ativos neste MVP.</p>
      </SectionCard>
    </div>
  );
}