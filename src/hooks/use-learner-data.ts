import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";

export type LearnerData = Awaited<ReturnType<typeof fetchLearnerData>>;

export async function fetchLearnerData(userId: string) {
  const [
    enrollmentsRes,
    certificatesRes,
    prefsRes,
    behavioralRes,
    notificationsRes,
    competenciesRes,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, courses(id, title, slug, hours, level, course_skills(skills(name)))")
      .eq("user_id", userId),
    supabase
      .from("certificates")
      .select("*, courses(title, slug), course_modules(title)")
      .eq("user_id", userId),
    supabase.from("employability_preferences").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("behavioral_tests")
      .select("*")
      .eq("user_id", userId)
      .order("taken_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("my_competencies"),
  ]);

  const enrollments = enrollmentsRes.data ?? [];
  const completed = enrollments.filter((e) => e.progress >= 100);
  const competencies = competenciesRes.data ?? [];
  const skills = competencies.map((c) => c.name);
  const hours = (certificatesRes.data ?? []).reduce((sum, e) => sum + e.hours, 0);

  return {
    enrollments,
    completed,
    skills,
    hours,
    certificates: certificatesRes.data ?? [],
    preferences: prefsRes.data ?? null,
    competencies,
    tests: behavioralRes.data ?? [],
    behavioral: (behavioralRes.data ?? []).find((t) => t.test_type === "comportamental") ?? null,
    notifications: notificationsRes.data ?? [],
  };
}

export function useLearnerData(userId?: string | null) {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["learner", userId, profile?.role],
    enabled: Boolean(userId && ["estudante", "geral", "colaborador"].includes(profile?.role ?? "")),
    queryFn: () => {
      if (!userId) throw new Error("Usuário indisponível");
      return fetchLearnerData(userId);
    },
  });
}

export function useOpenJobs() {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["open-jobs", profile?.role, profile?.matching_enabled],
    enabled: Boolean(
      profile &&
      (profile.role === "colaborador" ||
        (["estudante", "geral"].includes(profile.role ?? "") && profile.matching_enabled)),
    ),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, companies(name)")
        .eq("status", "aberta")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
/** Sugestões geradas pelo motor único do servidor (tabela matches); nenhum cálculo é feito no navegador. */
export function useMatchSuggestions() {
  const { data: profile } = useProfile();
  return useQuery({
    queryKey: ["match-suggestions", profile?.id, profile?.role, profile?.matching_enabled],
    enabled: Boolean(
      profile && ["estudante", "geral"].includes(profile.role ?? "") && profile.matching_enabled,
    ),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, jobs(id, title, modality, area, companies(name))")
        .eq("status", "sugerida")
        .order("score", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
