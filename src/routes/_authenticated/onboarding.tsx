import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES, type ProfileRole } from "@/lib/profiles";
import { useProfile } from "@/hooks/use-profile";
import { InstitutionPicker } from "@/components/institution-picker";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Escolha seu perfil — Upgrade Educação" },
      { name: "description", content: "Configure seu perfil na Upgrade Educação." },
      { property: "og:title", content: "Escolha seu perfil — Upgrade Educação" },
      { property: "og:description", content: "Comece sua jornada na Upgrade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: profile, refresh } = useProfile();
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    education_level: "graduacao",
    institution_name: "",
    institution_id: "",
    course_name: "",
    semester: "",
    registration_number: "",
    school_year: "",
    classroom: "",
    works: false,
    employer_name: "",
    seeks_job: false,
    target_area: "",
    target_position: "",
  });

  async function confirm() {
    if (!role || !profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.rpc("configure_profile", {
        _role: role,
        _details: {
          ...details,
          institution_id: details.institution_id || undefined,
          organization_name: role === "empresa" ? companyName : institutionName,
        },
      });
      if (error) throw error;
      if (role === "estudante" || role === "geral") await supabase.rpc("claim_student_invites");
      await refresh();
      toast.success("Perfil configurado!");
      navigate({ to: "/painel" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hero-glow px-5 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Logo />
        <h1 className="mt-8 text-3xl font-extrabold text-foreground sm:text-4xl">
          Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Escolha seu perfil.
        </h1>
        <p className="mt-2 text-muted-foreground">Configure sua jornada na Upgrade Educação.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROFILES.filter((item) => item.role !== "colaborador" && item.role !== "professor").map(
            (item) => (
              <Button
                key={item.role}
                type="button"
                variant="outline"
                onClick={() => {
                  setRole(item.role);
                  setStep(1);
                }}
                className={`h-auto flex-col items-start whitespace-normal rounded-lg border p-5 text-left transition-all ${
                  role === item.role
                    ? "border-brand bg-brand-soft shadow-lift"
                    : "border-border bg-card hover:-translate-y-0.5 hover:shadow-soft"
                }`}
              >
                <item.icon className="size-5 text-brand" />
                <p className="mt-3 font-display font-bold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>
              </Button>
            ),
          )}
        </div>

        {(role === "estudante" || role === "geral") && (
          <div className="mt-8 max-w-2xl space-y-5">
            <h2 className="text-xl font-semibold">
              {role === "estudante"
                ? `Etapa ${step} de 2 — ${step === 1 ? "Vínculo educacional" : "Objetivos profissionais"}`
                : "Seu perfil profissional"}
            </h2>
            {(step === 1 || role === "geral") && (
              <div className="space-y-2">
                <Label htmlFor="education">Nível de ensino</Label>
                <select
                  id="education"
                  className="h-11 w-full rounded-md border border-input bg-background px-3"
                  value={details.education_level}
                  onChange={(e) => setDetails((d) => ({ ...d, education_level: e.target.value }))}
                >
                  {[
                    ["basico", "Ensino básico"],
                    ["medio", "Ensino médio"],
                    ["graduacao", "Graduação"],
                    ["pos", "Pós-graduação"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {role === "estudante" && step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <InstitutionPicker
                  name={details.institution_name}
                  institutionId={details.institution_id}
                  onChange={(v) =>
                    setDetails((d) => ({ ...d, institution_name: v.name, institution_id: v.id }))
                  }
                />
                {(
                  [
                    ...(details.education_level === "graduacao" || details.education_level === "pos"
                      ? [
                          ["course_name", "Curso"],
                          ["semester", "Semestre"],
                          ["registration_number", "Número de matrícula"],
                        ]
                      : [
                          ["school_year", "Série"],
                          ["classroom", "Turma"],
                        ]),
                  ] as [keyof typeof details, string][]
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={String(details[key])}
                      maxLength={160}
                      onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            {(step === 2 || role === "geral") && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  {(
                    [
                      ["works", "Está trabalhando?"],
                      ["seeks_job", "Está buscando trabalho?"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={details[key]}
                        onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["employer_name", "Onde trabalha"],
                      ["target_area", "Área pretendida"],
                      ["target_position", "Cargo ou vaga pretendida"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        value={details[key]}
                        maxLength={160}
                        onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {role === "empresa" && (
          <div className="mt-6 max-w-sm space-y-1.5">
            <Label htmlFor="company">Nome da empresa</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={120}
            />
          </div>
        )}

        {role === "ies" && (
          <div className="mt-6 max-w-sm space-y-1.5">
            <Label htmlFor="ies">Nome da instituição</Label>
            <Input
              id="ies"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              maxLength={120}
            />
          </div>
        )}

        <Button
          className="mt-8 h-11 px-8"
          disabled={!role || loading}
          onClick={() => {
            if (role === "estudante" && step === 1) {
              const fields =
                details.education_level === "graduacao" || details.education_level === "pos"
                  ? [
                      details.institution_name,
                      details.course_name,
                      details.semester,
                      details.registration_number,
                    ]
                  : [details.institution_name, details.school_year, details.classroom];
              if (fields.some((v) => !v.trim()))
                return toast.error("Preencha todos os dados do vínculo educacional.");
              setStep(2);
              return;
            }
            confirm();
          }}
        >
          {role === "estudante" && step === 1 ? "Continuar" : "Concluir cadastro"}
        </Button>
      </div>
    </div>
  );
}
