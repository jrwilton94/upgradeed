import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection } from "@/components/dashboard-workspace";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";

export const Route = createFileRoute("/_authenticated/ies/cursos")({
  head: () => ({
    meta: [
      { title: "Cursos da instituição — Upgrade Educação" },
      {
        name: "description",
        content: "Cursos da instituição organizados por curso, campus ou centro.",
      },
      { property: "og:title", content: "Cursos da instituição — Upgrade Educação" },
      { property: "og:description", content: "Organização de cursos por escopo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IesCoursesPage,
});

function IesCoursesPage() {
  const org = useOrganization();
  const qc = useQueryClient();
  const allowed =
    org.type === "ies" && (org.data?.owner || org.data?.permissions.includes("cursos"));
  const { data, error } = useQuery({
    queryKey: ["ies-courses", org.id, org.data],
    enabled: Boolean(allowed && org.id),
    retry: false,
    queryFn: async () => {
      const [courses, scopes] = await Promise.all([
        supabase.rpc("ies_list_courses", { _institution: org.id as string }),
        supabase
          .from("organization_scopes")
          .select("id,name,kind")
          .eq("organization_id", org.id as string)
          .eq("organization_type", "ies"),
      ]);
      if (courses.error) throw courses.error;
      return { courses: courses.data ?? [], scopes: scopes.data ?? [] };
    },
  });
  async function move(course: string, scope: string) {
    const { error } = await supabase.rpc("ies_set_course_scope", {
      _course: course,
      _scope: scope || (null as unknown as string),
    });
    if (error) return toast.error(error.message);
    toast.success("Escopo do curso atualizado.");
    await qc.invalidateQueries({ queryKey: ["ies-courses"] });
  }
  if (!org.profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={org.profile.role} userName={org.profile.full_name}>
      {!allowed ? (
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      ) : (
        <div className="workspace-shell">
          <WorkspaceHeader
            icon={BookOpen}
            eyebrow="Instituição / Cursos"
            title="Cursos e turmas."
            subtitle="Organize os cursos por curso, campus ou centro; cada subperfil vê apenas o seu escopo"
          />
          <WorkspaceSection title="Cursos" count={data?.courses.length ?? 0}>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {(error as Error).message}
              </p>
            ) : !data?.courses.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum curso da instituição no seu escopo.
              </p>
            ) : (
              data.courses.map((c) => (
                <article
                  key={c.course_id}
                  className="workspace-row flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.status} · {c.modules} módulos · {c.enrollments} matrículas (total agregado)
                    </p>
                  </div>
                  <div>
                    <label className="sr-only" htmlFor={`scope-${c.course_id}`}>
                      Escopo de {c.title}
                    </label>
                    <select
                      id={`scope-${c.course_id}`}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={c.scope_id ?? ""}
                      onChange={(e) => move(c.course_id, e.target.value)}
                    >
                      <option value="">Toda a instituição</option>
                      {data.scopes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))
            )}
          </WorkspaceSection>
          <p className="text-xs text-muted-foreground">
            Turmas são representadas pelos escopos cadastrados em Subperfis; não há estrutura de
            turma separada nesta versão.
          </p>
        </div>
      )}
    </AppShell>
  );
}
