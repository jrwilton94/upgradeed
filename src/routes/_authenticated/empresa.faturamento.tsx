import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection, MetricStrip } from "@/components/dashboard-workspace";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { hasPermission } from "@/lib/organization";

export const Route = createFileRoute("/_authenticated/empresa/faturamento")({
  head: () => ({
    meta: [
      { title: "Licenças e faturamento — Upgrade Educação" },
      { name: "description", content: "Licenças contratadas, assinatura e pagamentos da empresa." },
      { property: "og:title", content: "Licenças e faturamento — Upgrade Educação" },
      { property: "og:description", content: "Licenças e pagamentos da empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BillingPage,
});

type Billing = {
  seats_used: number;
  subscription: {
    status: string;
    cycle: string | null;
    seats: number | null;
    amount_cents: number | null;
    plan: string | null;
    current_period_end: string | null;
  } | null;
  payments: {
    amount_cents: number;
    status: string;
    method: string | null;
    paid_at: string | null;
    description: string | null;
  }[];
};
const brl = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);

function BillingPage() {
  const org = useOrganization();
  const allowed = org.type === "empresa" && hasPermission(org.data, "faturamento");
  const { data, isLoading, error } = useQuery({
    queryKey: ["company-billing", org.id],
    enabled: Boolean(allowed && org.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("company_billing", { _company: org.id as string });
      if (error) throw error;
      return data as unknown as Billing;
    },
  });
  if (!org.profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={org.profile.role} userName={org.profile.full_name}>
      {!allowed ? (
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      ) : (
        <div className="workspace-shell">
          <WorkspaceHeader
            icon={CreditCard}
            eyebrow="Empresa / Financeiro"
            title="Licenças e faturamento."
            subtitle="Assinatura, licenças em uso e pagamentos"
          />
          {isLoading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : error || !data ? (
            <p role="alert" className="text-destructive">
              Não foi possível carregar o faturamento.
            </p>
          ) : (
            <>
              <MetricStrip
                items={[
                  { label: "Licenças em uso", value: data.seats_used, icon: CreditCard },
                  {
                    label: "Licenças contratadas",
                    value: data.subscription?.seats ?? "—",
                    icon: CreditCard,
                  },
                  {
                    label: "Valor da assinatura",
                    value:
                      data.subscription?.amount_cents != null
                        ? brl(data.subscription.amount_cents)
                        : "—",
                    icon: CreditCard,
                  },
                ]}
              />
              <WorkspaceSection title="Assinatura">
                {!data.subscription ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma assinatura registrada para esta empresa.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {data.subscription.plan ?? "Plano"} · {data.subscription.status}
                    {data.subscription.cycle ? ` · ciclo ${data.subscription.cycle}` : ""}
                    {data.subscription.current_period_end
                      ? ` · período até ${new Date(data.subscription.current_period_end).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                )}
              </WorkspaceSection>
              <WorkspaceSection title="Pagamentos" count={data.payments.length}>
                {!data.payments.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
                ) : (
                  data.payments.map((p, i) => (
                    <div
                      key={i}
                      className="workspace-row flex flex-wrap justify-between gap-2 text-sm"
                    >
                      <span>
                        {p.description ?? "Pagamento"} · {p.method ?? "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {brl(p.amount_cents)} · {p.status}
                        {p.paid_at ? ` · ${new Date(p.paid_at).toLocaleDateString("pt-BR")}` : ""}
                      </span>
                    </div>
                  ))
                )}
              </WorkspaceSection>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
