import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionCard } from "@/components/app-shell";
import { AdminGate } from "@/components/admin-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/gestao/cadastros")({
  head: () => ({
    meta: [
      { title: "Gestão — cadastros | Upgrade Educação" },
      {
        name: "description",
        content: "Cadastre empresas, instituições de ensino e professores parceiros da Upgrade.",
      },
      { property: "og:title", content: "Gestão — cadastros" },
      { property: "og:description", content: "Cadastro de empresas, IES e professores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CadastrosPage,
});

function CadastrosPage() {
  const { data: profile } = useProfile();
  return (
    <AppShell role={profile?.role} userName={profile?.full_name}>
      <AdminGate>
        <CadastrosContent />
      </AdminGate>
    </AppShell>
  );
}

function CadastrosContent() {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [iesName, setIesName] = useState("");
  const [iesCity, setIesCity] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["gestao-cadastros"],
    queryFn: async () => {
      const [companies, institutions, teachers] = await Promise.all([
        supabase.from("companies").select("*").order("created_at", { ascending: false }),
        supabase.from("institutions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email, role").eq("role", "professor"),
      ]);
      return {
        companies: companies.data ?? [],
        institutions: institutions.data ?? [],
        teachers: teachers.data ?? [],
      };
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["gestao-cadastros"] });
  }

  const createCompany = useMutation({
    mutationFn: async () => {
      if (companyName.trim().length < 2) throw new Error("Informe o nome da empresa");
      const code = `${companyName.trim().slice(0, 4).toUpperCase().replace(/\s/g, "")}${Math.floor(1000 + Math.random() * 8999)}`;
      const { error } = await supabase
        .from("companies")
        .insert({ name: companyName.trim(), code, industry: industry || null });
      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      toast.success(`Empresa cadastrada. Código de vínculo: ${code}`);
      setCompanyName("");
      setIndustry("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createInstitution = useMutation({
    mutationFn: async () => {
      if (iesName.trim().length < 2) throw new Error("Informe o nome da instituição");
      const { error } = await supabase
        .from("institutions")
        .insert({ name: iesName.trim(), city: iesCity || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Instituição cadastrada");
      setIesName("");
      setIesCity("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const promoteTeacher = useMutation({
    mutationFn: async () => {
      const email = teacherEmail.trim().toLowerCase();
      if (!email) throw new Error("Informe o e-mail do professor");
      const { data: found } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!found) throw new Error("Nenhuma conta encontrada com este e-mail. Peça o cadastro primeiro.");
      const { error } = await supabase.from("profiles").update({ role: "professor" }).eq("id", found.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Professor habilitado");
      setTeacherEmail("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Cadastros</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre empresas, instituições de ensino e habilite professores parceiros.
        </p>
      </div>

      <SectionCard title="Nova empresa" description="Um código de vínculo é gerado para os colaboradores.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="company">Nome</Label>
            <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Setor</Label>
            <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" onClick={() => createCompany.mutate()} disabled={createCompany.isPending}>
          Cadastrar empresa
        </Button>
        <div className="mt-5 divide-y divide-border">
          {(data?.companies ?? []).map((company) => (
            <div key={company.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">{company.name}</span>
              <Badge variant="secondary">{company.code}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Nova instituição (IES)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ies">Nome</Label>
            <Input id="ies" value={iesName} onChange={(e) => setIesName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={iesCity} onChange={(e) => setIesCity(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => createInstitution.mutate()}
          disabled={createInstitution.isPending}
        >
          Cadastrar IES
        </Button>
        <div className="mt-5 divide-y divide-border">
          {(data?.institutions ?? []).map((ies) => (
            <div key={ies.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">{ies.name}</span>
              <span className="text-xs text-muted-foreground">{ies.city ?? "—"}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Professores parceiros"
        description="Habilite uma conta já existente como professor pelo e-mail."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1 space-y-1.5">
            <Label htmlFor="teacher">E-mail</Label>
            <Input
              id="teacher"
              type="email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
          </div>
          <Button onClick={() => promoteTeacher.mutate()} disabled={promoteTeacher.isPending}>
            Habilitar professor
          </Button>
        </div>
        <div className="mt-5 divide-y divide-border">
          {(data?.teachers ?? []).map((teacher) => (
            <div key={teacher.id} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">{teacher.full_name}</span>
              <span className="text-xs text-muted-foreground">{teacher.email}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
