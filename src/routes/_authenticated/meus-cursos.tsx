import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/use-profile";
import { useLearnerData } from "@/hooks/use-learner-data";

export const Route = createFileRoute("/_authenticated/meus-cursos")({
  head: () => ({ meta: [
    { title: "Meus cursos — Upgrade Educação" },
    { name: "description", content: "Continue os cursos da sua jornada de aprendizagem." },
    { property: "og:title", content: "Meus cursos — Upgrade Educação" },
    { property: "og:description", content: "Sua evolução nos cursos Upgrade." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MyCoursesPage,
});

function MyCoursesPage() {
  const { data: profile } = useProfile();
  const { data } = useLearnerData(profile?.id);

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  if (!["estudante","geral","colaborador"].includes(profile.role ?? "")) return <Navigate to="/painel" />;

  const enrollments = data?.enrollments ?? [];

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Meus cursos</h1>
          <p className="mt-1 text-muted-foreground">
            Seu aprendizado e suas avaliações.
          </p>
        </div>

        <SectionCard
          title="Matrículas"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/cursos">Catálogo</Link>
            </Button>
          }
        >
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não iniciou nenhum curso.
            </p>
          ) : (
            <ul className="space-y-3">
              {enrollments.map((enrollment) => (
                <li key={enrollment.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{enrollment.courses?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.progress >= 100 ? "Concluído" : "Em andamento"} ·{" "}
                        {enrollment.courses?.hours}h
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/cursos/$slug" params={{ slug: enrollment.courses?.slug ?? "" }}>
                        Abrir
                      </Link>
                    </Button>
                  </div>
                  <Progress value={enrollment.progress} className="mt-3" />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}