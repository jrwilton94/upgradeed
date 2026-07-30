import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clock, Search, Star, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cursos/")({
  head: () => ({
    meta: [
      { title: "Catálogo de cursos — Upgrade Educação" },
      {
        name: "description",
        content:
          "Cursos rápidos com certificado automático e horas complementares em tecnologia, dados, gestão, comunicação, saúde e direito.",
      },
      { property: "og:title", content: "Catálogo de cursos — Upgrade Educação" },
      {
        property: "og:description",
        content: "Cursos curtos, certificados e competências verificadas.",
      },
    ],
  }),
  component: CursosPage,
});

export function useCourseCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const [courses, categories] = await Promise.all([
        supabase.from("courses").select("*").eq("published", true).order("students_count", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (courses.error) throw courses.error;
      if (categories.error) throw categories.error;
      return { courses: courses.data, categories: categories.data };
    },
  });
}

function CursosPage() {
  const { data, isLoading } = useCourseCatalog();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.courses ?? []).filter((course) => {
      const matchesTerm =
        !term ||
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.instructor_name.toLowerCase().includes(term);
      const matchesCategory = !category || course.category_id === category;
      const matchesLevel = !level || course.level === level;
      return matchesTerm && matchesCategory && matchesLevel;
    });
  }, [data, search, category, level]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-14">
        <h1 className="text-4xl font-extrabold text-foreground">Catálogo de cursos</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Cursos curtos com avaliação final, certificado automático e horas complementares. Cada
          conclusão fortalece o seu perfil de competências.
        </p>

        <div className="mt-8 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por curso, tema ou professor"
              className="h-11 pl-9"
              maxLength={80}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => setCategory(null)}>
              Todas as categorias
            </FilterChip>
            {data?.categories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={category === cat.id}
                onClick={() => setCategory(cat.id)}
              >
                {cat.name}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!level} onClick={() => setLevel(null)}>
              Todos os níveis
            </FilterChip>
            {["Iniciante", "Intermediário"].map((lvl) => (
              <FilterChip key={lvl} active={level === lvl} onClick={() => setLevel(lvl)}>
                {lvl}
              </FilterChip>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-12 text-muted-foreground">Carregando cursos…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Nenhum curso encontrado com esses filtros.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Link
                key={course.id}
                to="/cursos/$slug"
                params={{ slug: course.slug }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
              >
                <Badge variant="secondary" className="w-fit">
                  {course.level}
                </Badge>
                <h2 className="mt-3 font-display text-lg font-bold text-foreground">
                  {course.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {course.description}
                </p>
                <p className="mt-4 text-sm text-foreground/70">{course.instructor_name}</p>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {course.hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 text-brand" /> {course.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {course.students_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}