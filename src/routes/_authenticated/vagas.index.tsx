import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, SectionCard } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/vagas/")({
  component: JobsPage,
});

function JobsPage() {
  const { data: profile } = useProfile();
  const isCompany = profile?.role === "empresa";

  const { data: jobs } = useQuery({
    queryKey: ["jobs-list", profile?.id, isCompany],
    enabled: Boolean(profile),
    queryFn: async () => {
      let query = supabase.from("jobs").select("*, companies(name)").order("created_at", {
        ascending: false,
      });
      query = isCompany
        ? query.eq("company_id", profile!.company_id!)
        : query.eq("status", "aberta");
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              {isCompany ? "Suas vagas" : "Vagas abertas"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isCompany
                ? "Publique oportunidades e receba perfis que aceitaram ser apresentados."
                : "Sugestões informativas — a decisão de se candidatar é sempre sua."}
            </p>
          </div>
          {isCompany && (
            <Button asChild>
              <Link to="/vagas/nova">Publicar vaga</Link>
            </Button>
          )}
        </div>

        <SectionCard title="Oportunidades">
          {!jobs || jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma vaga por aqui ainda.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.companies?.name} · {job.area} · {job.modality} · {job.seniority}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{job.status}</Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/vagas/$id" params={{ id: job.id }}>
                        Detalhes
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}