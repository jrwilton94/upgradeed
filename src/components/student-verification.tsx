import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceSection } from "@/components/dashboard-workspace";
export function StudentVerification({ userId }: { userId: string }) {
  const qc = useQueryClient(); const [file, setFile] = useState<File | null>(null); const [busy,setBusy] = useState(false);
  const { data } = useQuery({ queryKey: ["student-verifications",userId], queryFn: async () => {
    const { data,error } = await supabase.from("student_verifications").select("*").eq("user_id",userId).order("submitted_at",{ascending:false}); if(error) throw error; return data ?? [];
  }});
  const latest=data?.[0]; const expired=latest?.status === "validado" && (!latest.valid_until || new Date(latest.valid_until).getTime()<=Date.now());
  async function upload() { if(!file || busy) return; if(file.size>10*1024*1024 || !["application/pdf","image/jpeg","image/png"].includes(file.type)) return toast.error("Envie PDF, JPG ou PNG de até 10 MB."); setBusy(true);
    try { const extension=file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg"; const path=`${userId}/estudante/${crypto.randomUUID()}.${extension}`;
      const uploaded=await supabase.storage.from("student-declarations").upload(path,file,{contentType:file.type}); if(uploaded.error) throw uploaded.error;
      const {error}=await supabase.rpc("submit_student_verification",{_file:path}); if(error) throw error; await qc.invalidateQueries(); toast.success("Declaração enviada para validação."); setFile(null);
    } catch { toast.error("Não foi possível enviar a declaração."); } finally {setBusy(false);} }
  return <WorkspaceSection title="Vínculo para horas complementares"><div className="flex gap-3"><FileCheck className="size-5 shrink-0 text-brand"/><div><p className="text-sm font-semibold">{expired ? "Vínculo expirado" : latest ? {pendente:"Declaração em análise",validado:"Vínculo validado",recusado:"Declaração recusada",expirado:"Vínculo expirado"}[latest.status] : "Declaração necessária para emitir horas complementares"}</p>{latest?.rejection_reason && <p className="mt-2 text-sm text-destructive">{latest.rejection_reason}</p>}{latest?.valid_until && <p className="mt-2 text-xs text-muted-foreground">Validade: {new Date(latest.valid_until).toLocaleDateString("pt-BR")}</p>}<p className="mt-3 text-sm text-muted-foreground">Seu aprendizado e as oportunidades continuam disponíveis. A declaração é acessível somente aos validadores autorizados.</p></div></div>{(!latest || latest.status === "recusado" || expired || latest.status === "expirado") && <div className="mt-5 space-y-3"><Label htmlFor="declaration">Declaração de matrícula ou documento equivalente</Label><Input id="declaration" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]??null)}/><Button onClick={upload} disabled={!file||busy}><Upload className="size-4"/>{busy ? "Enviando…" : "Enviar declaração"}</Button></div>}</WorkspaceSection>;
}