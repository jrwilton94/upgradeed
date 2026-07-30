import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeDollarSign, Building2, Landmark, Users } from "lucide-react";
import { AppShell, SectionCard, StatCard } from "@/components/app-shell";
import { AdminGate } from "@/components/admin-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { formatBRL } from "@/lib/plan-content";

export const Route = createFileRoute("/_authenticated/gestao/")({
  head: () => ({
    meta: [
      { title: "Gestão — receita e pagamentos | Upgrade Educação" },
      {
        name: "description",
        content: "Painel de gestão da Upgrade Educação: receita, assinaturas e pagamentos.",
      },
      { property: "og:title", content: "Gestão — receita e pagamentos" },
      { property: "og:description", content: "Receita, assinaturas e pagamentos da Upgrade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GestaoPage,
});

function GestaoPage() {
  const { data: profile } = useProfile();
  return (
    <AppShell role={profile?.role} userName={profile?.full_name}>
      <AdminGate>
        <GestaoContent />
      </AdminGate>
    </AppShell>
  );
}

function GestaoContent() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("pix");

  const { data } = useQuery({
    queryKey: ["gestao-financeiro"],
    queryFn: async () => {
      const [payments, subscriptions, companies, institutions, profiles] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("subscriptions").select("*, plans(name, audience)"),
        supabase.from("companies").select("id"),
        supabase.from("institutions").select("id"),
        supabase.from("profiles").select("id, role"),
      ]);
      return {
        payments: payments.data ?? [],
        subscriptions: subscriptions.data ?? [],
        companies: companies.data ?? [],
        institutions: institutions.data ?? [],
        profiles: profiles.data ?? [],
      };
    },
  });

  const register = useMutation({
    mutationFn: async () => {
      const cents = Math.round(Number(amount.replace(",", ".")) * 100);
      if (!cents || cents <= 0) throw new Error("Informe um valor válido");
      const { error } = await supabase.from("payments").insert({
        amount_cents: cents,
        description: description || "Receita avulsa",
        method,
        status: "pago",
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pagamento registrado");
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["gestao-financeiro"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("payments")
        .update({ status, paid_at: status === "pago" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gestao-financeiro"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const payments = data?.payments ?? [];
  const paid = payments.filter((p) => p.status === "pago");
  const revenue = paid.reduce((sum, p) => sum + p.amount_cents, 0);
  const pending = payments
    .filter((p) => p.status !== "pago")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  const teachers = (data?.profiles ?? []).filter((p) => p.role === "professor").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Gestão Upgrade</h1>
        <p className="text-sm text-muted-foreground">
          Receita, assinaturas e cadastros institucionais da plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita recebida" value={formatBRL(revenue)} icon={BadgeDollarSign} />
        <StatCard label="A receber" value={formatBRL(pending)} icon={BadgeDollarSign} />
        <StatCard label="Empresas" value={data?.companies.length ?? 0} icon={Building2} />
        <StatCard label="IES" value={data?.institutions.length ?? 0} icon={Landmark} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assinaturas" value={data?.subscriptions.length ?? 0} />
        <StatCard label="Professores" value={teachers} icon={Users} />
        <StatCard label="Usuários" value={data?.profiles.length ?? 0} icon={Users} />
      </div>

      <SectionCard
        title="Registrar pagamento"
        description="Lance manualmente uma receita recebida ou uma cobrança em aberto."
        action={
          <Button asChild variant="outline">
            <Link to="/gestao/cadastros">Cadastros</Link>
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1490,00" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="IES Essencial — Faculdade X"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="method">Método</Label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="pix">Pix</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
        </div>
        <Button className="mt-4" onClick={() => register.mutate()} disabled={register.isPending}>
          Registrar
        </Button>
      </SectionCard>

      <SectionCard title="Pagamentos recentes" description="Últimos 50 lançamentos.">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.method} · {new Date(payment.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold">{formatBRL(payment.amount_cents)}</span>
                  <Badge variant={payment.status === "pago" ? "default" : "secondary"}>
                    {payment.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toggleStatus.mutate({
                        id: payment.id,
                        status: payment.status === "pago" ? "pendente" : "pago",
                      })
                    }
                  >
                    {payment.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
