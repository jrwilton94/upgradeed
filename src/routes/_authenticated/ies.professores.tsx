import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection } from "@/components/dashboard-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { hasPermission } from "@/lib/organization";

export const Route = createFileRoute("/_authenticated/ies/professores")({
  head: () => ({
    meta: [
      { title: "Professores vinculados — Upgrade Educação" },
      { name: "description", content: "Professores vinculados à instituição." },
      { property: "og:title", content: "Professores vinculados — Upgrade Educação" },
      { property: "og:description", content: "Vínculo de professores à instituição." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const org = useOrganization();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed =
    org.type === "ies" &&
    hasPermission(org.data, "professores") &&
    (org.data?.owner || (org.data?.scope_ids.length ?? 0) === 0);
  const { data } = useQuery({
    queryKey: ["ies-teachers", org.id],
    enabled: Boolean(allowed && org.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ies_list_teachers", {
        _institution: org.id as string,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ok);
    setEmail("");
    await qc.invalidateQueries({ queryKey: ["ies-teachers"] });
  }
  if (!org.profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={org.profile.role} userName={org.profile.full_name}>
      {!allowed ? (
        <p className="text-muted-foreground">Acesso não autorizado.</p>
      ) : (
        <div className="workspace-shell">
          <WorkspaceHeader
            icon={Users}
            eyebrow="Instituição / Docentes"
            title="Professores vinculados."
            subtitle="O cadastro de professores é feito pela equipe Upgrade; aqui você vincula contas existentes"
          />
          <WorkspaceSection title="Vincular professor">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    supabase.rpc("ies_link_teacher", {
                      _institution: org.id as string,
                      _email: email,
                    }),
                  "Professor vinculado.",
                );
              }}
            >
              <div className="min-w-56 flex-1">
                <Label htmlFor="teacher-email">E-mail do professor</Label>
                <Input
                  id="teacher-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy || !email}>
                <UserPlus className="size-4" />
                Vincular
              </Button>
            </form>
          </WorkspaceSection>
          <WorkspaceSection title="Professores" count={data?.length ?? 0}>
            {!data?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum professor vinculado.</p>
            ) : (
              data.map((t) => (
                <div
                  key={t.link_id}
                  className="workspace-row flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{t.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.email} · {t.status} · desde{" "}
                      {new Date(t.linked_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {t.status === "ativo" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => supabase.rpc("ies_unlink_teacher", { _link: t.link_id }),
                          "Vínculo removido.",
                        )
                      }
                    >
                      <UserMinus className="size-4" />
                      Remover vínculo
                    </Button>
                  )}
                </div>
              ))
            )}
          </WorkspaceSection>
        </div>
      )}
    </AppShell>
  );
}
