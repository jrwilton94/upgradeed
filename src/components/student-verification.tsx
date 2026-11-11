import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSection } from "@/components/dashboard-workspace";

type StudentStatus = {
  role: string;
  can_return: boolean;
  eligible?: boolean;
  deadline?: string | null;
  validated?: boolean;
  pending?: boolean;
  partner_institution?: boolean;
  institution_name?: string | null;
  verification?: {
    status: string;
    submitted_at: string;
    valid_until: string | null;
    rejection_reason: string | null;
  } | null;
};

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

/** A declaração comprova apenas a elegibilidade ao Perfil Estudante; não condiciona certificados. */
export function StudentVerification({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["student-status", userId],
    queryFn: async () => {
      await supabase.rpc("claim_student_invites");
      const { data, error } = await supabase.rpc("student_status");
      if (error) throw error;
      return data as unknown as StudentStatus;
    },
  });

  async function upload() {
    if (!file || busy) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
    ) {
      return toast.error("Envie PDF, JPG ou PNG de até 10 MB.");
    }
    setBusy(true);
    try {
      const extension =
        file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `${userId}/estudante/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage
        .from("student-declarations")
        .upload(path, file, { contentType: file.type });
      if (uploaded.error) throw uploaded.error;
      const { error } = await supabase.rpc("submit_student_verification", { _file: path });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success("Declaração enviada para validação.");
      setFile(null);
    } catch {
      toast.error("Não foi possível enviar a declaração.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !data) return <p className="text-muted-foreground">Carregando…</p>;
  if (data.role === "geral" && !data.can_return) {
    return (
      <WorkspaceSection title="Vínculo estudantil">
        <p className="text-sm text-muted-foreground">
          O Perfil Geral não exige declaração de matrícula. Seus cursos, certificados e sugestões de
          vagas já estão disponíveis.
        </p>
      </WorkspaceSection>
    );
  }
  const v = data.verification;
  const canSend = !data.pending && !data.validated;
  const headline = data.validated
    ? "Vínculo estudantil validado"
    : data.pending
      ? "Declaração em análise"
      : data.role === "geral"
        ? "Você está no Perfil Geral"
        : "Envie sua declaração de matrícula";

  return (
    <WorkspaceSection title="Vínculo estudantil">
      <div className="flex gap-3">
        <FileCheck className="size-5 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-semibold">{headline}</p>
          {data.role === "estudante" && data.deadline && (
            <p className="mt-2 text-sm text-muted-foreground">
              {data.validated ? "Validade do vínculo" : "Prazo para enviar e validar a declaração"}:{" "}
              {fmt(data.deadline)}.
              {!data.validated &&
                " Depois dessa data seu histórico continua salvo e sua conta passa ao Perfil Geral."}
            </p>
          )}
          {data.role === "geral" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Seu histórico de cursos, certificados, horas e competências foi mantido. Envie uma
              nova declaração para voltar ao Perfil Estudante.
            </p>
          )}
          {v?.status === "recusado" && v.rejection_reason && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              Declaração recusada: {v.rejection_reason}. Você pode enviar uma nova.
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            A declaração serve apenas para comprovar que você pode usar o Perfil Estudante. Cursos,
            certificados com horas e sugestões de vagas não dependem dela. Ela é acessível somente a
            quem valida o vínculo.
          </p>
        </div>
      </div>
      {canSend && (
        <div className="mt-5 space-y-3">
          <Label htmlFor="declaration">
            Declaração de matrícula ou documento equivalente (PDF, JPG ou PNG, até 10 MB)
          </Label>
          <Input
            id="declaration"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button onClick={upload} disabled={!file || busy}>
            <Upload className="size-4" />
            {busy ? "Enviando…" : "Enviar declaração"}
          </Button>
        </div>
      )}
    </WorkspaceSection>
  );
}
