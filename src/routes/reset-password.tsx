import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — Upgrade Educação" },
      { name: "description", content: "Escolha uma nova senha para a sua conta Upgrade Educação." },
      { property: "og:title", content: "Definir nova senha — Upgrade Educação" },
      { property: "og:description", content: "Recuperação segura de acesso à sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter ao menos 6 caracteres");
    if (password !== confirm) return toast.error("As senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/painel" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-5">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lift">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold text-foreground">Definir nova senha</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              maxLength={72}
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            Salvar nova senha
          </Button>
        </form>
      </div>
    </div>
  );
}