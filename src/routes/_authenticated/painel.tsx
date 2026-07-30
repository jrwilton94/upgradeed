import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";
import { CollaboratorDashboard } from "@/components/dashboards/collaborator-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { InstitutionDashboard } from "@/components/dashboards/institution-dashboard";
import { CompanyDashboard } from "@/components/dashboards/company-dashboard";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelPage,
});

function PainelPage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return <p className="p-10 text-muted-foreground">Carregando…</p>;
  }
  if (!profile) return <Navigate to="/auth" />;
  if (!profile.role) return <Navigate to="/onboarding" />;

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      {(profile.role === "estudante" || profile.role === "geral") && (
        <StudentDashboard profile={profile} />
      )}
      {profile.role === "colaborador" && <CollaboratorDashboard profile={profile} />}
      {profile.role === "professor" && <TeacherDashboard profile={profile} />}
      {profile.role === "ies" && <InstitutionDashboard profile={profile} />}
      {profile.role === "empresa" && <CompanyDashboard profile={profile} />}
    </AppShell>
  );
}