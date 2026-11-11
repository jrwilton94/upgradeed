import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Send, Pause, BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { WorkspaceHeader, WorkspaceSection } from "@/components/dashboard-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useOrganization } from "@/hooks/use-organization";
import { useIsAdmin } from "@/hooks/use-plans";
import { hasPermission } from "@/lib/organization";
type ModuleDraft = {
  title: string;
  hours: number;
  game: { question: string; answer: string }[];
  questions: { question: string; options: string[]; answer: number }[];
  minimum_score: number;
  lessons: { title: string; duration_min: number; position: number; video_path: string }[];
};
const blankModule = (): ModuleDraft => ({
  title: "",
  hours: 1,
  game: [{ question: "", answer: "" }],
  questions: [{ question: "", options: ["", ""], answer: 0 }],
  minimum_score: 70,
  lessons: Array.from({ length: 4 }, (_, i) => ({
    title: "",
    duration_min: 15,
    position: i + 1,
    video_path: "",
  })),
});
export const Route = createFileRoute("/_authenticated/conteudo")({
  head: () => ({
    meta: [
      { title: "Estúdio de conteúdo — Upgrade Educação" },
      {
        name: "description",
        content: "Cursos, módulos, aulas, fixação e avaliação dos autores autorizados.",
      },
      { property: "og:title", content: "Estúdio de conteúdo — Upgrade Educação" },
      { property: "og:description", content: "Gestão de conteúdo e revisão de publicação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentPage,
});
function ContentPage() {
  const { data: profile } = useProfile();
  const org = useOrganization();
  const { data: admin } = useIsAdmin();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState<ModuleDraft[]>([blankModule()]);
  const [scope, setScope] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = profile?.role === "professor" || hasPermission(org.data, "conteudo");
  const reviewer = admin && ["estudante", "geral"].includes(profile?.role ?? "");
  const { data } = useQuery({
    queryKey: ["author-content", profile?.id, profile?.role, org.id],
    enabled: Boolean(allowed || reviewer),
    queryFn: async () => {
      let query = supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (reviewer) query = query.eq("status", "em_avaliacao");
      else if (profile?.role === "professor")
        query = query.eq("instructor_id", profile.id).is("institution_id", null);
      else if (org.id) query = query.eq("institution_id", org.id);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: scopes } = useQuery({
    queryKey: ["content-scopes", org.id],
    enabled: Boolean(org.id),
    queryFn: async () => {
      if (!org.id) return [];
      const { data } = await supabase
        .from("organization_scopes")
        .select("*")
        .eq("organization_id", org.id);
      return data ?? [];
    },
  });
  async function save() {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("save_course_content", {
        _course: null as unknown as string,
        _payload: { title, description, scope_id: scope || null, modules },
      });
      if (error) throw error;
      setTitle("");
      setDescription("");
      setModules([blankModule()]);
      await qc.invalidateQueries();
      toast.success("Rascunho salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, value: string) {
    const { error } = await supabase.rpc("course_action", { _course: id, _action: value });
    if (error) return toast.error(error.message);
    await qc.invalidateQueries();
    toast.success("Conteúdo atualizado.");
  }
  function update(i: number, patch: Partial<ModuleDraft>) {
    setModules((ms) => ms.map((m, n) => (n === i ? { ...m, ...patch } : m)));
  }
  if (!profile) return <p className="p-8">Carregando…</p>;
  return (
    <AppShell role={profile.role} userName={profile.full_name}>
      {!allowed && !reviewer ? (
        <p>Acesso não autorizado.</p>
      ) : (
        <div className="workspace-shell">
          <WorkspaceHeader
            icon={BookOpen}
            eyebrow="Autoria / Cursos & módulos"
            title={reviewer ? "Revisão de conteúdos." : "Seu estúdio de conteúdo."}
            subtitle="Publicação com avaliação e revisão"
          />
          <WorkspaceSection
            title={reviewer ? "Em avaliação" : "Seus conteúdos"}
            count={data?.length ?? 0}
          >
            {!data?.length && (
              <p className="text-sm text-muted-foreground">Nenhum conteúdo cadastrado.</p>
            )}
            {data?.map((c) => (
              <article className="workspace-row" key={c.id}>
                <p className="font-semibold">{c.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.status} · {c.hours}h
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewer ? (
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Confirmar revisão de formato, resolução, áudio, duração, fixação e avaliação?",
                          )
                        )
                          action(c.id, "approve");
                      }}
                    >
                      <Check className="size-4" />
                      Aprovar publicação
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        disabled={c.published}
                        onClick={() => action(c.id, "submit")}
                      >
                        <Send className="size-4" />
                        Enviar para avaliação
                      </Button>
                      <Button variant="ghost" onClick={() => action(c.id, "suspend")}>
                        <Pause className="size-4" />
                        Suspender
                      </Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </WorkspaceSection>
          {allowed && (
            <WorkspaceSection title="Novo curso">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  save();
                }}
              >
                <div>
                  <Label htmlFor="course-title">Título</Label>
                  <Input
                    id="course-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={3}
                    maxLength={160}
                  />
                </div>
                <div>
                  <Label htmlFor="course-description">Descrição</Label>
                  <Textarea
                    id="course-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={3000}
                  />
                </div>
                {org.type === "ies" && (
                  <div>
                    <Label htmlFor="content-scope">Curso ou campus</Label>
                    <select
                      id="content-scope"
                      className="h-10 w-full rounded-md border border-input bg-background px-3"
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                    >
                      <option value="">Toda a instituição</option>
                      {scopes?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {modules.map((m, i) => (
                  <fieldset key={i} className="space-y-4 border-t border-border pt-6">
                    <legend className="text-lg font-semibold">Módulo {i + 1}</legend>
                    <Label>Título do módulo</Label>
                    <Input
                      aria-label={`Título módulo ${i + 1}`}
                      value={m.title}
                      onChange={(e) => update(i, { title: e.target.value })}
                      required
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          update(i, {
                            lessons: Array.from({ length: 4 }, (_, n) => ({
                              title: m.lessons[n]?.title ?? "",
                              duration_min: 15,
                              position: n + 1,
                              video_path: m.lessons[n]?.video_path ?? "",
                            })),
                          })
                        }
                      >
                        4 aulas × 15 min
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          update(i, {
                            lessons: Array.from({ length: 6 }, (_, n) => ({
                              title: m.lessons[n]?.title ?? "",
                              duration_min: 10,
                              position: n + 1,
                              video_path: m.lessons[n]?.video_path ?? "",
                            })),
                          })
                        }
                      >
                        6 aulas × 10 min
                      </Button>
                    </div>
                    {m.lessons.map((l, n) => (
                      <div className="grid gap-3 sm:grid-cols-2" key={n}>
                        <Input
                          aria-label={`Módulo ${i + 1} aula ${n + 1} título`}
                          placeholder={`Aula ${n + 1}`}
                          value={l.title}
                          required
                          onChange={(e) =>
                            update(i, {
                              lessons: m.lessons.map((v, k) =>
                                k === n ? { ...v, title: e.target.value } : v,
                              ),
                            })
                          }
                        />
                        <Input
                          aria-label={`Módulo ${i + 1} aula ${n + 1} vídeo`}
                          type="url"
                          placeholder="Endereço HTTPS do vídeo"
                          value={l.video_path}
                          required
                          onChange={(e) =>
                            update(i, {
                              lessons: m.lessons.map((v, k) =>
                                k === n ? { ...v, video_path: e.target.value } : v,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                    <h3 className="font-semibold">Jogo de fixação</h3>
                    <Input
                      aria-label={`Fixação ${i + 1} pergunta`}
                      placeholder="Pergunta para revisão"
                      required
                      value={m.game[0].question}
                      onChange={(e) =>
                        update(i, { game: [{ ...m.game[0], question: e.target.value }] })
                      }
                    />
                    <Input
                      aria-label={`Fixação ${i + 1} resposta`}
                      placeholder="Resposta comentada"
                      required
                      value={m.game[0].answer}
                      onChange={(e) =>
                        update(i, { game: [{ ...m.game[0], answer: e.target.value }] })
                      }
                    />
                    <h3 className="font-semibold">Avaliação</h3>
                    {m.questions.map((q, n) => (
                      <div key={n} className="space-y-2">
                        <Input
                          aria-label={`Questão ${i + 1}-${n + 1}`}
                          placeholder="Questão"
                          required
                          value={q.question}
                          onChange={(e) =>
                            update(i, {
                              questions: m.questions.map((v, k) =>
                                k === n ? { ...v, question: e.target.value } : v,
                              ),
                            })
                          }
                        />
                        {q.options.map((o, k) => (
                          <div className="flex gap-2 items-center" key={k}>
                            <input
                              aria-label={`Alternativa correta ${i + 1}-${n + 1}-${k + 1}`}
                              type="radio"
                              name={`correct-${i}-${n}`}
                              checked={q.answer === k}
                              onChange={() =>
                                update(i, {
                                  questions: m.questions.map((v, j) =>
                                    j === n ? { ...v, answer: k } : v,
                                  ),
                                })
                              }
                            />
                            <Input
                              aria-label={`Alternativa ${i + 1}-${n + 1}-${k + 1}`}
                              required
                              value={o}
                              placeholder={`Alternativa ${k + 1}`}
                              onChange={(e) =>
                                update(i, {
                                  questions: m.questions.map((v, j) =>
                                    j === n
                                      ? {
                                          ...v,
                                          options: v.options.map((a, b) =>
                                            b === k ? e.target.value : a,
                                          ),
                                        }
                                      : v,
                                  ),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        update(i, {
                          questions: [
                            ...m.questions,
                            { question: "", options: ["", ""], answer: 0 },
                          ],
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Questão
                    </Button>
                    <div>
                      <Label>Nota mínima (%)</Label>
                      <Input
                        aria-label={`Nota mínima módulo ${i + 1}`}
                        type="number"
                        min={1}
                        max={100}
                        value={m.minimum_score}
                        onChange={(e) => update(i, { minimum_score: Number(e.target.value) })}
                      />
                    </div>
                  </fieldset>
                ))}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModules((ms) => [...ms, blankModule()])}
                  >
                    <Plus className="size-4" />
                    Adicionar módulo
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Salvando…" : "Salvar rascunho"}
                  </Button>
                </div>
              </form>
            </WorkspaceSection>
          )}
        </div>
      )}
    </AppShell>
  );
}
