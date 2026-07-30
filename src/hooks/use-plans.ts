import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PlanRow } from "@/lib/plan-content";
import type { ProfileRole } from "@/lib/profiles";

export function usePlans(audience?: ProfileRole) {
  return useQuery({
    queryKey: ["plans", audience ?? "all"],
    queryFn: async () => {
      let query = supabase.from("plans").select("*").eq("active", true).order("position");
      if (audience) query = query.eq("audience", audience);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return (data ?? []).length > 0;
    },
  });
}
