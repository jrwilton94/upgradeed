import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, CheckCircle2, Clock, PlayCircle, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLearning } from "@/components/module-learning";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/cursos/$slug")({
  head: () => ({
    meta: [
      { title: "Curso — Upgrade Educação" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Assista às aulas, faça a avaliação final e receba seu certificado com horas complementares.",
      },
      { property: "og:title", content: "Curso — Upgrade Educação" },
      { property: "og:description", content: "Aulas, quiz e certificado com competências." },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["course", slug, profile?.role],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*, lessons(*), course_modules(*), course_skills(skills(name))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!course) return null;
      const { data: auth } = await supabase.auth.getUser();
      let enrollment = null;
      if (auth.user) {
        const { data: enr } = await supabase
          .from("enrollments")
          .select("*")
          .eq("course_id", course.id)
          .eq("user_id", auth.user.id)
          .maybeSingle();
        enrollment = enr;
      }
      return { course, enrollment, userId: auth.user?.id ?? null };
    },
  });

  async function requireAuth() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.info("Entre na sua conta para continuar o curso.");
      navigate({ to: "/auth", search: { mode: "login" } });
      return null;
    }
    return auth.user.id;
  }

  async function enroll() {
    const userId = await requireAuth();
    if (!userId || !data?.course) return;
    const { error } = await supabase
      .from("enrollments")
      .upsert({ user_id: userId, course_id: data.course.id, progress: 10 }, { onConflict: "user_id,course_id,profile_role" });
    if (error) return toast.error(error.message);
    toast.success("Curso iniciado! Bons estudos.");
    queryClient.invalidateQueries();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="mx-auto max-w-6xl px-5 py-20 text-muted-foreground">Carregando curso…</p>
      </div>
    );
  }

  if (!data?.course) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h1 className="text-2xl font-bold text-foreground">Curso não encontrado</h1>
          <Button asChild className="mt-4">
            <Link to="/cursos">Voltar ao catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const course = data.course;
  const skills = (course.course_skills ?? []).map((cs) => cs.skills?.name).filter(Boolean) as string[];
  const lessons = [...(course.lessons ?? [])].sort((a, b) => a.position - b.position);
  const progress = data.enrollment?.progress ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="border-b border-border bg-hero-glow">
          <div className="mx-auto w-full max-w-6xl px-5 py-14">
            <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground">
              ← Catálogo
            </Link>
            <Badge variant="secondary" className="mt-4 block w-fit">
              {course.level}
            </Badge>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold text-foreground">
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">{course.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{course.instructor_name}</span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {course.hours}h de carga horária
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 text-brand" /> {course.rating}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" /> {course.students_count} alunos
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-xl font-bold text-foreground">Conteúdo do módulo</h2>
              <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                    <PlayCircle className="size-5 text-brand" />
                    <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">{lesson.duration_min} min</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold text-foreground">
                Competências desenvolvidas
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>

            {(course.course_modules ?? []).map(module => <ModuleLearning key={module.id} module={module} lessons={lessons.filter(l => l.module_id === module.id)} role={profile?.role} />)}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="text-sm font-semibold text-foreground">Seu progresso</p>
              <Progress value={progress} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">{progress}% concluído</p>
              {progress === 0 ? (
                <Button className="mt-4 w-full" onClick={enroll}>
                  Começar curso
                </Button>
              ) : progress < 100 ? (
                <p className="mt-4 text-sm text-muted-foreground">Conclua as avaliações dos módulos para avançar.</p>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand">
                  <CheckCircle2 className="size-4" /> Curso concluído
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-secondary/50 p-6">
              <Award className="size-5 text-brand" />
              <p className="mt-3 font-display font-bold text-foreground">Certificado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.hours}h de aprendizado. Aprovação obrigatória; horas complementares dependem de vínculo estudantil validado.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}