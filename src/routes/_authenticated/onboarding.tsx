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

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: profile, refresh } = useProfile();
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!role || !profile) return;
    setLoading(true);
    try {
      const update: {
        role: ProfileRole;
        plan: string;
        company_id?: string;
        institution_id?: string;
      } = {
        role,
        plan: role === "geral" ? "premium" : role === "estudante" ? "institucional" : "free",
      };

      if (role === "colaborador") {
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("code", companyCode.trim().toUpperCase())
          .maybeSingle();
        if (!company) throw new Error("Código de empresa inválido. Peça o código ao seu RH.");
        update.company_id = company.id;
      }

      if (role === "empresa") {
        if (companyName.trim().length < 2) throw new Error("Informe o nome da empresa");
        const code = `${companyName.trim().slice(0, 4).toUpperCase().replace(/\s/g, "")}${Math.floor(1000 + Math.random() * 8999)}`;
        const { data: company, error } = await supabase
          .from("companies")
          .insert({ name: companyName.trim(), code, owner_id: profile.id })
          .select()
          .single();
        if (error) throw error;
        update.company_id = company.id;
      }

      if (role === "ies") {
        if (institutionName.trim().length < 2) throw new Error("Informe o nome da instituição");
        const { data: institution, error } = await supabase
          .from("institutions")
          .insert({ name: institutionName.trim(), owner_id: profile.id })
          .select()
          .single();
        if (error) throw error;
        update.institution_id = institution.id;
      }

      const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
      if (error) throw error;
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
        <p className="mt-2 text-muted-foreground">
          Cada perfil tem um painel próprio. Você pode alterar isso depois.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROFILES.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => setRole(item.role)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                role === item.role
                  ? "border-brand bg-brand-soft shadow-lift"
                  : "border-border bg-card hover:-translate-y-0.5 hover:shadow-soft"
              }`}
            >
              <item.icon className="size-5 text-brand" />
              <p className="mt-3 font-display font-bold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.tagline}</p>
            </button>
          ))}
        </div>

        {role === "colaborador" && (
          <div className="mt-6 max-w-sm space-y-1.5">
            <Label htmlFor="code">Código da empresa</Label>
            <Input
              id="code"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              placeholder="Ex.: NEXA2025"
              maxLength={24}
            />
            <p className="text-xs text-muted-foreground">
              Códigos de demonstração: NEXA2025, ORION2025, VERDE2025.
            </p>
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

        <Button className="mt-8 h-11 px-8" disabled={!role || loading} onClick={confirm}>
          Continuar
        </Button>
      </div>
    </div>
  );
}