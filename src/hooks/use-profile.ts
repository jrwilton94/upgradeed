import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: created, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: auth.user.id,
          email: auth.user.email,
          full_name:
            (auth.user.user_metadata?.full_name as string) ??
            auth.user.email?.split("@")[0] ??
            "Novo usuário",
        })
        .select()
        .single();
      if (insertError) throw insertError;
      return created;
    },
  });

  return { ...query, refresh: () => queryClient.invalidateQueries({ queryKey: ["profile"] }) };
}