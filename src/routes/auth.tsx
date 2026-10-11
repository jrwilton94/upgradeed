import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { PROFILES, type ProfileRole } from "@/lib/profiles";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [testRoles, setTestRoles] = useState<ProfileRole[]>([]);

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
      const { data: access } = await supabase.from("test_profile_access").select("role");
      if (access && access.length > 0) {
        setTestRoles(access.map((a) => a.role as ProfileRole));
        return;
      }
      navigate({ to: "/painel" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir");
    } finally {
      setLoading(false);
    }
  }

  async function chooseProfile(role: ProfileRole) {
    setLoading(true);
    const { error } = await supabase.rpc("switch_test_profile", { _role: role });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar nesse perfil.");
      return;
    }
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
              : "Use seu e-mail e senha."}
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

          <Dialog open={testRoles.length > 0} onOpenChange={() => {}}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Em qual perfil deseja entrar?</DialogTitle>
                <DialogDescription>Selecione o perfil para acessar a plataforma.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROFILES.filter((p) => testRoles.includes(p.role)).map((p) => (
                  <Button key={p.role} variant="outline" className="h-11" disabled={loading} onClick={() => chooseProfile(p.role)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

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
