import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionCard } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/vagas/nova")({
  component: NewJobPage,
});

function NewJobPage() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    area: "",
    description: "",
    required_skills: "",
    desired_skills: "",
    modality: "Remoto",
    contract_type: "CLT",
    seniority: "Júnior",
    city: "",
    state: "",
    salary_range: "",
  });
  const [loading, setLoading] = useState(false);

  if (!profile) return <p className="p-10 text-muted-foreground">Carregando…</p>;
  if (profile.role !== "empresa") return <Navigate to="/painel" />;

  async function submit() {
    if (!profile?.company_id) return toast.error("Empresa não vinculada ao perfil.");
    if (form.title.trim().length < 3 || form.description.trim().length < 10) {
      return toast.error("Preencha título e descrição da vaga.");
    }
    setLoading(true);
    const { error } = await supabase.from("jobs").insert({
      company_id: profile.company_id,
      title: form.title.trim(),
      area: form.area.trim() || "Geral",
      description: form.description.trim(),
      required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      desired_skills: form.desired_skills.split(",").map((s) => s.trim()).filter(Boolean),
      modality: form.modality,
      contract_type: form.contract_type,
      seniority: form.seniority,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      salary_range: form.salary_range.trim() || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Vaga publicada!");
    navigate({ to: "/vagas" });
  }

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        maxLength={160}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      <div className="max-w-2xl space-y-6">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Publicar vaga</h1>
        <SectionCard
          title="Dados da vaga"
          description="Descreva competências, não perfis pessoais. Dados sensíveis não são usados no matching."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {field("title", "Título", "Analista de Dados Jr.")}
            {field("area", "Área", "Tecnologia")}
            {field("required_skills", "Competências obrigatórias", "SQL, Excel")}
            {field("desired_skills", "Competências desejáveis", "Power BI")}
            {field("modality", "Modalidade", "Remoto")}
            {field("contract_type", "Contrato", "CLT")}
            {field("seniority", "Senioridade", "Júnior")}
            {field("salary_range", "Faixa salarial", "R$ 3.000 - R$ 4.500")}
            {field("city", "Cidade", "Recife")}
            {field("state", "Estado", "PE")}
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={5}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <Button className="mt-6" onClick={submit} disabled={loading}>
            Publicar vaga
          </Button>
        </SectionCard>
      </div>
    </AppShell>
  );
}