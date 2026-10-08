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
      if (!profile.institution_id) return null;
      const [institutionRes, indicatorsRes] = await Promise.all([
        supabase.from("institutions").select("name").eq("id", profile.institution_id).maybeSingle(),
        supabase.rpc("institution_indicators", { _institution_id: profile.institution_id }),
      ]);
      if (institutionRes.error) throw institutionRes.error;
      if (indicatorsRes.error) throw indicatorsRes.error;
      return {
        institution: institutionRes.data,
        indicators: indicatorsRes.data?.[0],
      };
    },
  });

  if (!profile.institution_id) {
    return (
      <p className="text-muted-foreground">
        Nenhuma instituição vinculada ao seu perfil. Solicite o vínculo à gestão da Upgrade.
      </p>
    );
  }
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando indicadores…</p>;

  const completion = Number(data.indicators?.completion ?? 0);
  const hours = Number(data.indicators?.hours ?? 0);

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
        <StatCard label="Estudantes vinculados" value={data.indicators?.students ?? 0} icon={GraduationCap} />
        <StatCard label="Matrículas em cursos" value={data.indicators?.enrollments ?? 0} icon={Layers} />
        <StatCard label="Horas complementares" value={`${hours}h`} icon={Award} />
        <StatCard label="Taxa de conclusão" value={`${completion}%`} icon={TrendingUp} />
      </div>

      <SectionCard title="Engajamento" description="Conclusão média dos cursos iniciados.">
        <Progress value={completion} />
      </SectionCard>

    </div>
  );
}