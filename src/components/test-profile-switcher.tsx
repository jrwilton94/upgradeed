import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES, type ProfileRole } from "@/lib/profiles";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TestProfileSwitcher({ role }: { role?: ProfileRole | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { data: access } = useQuery({
    queryKey: ["test-profile-access"],
    queryFn: async () => {
      const { data, error } = await supabase.from("test_profile_access").select("role");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!access?.length) return null;

  async function switchProfile(value: string) {
    const next = PROFILES.find((item) => item.role === value);
    if (!next || busy) return;
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.rpc("switch_test_profile", { _role: next.role });
      if (error) throw error;
      await queryClient.invalidateQueries();
      await router.invalidate();
      await navigate({ to: "/painel" });
      toast.success(`Perfil ${next.label} ativado`);
    } catch {
      toast.error("Não foi possível trocar o perfil de teste.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/50 px-5 py-3">
      <Label htmlFor="test-profile">Perfil de teste</Label>
      <Select value={role ?? undefined} onValueChange={switchProfile} disabled={busy}>
        <SelectTrigger id="test-profile" className="w-48"><SelectValue placeholder="Selecionar perfil" /></SelectTrigger>
        <SelectContent>
          {PROFILES.filter((item) => access.some((entry) => entry.role === item.role)).map((item) => (
            <SelectItem key={item.role} value={item.role}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}