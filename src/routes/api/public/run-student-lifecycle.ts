import { createFileRoute } from "@tanstack/react-router";

/**
 * Fallback da rotina diária do Estudante (avisos, migração ao Perfil Geral) para ambientes sem pg_cron.
 * Exige o segredo STUDENT_LIFECYCLE_SECRET no cabeçalho "x-cron-secret". Sem o segredo configurado, recusa.
 */
export const Route = createFileRoute("/api/public/run-student-lifecycle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STUDENT_LIFECYCLE_SECRET;
        const given = request.headers.get("x-cron-secret");
        if (!secret || !given || given !== secret)
          return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("run_student_lifecycle");
        if (error) return new Response("Lifecycle failed", { status: 500 });
        return Response.json(data);
      },
    },
  },
});
