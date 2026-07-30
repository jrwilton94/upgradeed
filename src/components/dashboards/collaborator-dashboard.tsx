import { Link } from "@tanstack/react-router";
import { Award, Building2, Route as RouteIcon, TrendingUp } from "lucide-react";
import { SectionCard, StatCard } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLearnerData } from "@/hooks/use-learner-data";
import type { Tables } from "@/integrations/supabase/types";

export function CollaboratorDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useLearnerData(profile.id);
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando seu painel…</p>;

  const inProgress = data.enrollments.filter((e) => e.progress < 100);
  const planProgress = Math.round(
    (data.completed.length / Math.max(4, data.enrollments.length || 4)) * 100,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Plano de desenvolvimento
        </h1>
        <p className="mt-1 text-muted-foreground">
          Trilhas voltadas ao seu crescimento interno. Você não participa do matching externo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="XP acumulado" value={profile.xp} hint={`Nível ${profile.level}`} icon={TrendingUp} />
        <StatCard label="Trilhas concluídas" value={data.completed.length} icon={RouteIcon} />
        <StatCard label="Certificados" value={data.certificates.length} hint={`${data.hours}h`} icon={Award} />
        <StatCard
          label="Cargo atual"
          value={profile.current_position ?? "—"}
          hint={profile.target_position ? `Meta: ${profile.target_position}` : "Defina uma meta"}
          icon={Building2}
        />
      </div>

      <SectionCard title="Progresso do plano" description="Percentual de trilhas concluídas.">
        <Progress value={planProgress} />
        <p className="mt-2 text-sm text-muted-foreground">{planProgress}% do plano concluído</p>
      </SectionCard>

      <SectionCard
        title="Trilhas em andamento"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/cursos">Explorar trilhas</Link>
          </Button>
        }
      >
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma trilha em andamento.</p>
        ) : (
          <ul className="space-y-3">
            {inProgress.map((enrollment) => (
              <li key={enrollment.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{enrollment.courses?.title}</p>
                  <Button asChild size="sm">
                    <Link to="/cursos/$slug" params={{ slug: enrollment.courses?.slug ?? "" }}>
                      Continuar
                    </Link>
                  </Button>
                </div>
                <Progress value={enrollment.progress} className="mt-3" />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Competências mapeadas">
        <div className="flex flex-wrap gap-2">
          {data.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Conclua trilhas para mapear competências.</p>
          ) : (
            data.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
                {skill}
              </Badge>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}