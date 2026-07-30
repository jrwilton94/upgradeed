import { Link } from "@tanstack/react-router";
import { Award, BookOpen, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { SectionCard, StatCard } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { computeMatch } from "@/lib/matching";
import { useLearnerData, useOpenJobs } from "@/hooks/use-learner-data";
import type { Tables } from "@/integrations/supabase/types";

export function StudentDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useLearnerData(profile.id);
  const { data: jobs } = useOpenJobs();

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Carregando seu painel…</p>;
  }

  const inProgress = data.enrollments.filter((e) => e.progress < 100);
  const matchingOn = profile.matching_enabled && (data.preferences?.matching_enabled ?? false);

  const suggestions = matchingOn
    ? (jobs ?? [])
        .map((job) => ({
          job,
          match: computeMatch(job, {
            completedSkills: data.skills,
            interests: [],
            studyHours: data.hours,
            certificates: data.certificates.length,
            behavioralDone: Boolean(data.behavioral),
            preferences: data.preferences,
          }),
        }))
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Olá, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aprendizado que vira oportunidade. Continue de onde você parou.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="XP acumulado" value={profile.xp} hint={`Nível ${profile.level}`} icon={TrendingUp} />
        <StatCard label="Ofensiva" value={`${profile.streak} dias`} hint="Estude hoje para manter" icon={Flame} />
        <StatCard label="Certificados" value={data.certificates.length} hint={`${data.hours}h complementares`} icon={Award} />
        <StatCard label="Competências" value={data.skills.length} hint="Verificadas por avaliação" icon={Sparkles} />
      </div>

      <SectionCard
        title="Continuar estudando"
        description="Seus cursos em andamento."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/cursos">Ver catálogo</Link>
          </Button>
        }
      >
        {inProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum curso em andamento. Escolha um módulo de 60 minutos no catálogo.
          </p>
        ) : (
          <ul className="space-y-4">
            {inProgress.map((enrollment) => (
              <li key={enrollment.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{enrollment.courses?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.courses?.level} · {enrollment.courses?.hours}h
                    </p>
                  </div>
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

      <SectionCard
        title="Competências verificadas"
        description="Construídas pelos cursos concluídos — a base do seu matching."
      >
        {data.skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Conclua um curso e passe na avaliação final para registrar competências.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Sugestões de vagas"
        description="Sugestões informativas. Nada é enviado sem o seu aceite."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/preferencias">Preferências</Link>
          </Button>
        }
      >
        {!matchingOn ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            <Target className="mb-2 size-5 text-brand" />
            O matching está desativado. Ative em Preferências de vaga para receber sugestões — você
            continua no controle de cada envio.
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há vagas abertas compatíveis. Continue desenvolvendo competências.
          </p>
        ) : (
          <ul className="space-y-4">
            {suggestions.map(({ job, match }) => (
              <li key={job.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.companies?.name} · {job.modality} · {job.seniority}
                    </p>
                  </div>
                  <Badge className="bg-brand text-brand-foreground">{match.score}% compatível</Badge>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {match.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/vagas/$id" params={{ id: job.id }}>
                    Ver vaga e decidir
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Certificados" description="Emitidos após aprovação na avaliação final.">
        {data.certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum certificado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {data.certificates.map((certificate) => (
              <li
                key={certificate.id}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <BookOpen className="size-4 text-brand" />
                <span className="flex-1 text-foreground">{certificate.courses?.title}</span>
                <span className="text-xs text-muted-foreground">{certificate.hours}h</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}