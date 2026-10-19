import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import type { OrganizationAccess, OrganizationType } from "@/lib/organization";

export function useOrganization() {
  const { data: profile } = useProfile();
  const type: OrganizationType | null = profile?.role === "empresa" ? "empresa" : profile?.role === "ies" ? "ies" : null;
  const id = type === "empresa" ? profile?.company_id : type === "ies" ? profile?.institution_id : null;
  const query = useQuery({
    queryKey: ["organization-access", profile?.id, type, id], enabled: Boolean(type && id), staleTime: 0,
    queryFn: async () => {
      if (!id || !type) return null;
      const { data, error } = await supabase.rpc("organization_access", { _id: id, _type: type });
      if (error) throw error;
      return data as unknown as OrganizationAccess;
    },
  });
  return { ...query, id, type, profile };
}