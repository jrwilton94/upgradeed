import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Briefcase, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { SectionCard, StatCard } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export function CompanyDashboard({ profile }: { profile: Tables<"profiles"> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["company-dashboard", profile.company_id],
    enabled: Boolean(profile.company_id),
    queryFn: async () => {
      const [companyRes, jobsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", profile.company_id!).maybeSingle(),
        supabase
          .from("jobs")
          .select("*")
          .eq("company_id", profile.company_id!)
          .order("created_at", { ascending: false }),
      ]);
      const jobs = jobsRes.data ?? [];
      const jobIds = jobs.map((j) => j.id);
      const matchesRes = jobIds.length
        ? await supabase
            .from("matches")
            .select("*, profiles(full_name), jobs(title)")
            .in("job_id", jobIds)
            .eq("status", "aceita")
        : { data: [] };
      return { company: companyRes.data, jobs, matches: matchesRes.data ?? [] };
    },
  });

  if (!profile.company_id) {
    return (
      <p className="text-muted-foreground">
        Nenhuma empresa vinculada. Refaça o onboarding para cadastrar sua empresa.
      </p>
    );
  }
  if (isLoading || !data) return <p className="text-muted-foreground">Carregando painel…</p>;

  const open = data.jobs.filter((j) => j.status === "aberta");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            {data.company?.name ?? "Painel da empresa"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Código de vínculo dos colaboradores:{" "}
            <span className="font-semibold text-foreground">{data.company?.code}</span>
          </p>
        </div>
        <Button asChild>
          <Link to="/vagas/nova">Publicar vaga</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vagas abertas" value={open.length} icon={Briefcase} />
        <StatCard label="Vagas publicadas" value={data.jobs.length} icon={Sparkles} />
        <StatCard
          label="Candidatos que aceitaram"
          value={data.matches.length}
          hint="Somente com consentimento"
          icon={UserCheck}
        />
        <StatCard label="Decisão humana" value="100%" hint="A IA não elimina candidatos" icon={ShieldCheck} />
      </div>

      <SectionCard
        title="Suas vagas"
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/vagas">Gerenciar</Link>
          </Button>
        }
      >
        {data.jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma vaga publicada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {data.jobs.slice(0, 5).map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.area} · {job.modality} · {job.seniority}
                  </p>
                </div>
                <Badge variant={job.status === "aberta" ? "default" : "secondary"}>
                  {job.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Candidatos interessados"
        description="Perfis exibidos apenas quando a pessoa aceita a sugestão da vaga."
      >
        {data.matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum candidato aceitou ainda. Nada é enviado automaticamente.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.matches.map((match) => (
              <li key={match.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{match.profiles?.full_name}</p>
                  <Badge className="bg-brand text-brand-foreground">{match.score}% compatível</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{match.jobs?.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {match.matched_skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}