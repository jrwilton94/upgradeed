import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell, SectionCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/preferencias")({
  head: () => ({ meta: [
    { title: "Preferências de vagas — Upgrade Educação" },
    { name: "description", content: "Defina suas preferências e consentimento para oportunidades." },
    { property: "og:title", content: "Preferências de vagas — Upgrade Educação" },
    { property: "og:description", content: "Sua carreira, suas escolhas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    area: "",
    city: "",
    state: "",
    work_model: "",
    contract_type: "",
    salary_range: "",
    matching_enabled: false,
  });

  const { data } = useQuery({
    queryKey: ["preferences", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data: prefs } = await supabase
        .from("employability_preferences")
        .select("*")
        .eq("user_id", profile!.id)
        .maybeSingle();
      return prefs;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        area: data.area ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        work_model: data.work_model ?? "",
        contract_type: data.contract_type ?? "",
        salary_range: data.salary_range ?? "",
        matching_enabled: data.matching_enabled,
      });
    }
  }, [data]);

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  if (profile.role === "colaborador" || profile.role === "empresa") {
    return <Navigate to="/painel" />;
  }

  async function save() {
    if (!profile) return;
    const { error } = await supabase.from("employability_preferences").upsert(
      {
        user_id: profile.id,
        area: form.area || null,
        city: form.city || null,
        state: form.state || null,
        work_model: form.work_model || null,
        contract_type: form.contract_type || null,
        salary_range: form.salary_range || null,
        matching_enabled: form.matching_enabled,
      },
      { onConflict: "user_id" },
    );
    if (error) return toast.error(error.message);
    await supabase
      .from("profiles")
      .update({ matching_enabled: form.matching_enabled })
      .eq("id", profile.id);
    queryClient.invalidateQueries();
    toast.success("Preferências salvas.");
  }

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key] as string}
        placeholder={placeholder}
        maxLength={80}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-foreground">
            Preferências de vaga
          </h1>
          <p className="mt-1 text-muted-foreground">
            Você decide se quer receber sugestões e o que a Upgrade considera nelas.
          </p>
        </div>

        <SectionCard
          title="Matching de oportunidades"
          description="Sugestões informativas. Nenhum currículo é enviado sem o seu aceite."
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-brand" />
              <div>
                <p className="text-sm font-semibold text-foreground">Receber sugestões de vagas</p>
                <p className="text-xs text-muted-foreground">
                  Baseado apenas em competências, certificados e preferências declaradas.
                </p>
              </div>
            </div>
            <Switch
              checked={form.matching_enabled}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, matching_enabled: checked }))}
            />
          </div>
        </SectionCard>

        <SectionCard title="Seu interesse profissional">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("area", "Área de interesse", "Tecnologia")}
            {field("work_model", "Modelo de trabalho", "Remoto / Híbrido / Presencial")}
            {field("city", "Cidade", "Recife")}
            {field("state", "Estado", "PE")}
            {field("contract_type", "Tipo de contrato", "CLT / PJ / Estágio")}
            {field("salary_range", "Faixa salarial desejada", "R$ 3.000 - R$ 5.000")}
          </div>
          <Button className="mt-6" onClick={save}>
            Salvar preferências
          </Button>
        </SectionCard>
      </div>
    </AppShell>
  );
}