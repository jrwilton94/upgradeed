import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSection } from "@/components/dashboard-workspace";
import { supabase } from "@/integrations/supabase/client";
import { parseStudentCsv, STUDENT_CSV_TEMPLATE, type StudentCsvRow } from "@/lib/student-csv";

type Summary = {
  accepted: number;
  rejected_count: number;
  rejected: { line: number; email: string; reason: string }[];
  confirmed: boolean;
};

/** Importação em lote de alunos: valida linha a linha e mostra o resumo antes de confirmar. */
export function StudentImport({ institutionId }: { institutionId: string }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<StudentCsvRow[]>([]);
  const [filename, setFilename] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(list: StudentCsvRow[], confirm: boolean) {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("import_student_invites", {
        _institution: institutionId,
        _rows: list as never,
        _filename: filename,
        _confirm: confirm,
      });
      if (error) throw error;
      setSummary(data as unknown as Summary);
      if (confirm) {
        toast.success(
          "Importação confirmada. Os alunos serão vinculados ao criarem a conta com o mesmo e-mail.",
        );
        setRows([]);
        await qc.invalidateQueries();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível processar a planilha.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | null) {
    setSummary(null);
    setRows([]);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("A planilha deve ter até 2 MB.");
    const parsed = parseStudentCsv(await file.text());
    if (parsed.error) return toast.error(parsed.error);
    setFilename(file.name);
    setRows(parsed.rows);
    await run(parsed.rows, false);
  }

  function template() {
    const url = URL.createObjectURL(
      new Blob(["﻿" + STUDENT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-alunos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <WorkspaceSection title="Importar alunos em lote">
      <p className="text-sm text-muted-foreground">
        Envie um arquivo CSV com os alunos que já comprovaram vínculo com a instituição. Quem se
        cadastrar com o mesmo e-mail entra no Perfil Estudante já validado, até a data de validade
        informada. Máximo de 2.000 linhas.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <Label htmlFor="student-csv">Arquivo CSV</Label>
          <Input
            id="student-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="button" variant="outline" onClick={template}>
          <Download className="size-4" />
          Baixar modelo
        </Button>
      </div>
      {summary && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <p className="text-sm font-semibold">
            {summary.confirmed ? "Importação concluída" : "Resumo da validação"}: {summary.accepted}{" "}
            aceitas · {summary.rejected_count} recusadas
          </p>
          {summary.rejected.length > 0 && (
            <ul className="max-h-64 space-y-1 overflow-auto text-sm text-muted-foreground">
              {summary.rejected.map((r) => (
                <li key={`${r.line}-${r.email}`}>
                  Linha {r.line}
                  {r.email ? ` (${r.email})` : ""}: {r.reason}
                </li>
              ))}
            </ul>
          )}
          {!summary.confirmed && summary.accepted > 0 && (
            <Button onClick={() => run(rows, true)} disabled={busy}>
              <FileUp className="size-4" />
              Confirmar importação de {summary.accepted} aluno(s)
            </Button>
          )}
          {!summary.confirmed && summary.accepted === 0 && (
            <p className="text-sm text-destructive">
              Nenhuma linha válida. Corrija a planilha e envie novamente.
            </p>
          )}
        </div>
      )}
    </WorkspaceSection>
  );
}
