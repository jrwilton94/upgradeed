import type { ReactNode } from "react";
import { useIsAdmin } from "@/hooks/use-plans";

export function AdminGate({ children }: { children: ReactNode }) {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <h1 className="font-display text-xl font-bold text-foreground">Área restrita</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva do time de gestão da Upgrade. Fale com um administrador para receber acesso.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
