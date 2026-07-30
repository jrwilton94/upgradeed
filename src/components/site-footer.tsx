import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Hub de Skills Intelligence. A plataforma apenas recomenda oportunidades — nunca contrata
            e nunca elimina candidatos.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/plataforma" className="hover:text-foreground">
            A plataforma
          </Link>
          <Link to="/cursos" className="hover:text-foreground">
            Cursos
          </Link>
          <Link to="/ia" className="hover:text-foreground">
            Como funciona nossa IA
          </Link>
          <Link to="/auth" className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
      </div>
      <div className="border-t border-border/70 px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Upgrade Educação · Conformidade com a LGPD e princípios do PL
        2338/2023
      </div>
    </footer>
  );
}