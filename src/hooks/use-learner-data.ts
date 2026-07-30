import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LearnerData = Awaited<ReturnType<typeof fetchLearnerData>>;

export async function fetchLearnerData(userId: string) {
  const [enrollmentsRes, certificatesRes, prefsRes, behavioralRes, notificationsRes] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("*, courses(id, title, slug, hours, level, course_skills(skills(name)))")
        .eq("user_id", userId),
      supabase.from("certificates").select("*, courses(title, slug)").eq("user_id", userId),
      supabase.from("employability_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("behavioral_tests").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const enrollments = enrollmentsRes.data ?? [];
  const completed = enrollments.filter((e) => e.progress >= 100);
  const skills = Array.from(
    new Set(
      completed.flatMap(
        (e) => e.courses?.course_skills?.map((cs) => cs.skills?.name).filter(Boolean) ?? [],
      ),
    ),
  ) as string[];
  const hours = completed.reduce((sum, e) => sum + (e.courses?.hours ?? 0), 0);

  return {
    enrollments,
    completed,
    skills,
    hours,
    certificates: certificatesRes.data ?? [],
    preferences: prefsRes.data ?? null,
    behavioral: behavioralRes.data ?? null,
    notifications: notificationsRes.data ?? [],
  };
}

export function useLearnerData(userId?: string | null) {
  return useQuery({
    queryKey: ["learner", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchLearnerData(userId as string),
  });
}

export function useOpenJobs() {
  return useQuery({
    queryKey: ["open-jobs"],
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