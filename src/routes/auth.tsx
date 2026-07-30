import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode === "signup" ? "signup" : search.mode === "reset" ? "reset" : "login") as
      | "login"
      | "signup"
      | "reset",
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Upgrade Educação" },
      {
        name: "description",
        content: "Acesse sua conta na Upgrade Educação e continue construindo suas competências.",
      },
      { property: "og:title", content: "Entrar — Upgrade Educação" },
      { property: "og:description", content: "Login, cadastro e recuperação de senha." },
    ],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  password: z.string().min(6, { message: "A senha deve ter ao menos 6 caracteres" }).max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "reset") {
        const parsed = z.string().trim().email().safeParse(email);
        if (!parsed.success) throw new Error("Informe um e-mail válido");
        const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
        toast.success("Enviamos um link de recuperação para o seu e-mail.");
        return;
      }

      const parsed = credentialsSchema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      if (mode === "signup") {
        if (fullName.trim().length < 2) throw new Error("Informe seu nome completo");
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Confirme seu e-mail para ativar a conta.");
          return;
        }
        navigate({ to: "/onboarding" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      navigate({ to: "/painel" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/painel" });
  }

  const title =
    mode === "signup" ? "Crie sua conta" : mode === "reset" ? "Recuperar senha" : "Bem-vindo de volta";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 lg:flex">
        <div className="rounded-xl bg-background/95 px-4 py-3 w-fit">
          <Logo />
        </div>
        <div>
          <p className="font-display text-4xl leading-tight font-extrabold text-primary-foreground">
            Aprendizado que vira oportunidade.
          </p>
          <p className="mt-4 max-w-md text-primary-foreground/70">
            Competências verificadas que alimentam um motor de empregabilidade responsável,
            transparente e centrado em você.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          A plataforma apenas recomenda oportunidades. A decisão é sempre sua.
        </p>
      </div>

      <div className="flex flex-col justify-center px-5 py-14 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "reset"
              ? "Enviaremos um link para você definir uma nova senha."
              : "Use seu e-mail ou continue com o Google."}
          </p>

          {sent ? (
            <div className="mt-8 rounded-xl border border-brand/50 bg-brand-soft p-5 text-sm text-foreground">
              Verifique sua caixa de entrada — enviamos as instruções para <b>{email}</b>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={120}
                    placeholder="João da Silva"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="voce@email.com"
                  required
                />
              </div>
              {mode !== "reset" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={72}
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {mode === "signup"
                  ? "Criar conta"
                  : mode === "reset"
                    ? "Enviar link de recuperação"
                    : "Entrar"}
              </Button>
            </form>
          )}

          {mode !== "reset" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleIcon /> Continuar com Google
              </Button>
            </>
          )}

          <div className="mt-8 space-y-2 text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                <p>
                  Não tem conta?{" "}
                  <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-brand">
                    Cadastre-se
                  </Link>
                </p>
                <p>
                  <Link to="/auth" search={{ mode: "reset" }} className="font-semibold text-brand">
                    Esqueci minha senha
                  </Link>
                </p>
              </>
            )}
            {mode !== "login" && (
              <p>
                Já tem conta?{" "}
                <Link to="/auth" search={{ mode: "login" }} className="font-semibold text-brand">
                  Entrar
                </Link>
              </p>
            )}
            <p>
              <Link to="/" className="hover:text-foreground">
                ← Voltar para a home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4h6.6c-.1 1.1-.9 2.8-2.5 4l3.8 2.9c2.3-2.1 3.6-5.2 3.6-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5H1.2v3.1C3.2 21.3 7.3 24 12 24Z"
      />
      <path fill="#FBBC05" d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3 .8 3.7 1.4l2.7-2.6C16.9 1.9 14.2.8 12 .8 7.3.8 3.2 3.5 1.2 7.4l4 3.1c1-2.9 3.6-5.7 6.8-5.7Z"
      />
    </svg>
  );
}