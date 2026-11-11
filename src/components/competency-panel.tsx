import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceSection, WorkspaceEmpty } from "@/components/dashboard-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export type Competency = {
  skill_id: string;
  name: string;
  level: number;
  origin: string;
  verified: boolean;
};
type TestResult = {
  test_type: string;
  profile_label: string | null;
  result: unknown;
  taken_at?: string;
};
type TestDef = {
  type: string;
  title: string;
  questions: { q: string; options?: string[] }[];
  scale: string | null;
};

const ORIGIN: Record<string, string> = {
  curso: "Curso concluído",
  teste: "Teste",
  historico: "Histórico acadêmico",
};
const TESTS = [
  { type: "comportamental", label: "Teste comportamental" },
  { type: "raciocinio", label: "Raciocínio lógico" },
  { type: "vocacional", label: "Teste vocacional", onlyMedio: true },
] as const;

/** Barras de competência (origem e verificação), testes de perfil pontuados no servidor e envio do histórico acadêmico. */
export function CompetencyPanel({
  competencies,
  tests,
  educationLevel,
  userId,
  role,
}: {
  competencies: Competency[];
  tests: TestResult[];
  educationLevel?: string | null;
  userId: string;
  role: "estudante" | "geral" | "colaborador";
}) {
  return (
    <>
      <WorkspaceSection title="Mapa de competências" count={competencies.length}>
        {!competencies.length ? (
          <WorkspaceEmpty
            icon={Sparkles}
            title="Competências ainda não registradas"
            text="As competências dos cursos aprovados, dos testes e do histórico acadêmico aparecem aqui."
          />
        ) : (
          <ul className="space-y-4">
            {competencies.map((c) => (
              <li key={`${c.skill_id}-${c.origin}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ORIGIN[c.origin] ?? c.origin}
                    {c.verified ? " · verificada" : " · autodeclarada/indicativa"} · {c.level}%
                  </span>
                </div>
                <Progress
                  value={c.level}
                  className="mt-2 h-1.5"
                  aria-label={`${c.name}: ${c.level}%`}
                />
              </li>
            ))}
          </ul>
        )}
      </WorkspaceSection>
      <ProfileTests tests={tests} educationLevel={educationLevel} />
      <AcademicHistory userId={userId} role={role} />
    </>
  );
}

function ProfileTests({
  tests,
  educationLevel,
}: {
  tests: TestResult[];
  educationLevel?: string | null;
}) {
  const qc = useQueryClient();
  const [def, setDef] = useState<TestDef | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  async function open(type: string) {
    const { data, error } = await supabase.rpc("get_profile_test", { _type: type });
    if (error) return toast.error(error.message);
    const d = data as unknown as TestDef;
    setDef(d);
    setAnswers(new Array(d.questions.length).fill(-1));
  }
  async function submit() {
    if (!def) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("submit_profile_test", {
      _type: def.type,
      _answers: answers,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Resultado registrado: ${(data as unknown as { label: string }).label}.`);
    setDef(null);
    await qc.invalidateQueries();
  }

  const latest = (type: string) => tests.find((t) => t.test_type === type);
  return (
    <WorkspaceSection title="Testes de perfil">
      {!def ? (
        <ul className="space-y-3">
          {TESTS.filter((t) => !("onlyMedio" in t) || educationLevel === "medio").map((t) => {
            const done = latest(t.type);
            return (
              <li
                key={t.type}
                className="workspace-row flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Brain className="size-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {done
                        ? `Último resultado: ${done.profile_label ?? "registrado"}`
                        : "Ainda não realizado"}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => open(t.type)}>
                  {done ? "Refazer" : "Realizar"}
                </Button>
              </li>
            );
          })}
          <li className="text-xs text-muted-foreground">
            Os testes geram indicadores de competência usados apenas para sugerir vagas. Não usamos
            raça, gênero, idade, religião ou saúde.
          </li>
        </ul>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-5"
        >
          <h3 className="font-semibold">{def.title}</h3>
          {def.scale && <p className="text-xs text-muted-foreground">{def.scale}</p>}
          {def.questions.map((q, i) => (
            <fieldset key={i} className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                {i + 1}. {q.q}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(q.options ?? ["1", "2", "3", "4", "5"]).map((o, n) => {
                  const value = q.options ? n : n + 1;
                  return (
                    <label
                      key={n}
                      className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={`t-${i}`}
                        checked={answers[i] === value}
                        onChange={() => setAnswers((a) => a.map((x, k) => (k === i ? value : x)))}
                      />
                      {o}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="flex gap-3">
            <Button type="submit" disabled={busy || answers.some((a) => a < 0)}>
              {busy ? "Enviando…" : "Enviar respostas"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDef(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </WorkspaceSection>
  );
}

function AcademicHistory({ userId, role }: { userId: string; role: string }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function upload() {
    if (!file || busy) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    )
      return toast.error("Envie PDF, JPG ou PNG de até 10 MB.");
    setBusy(true);
    try {
      const ext =
        file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `${userId}/${role}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("academic-history")
        .upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.rpc("register_academic_document", { _path: path });
      if (error) throw error;
      toast.success("Histórico guardado de forma privada.");
      setFile(null);
      await qc.invalidateQueries();
    } catch {
      toast.error("Não foi possível enviar o histórico.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceSection title="Histórico acadêmico (opcional)">
      <p className="text-sm text-muted-foreground">
        Envie seu histórico para enriquecer o mapa de competências. O arquivo fica privado: só você
        o acessa. A leitura automática ainda não está disponível; enquanto isso o arquivo é apenas
        guardado e nenhuma competência é inferida. O arquivo pode conter dados pessoais, que nunca
        são extraídos nem usados.
      </p>
      <div className="mt-4 space-y-3">
        <Label htmlFor="academic-history">PDF, JPG ou PNG, até 10 MB</Label>
        <Input
          id="academic-history"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button onClick={upload} disabled={!file || busy}>
          <Upload className="size-4" />
          {busy ? "Enviando…" : "Enviar histórico"}
        </Button>
      </div>
    </WorkspaceSection>
  );
}
