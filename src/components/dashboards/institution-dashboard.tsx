import { useQuery } from "@tanstack/react-query";
import { Award, GraduationCap, Layers, TrendingUp } from "lucide-react";
import { SectionCard, StatCard } from "@/components/app-shell";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function InstitutionDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["institution", profile.institution_id],
    enabled: Boolean(profile.institution_id),
    queryFn: async () => {
      const [institutionRes, studentsRes] = await Promise.all([
        supabase.from("institutions").select("*").eq("id", profile.institution_id!).maybeSingle(),
        supabase.from("profiles").select("id, full_name, xp, level").eq("institution_id", profile.institution_id!),
      ]);
      const students = studentsRes.data ?? [];
      const ids = students.map((s) => s.id);
      const [enrollmentsRes, certificatesRes] = await Promise.all([
        ids.length
          ? supabase.from("enrollments").select("progress, user_id").in("user_id", ids)
          : Promise.resolve({ data: [] as { progress: number; user_id: string }[] }),
        ids.length
          ? supabase.from("certificates").select("hours, user_id").in("user_id", ids)
          : Promise.resolve({ data: [] as { hours: number; user_id: string }[] }),
      ]);
      return {
        institution: institutionRes.data,
        students,
        enrollments: enrollmentsRes.data ?? [],
        certificates: certificatesRes.data ?? [],
      };
    },
  });

  if (!profile.institution_id) {
    return (
      <p className="text-muted-foreground">
        Nenhuma instituição vinculada ao seu perfil. Refaça o onboarding para cadastrar.
      </p>
    );
  }
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando indicadores…</p>;

  const completion = data.enrollments.length
    ? Math.round(
        (data.enrollments.filter((e) => e.progress >= 100).length / data.enrollments.length) * 100,
      )
    : 0;
  const hours = data.certificates.reduce((sum, c) => sum + c.hours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {data.institution?.name ?? "Painel institucional"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Indicadores agregados de empregabilidade e horas complementares.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estudantes vinculados" value={data.students.length} icon={GraduationCap} />
        <StatCard label="Matrículas em cursos" value={data.enrollments.length} icon={Layers} />
        <StatCard label="Horas complementares" value={`${hours}h`} icon={Award} />
        <StatCard label="Taxa de conclusão" value={`${completion}%`} icon={TrendingUp} />
      </div>

      <SectionCard title="Engajamento" description="Conclusão média dos cursos iniciados.">
        <Progress value={completion} />
      </SectionCard>

      <SectionCard
        title="Estudantes"
        description="Dados agregados de progresso. Nenhum dado sensível é processado."
      >
        {data.students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum estudante vinculado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.students.map((student) => (
              <li key={student.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-foreground">{student.full_name}</span>
                <span className="text-muted-foreground">
                  Nível {student.level} · {student.xp} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}