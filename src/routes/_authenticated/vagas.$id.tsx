import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, SectionCard } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useLearnerData } from "@/hooks/use-learner-data";
import { computeMatch } from "@/lib/matching";

export const Route = createFileRoute("/_authenticated/vagas/$id")({
  head: () => ({ meta: [
    { title: "Detalhes da vaga — Upgrade Educação" },
    { name: "description", content: "Conheça requisitos e compatibilidade com uma oportunidade." },
    { property: "og:title", content: "Detalhes da vaga — Upgrade Educação" },
    { property: "og:description", content: "Candidatura com consentimento e decisão humana." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: JobDetailPage,
});

function JobDetailPage() {
  const { id } = Route.useParams();
  const { data: profile } = useProfile();
  const { data: learner } = useLearnerData(profile?.id);
  const queryClient = useQueryClient();

  const { data: job } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, companies(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  if (!job) {
    return (
      <AppShell role={profile.role} userName={profile.full_name}>
        <p className="text-muted-foreground">Vaga não encontrada.</p>
        <Button asChild className="mt-4">
          <Link to="/vagas">Voltar</Link>
        </Button>
      </AppShell>
    );
  }

  const match = learner
    ? computeMatch(job, {
        completedSkills: learner.skills,
        interests: [],
        studyHours: learner.hours,
        certificates: learner.certificates.length,
        behavioralDone: Boolean(learner.behavioral),
        preferences: learner.preferences,
      })
    : null;

  async function accept() {
    if (!profile || !match || !job) return;
    const { error } = await supabase.from("matches").insert({
      user_id: profile.id,
      job_id: job.id,
      score: match.score,
      matched_skills: match.matchedSkills,
      reasons: match.reasons,
      status: "aceita",
    });
    if (error) return toast.error(error.message);
    toast.success("Perfil apresentado à empresa com seu consentimento.");
    queryClient.invalidateQueries();
  }

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">{job.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {job.companies?.name} · {job.area} · {job.modality} · {job.seniority}
          </p>
        </div>

        <SectionCard title="Sobre a vaga">
          <p className="whitespace-pre-line text-sm text-muted-foreground">{job.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.required_skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
            {job.desired_skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        </SectionCard>

        {profile.role !== "empresa" && match && (
          <SectionCard
            title={`Compatibilidade estimada: ${match.score}%`}
            description="Explicação transparente do cálculo. A IA não decide nada por você."
          >
            <ul className="space-y-1 text-sm text-muted-foreground">
              {match.reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4">
              <ShieldCheck className="mt-0.5 size-5 text-brand" />
              <p className="text-xs text-muted-foreground">
                Ao aceitar, seu nome e competências verificadas ficam visíveis para a empresa. Nada é
                enviado automaticamente.
              </p>
            </div>
            <Button className="mt-4" onClick={accept}>
              Aceitar e apresentar meu perfil
            </Button>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}