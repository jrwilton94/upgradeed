import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Save, Pause, UserMinus, ArrowRightLeft, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection } from "@/components/dashboard-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/use-organization";
import { hasPermission, ORGANIZATION_PERMISSIONS } from "@/lib/organization";
import type { Tables, Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/organizacao/acessos")({ head: () => ({ meta: [
  { title: "Subperfis e auditoria — Upgrade Educação" }, { name: "description", content: "Gestão autorizada de acessos, escopos e auditoria da organização." },
  { property: "og:title", content: "Subperfis e auditoria — Upgrade Educação" }, { property: "og:description", content: "Permissões e gestão de acessos organizacionais." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: AccessPage });
const empty = { full_name: "", email: "", function_title: "", permissions: [] as string[], scope_ids: [] as string[] };
function AccessPage() {
  const org = useOrganization(); const qc = useQueryClient();
  const [form, setForm] = useState(empty); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const [scopeName, setScopeName] = useState(""); const [scopeKind, setScopeKind] = useState("departamento");
  const [person, setPerson] = useState(""); const [action, setAction] = useState(""); const [from, setFrom] = useState(""); const [until, setUntil] = useState("");
  const allowed = hasPermission(org.data, "subperfis");
  const { data } = useQuery({ queryKey: ["organization-members", org.id, org.type], enabled: Boolean(org.id && org.type && allowed), queryFn: async () => {
    if (!org.id || !org.type) return null;
    const [members, scopes, logs] = await Promise.all([
      supabase.from("organization_memberships").select("*").eq("organization_id", org.id).eq("organization_type", org.type).order("created_at"),
      supabase.from("organization_scopes").select("*").eq("organization_id", org.id).eq("organization_type", org.type),
      org.data?.owner ? supabase.from("activity_logs").select("*").eq("organization_id", org.id).eq("organization_type", org.type).order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
    ]); if (members.error || scopes.error) throw members.error || scopes.error;
    return { members: members.data ?? [], scopes: scopes.data ?? [], logs: logs.data ?? [] };
  }});
  async function mutate(kind: string, payload: Json) {
    if (!org.id || !org.type || busy) return; setBusy(true);
    try { const { error } = await supabase.rpc("manage_organization_access", { _id: org.id, _type: org.type, _action: kind, _payload: payload });
      if (error) throw error; await qc.invalidateQueries(); setEditing(false); setScopeName(""); toast.success("Acesso atualizado.");
    } catch(e) { toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o acesso."); } finally { setBusy(false); }
  }
  function edit(m: Tables<"organization_memberships">) { setForm({ full_name: m.full_name, email: m.email, function_title: m.function_title, permissions: m.permissions, scope_ids: m.scope_ids }); setEditing(true); }
  if (!org.profile) return <p className="p-8 text-muted-foreground">Carregando…</p>;
  return <AppShell role={org.profile.role} userName={org.profile.full_name}>
    {!allowed ? <p className="text-muted-foreground">Acesso não autorizado.</p> : <div className="workspace-shell">
      <WorkspaceHeader icon={ShieldCheck} eyebrow="Organização / Controle de acesso" title="Pessoas, permissões e confiança." subtitle="Subperfis da organização" action={<Button onClick={() => { setForm(empty); setEditing(true); }}><Plus className="size-4" />Novo subperfil</Button>} />
      <WorkspaceSection title="Subperfis" count={data?.members.length ?? 0}>
        {!data?.members.length && <p className="py-5 text-sm text-muted-foreground">Nenhum subperfil cadastrado.</p>}
        {data?.members.map(m => <article key={m.id} className="workspace-row"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{m.full_name}</h3><p className="text-sm text-muted-foreground">{m.email} · {m.function_title || "Sem função"}</p><p className="mt-2 text-xs text-muted-foreground">{m.scope_ids.length ? m.scope_ids.map(id => data.scopes.find(s => s.id === id)?.name ?? "Escopo restrito").join(", ") : "Toda a organização"} · Último acesso: {m.last_access_at ? new Date(m.last_access_at).toLocaleString("pt-BR") : "Ainda não acessou"}</p></div><Badge variant="secondary">{m.status}</Badge></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => edit(m)}><Save className="size-4" />Editar</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => mutate("suspend", { id: m.id })}><Pause className="size-4" />Suspender</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (window.confirm(`Remover o acesso de ${m.full_name}?`)) mutate("remove", { id: m.id }); }}><UserMinus className="size-4" />Remover</Button>{org.data?.owner && m.status === "ativo" && <Button variant="outline" size="sm" onClick={() => { if (window.confirm(`Transferir a titularidade para ${m.full_name}?`)) mutate("transfer", { user_id: m.user_id }); }}><ArrowRightLeft className="size-4" />Transferir titularidade</Button>}</div></article>)}
      </WorkspaceSection>
      {org.data?.owner && <WorkspaceSection title="Escopos"><div className="flex flex-wrap gap-2 mb-5">{data?.scopes.map(s => <Badge variant="secondary" key={s.id}>{s.kind}: {s.name}</Badge>)}</div><form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={e => { e.preventDefault(); mutate("scope", { name: scopeName, kind: scopeKind }); }}><div><Label htmlFor="scope-name">Nome</Label><Input id="scope-name" value={scopeName} onChange={e => setScopeName(e.target.value)} required minLength={2} maxLength={120} /></div><div><Label htmlFor="scope-kind">Tipo</Label><select id="scope-kind" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={scopeKind} onChange={e => setScopeKind(e.target.value)}>{(org.type === "empresa" ? ["departamento", "unidade", "centro de custo"] : ["curso", "campus", "centro"]).map(v => <option key={v}>{v}</option>)}</select></div><Button type="submit" className="self-end" disabled={busy}><Plus className="size-4" />Adicionar</Button></form></WorkspaceSection>}
      {org.data?.owner && <WorkspaceSection title="Log de auditoria"><div className="grid gap-3 sm:grid-cols-4"><Input aria-label="Filtrar pessoa" placeholder="Pessoa (ID)" value={person} onChange={e => setPerson(e.target.value)} /><Input aria-label="Filtrar ação" placeholder="Ação" value={action} onChange={e => setAction(e.target.value)} /><Input aria-label="Data inicial" type="date" value={from} onChange={e => setFrom(e.target.value)} /><Input aria-label="Data final" type="date" value={until} onChange={e => setUntil(e.target.value)} /></div>{data?.logs.filter(l => (!person || l.user_id.includes(person)) && (!action || l.action.includes(action)) && (!from || l.created_at.slice(0,10) >= from) && (!until || l.created_at.slice(0,10) <= until)).map(l => <div className="workspace-row" key={l.id}><p className="text-sm font-medium">{l.action}</p><p className="text-xs text-muted-foreground">{data.members.find(m => m.user_id === l.user_id)?.full_name ?? "Titular"} · {new Date(l.created_at).toLocaleString("pt-BR")} · {l.entity}</p></div>)}</WorkspaceSection>}
      <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle><Users className="mr-2 inline size-5" />Subperfil</DialogTitle></DialogHeader><form onSubmit={e => { e.preventDefault(); mutate("save", form); }} className="space-y-4">{([['full_name','Nome'],['email','E-mail da conta existente'],['function_title','Cargo ou função']] as const).map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type={key === "email" ? "email" : "text"} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key !== "function_title"} maxLength={160} /></div>)}<div className="space-y-3">{org.type && ORGANIZATION_PERMISSIONS[org.type].filter(([key]) => hasPermission(org.data,key)).map(([key,label]) => <div key={key} className="flex items-center justify-between gap-3"><Label htmlFor={`perm-${key}`}>{label}</Label><Switch id={`perm-${key}`} checked={form.permissions.includes(key)} onCheckedChange={v => setForm(f => ({ ...f, permissions: v ? [...f.permissions,key] : f.permissions.filter(p => p !== key) }))} /></div>)}</div><fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Escopo</legend>{data?.scopes.map(s => <div className="flex items-center gap-2" key={s.id}><Checkbox id={s.id} checked={form.scope_ids.includes(s.id)} onCheckedChange={v => setForm(f => ({ ...f, scope_ids: v ? [...f.scope_ids,s.id] : f.scope_ids.filter(id => id !== s.id) }))} /><Label htmlFor={s.id}>{s.name}</Label></div>)}</fieldset><Button disabled={busy} type="submit"><Save className="size-4" />Salvar acesso</Button></form></DialogContent></Dialog>
    </div>}
  </AppShell>;
}