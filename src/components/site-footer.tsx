import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

const NAV = [
  { to: "/plataforma", label: "A plataforma" },
  { to: "/cursos", label: "Cursos" },
  { to: "/contato", label: "Contato" },
  { to: "/trabalhe-conosco", label: "Trabalhe conosco" },
] as const;

const LEGAL = [
  { to: "/lgpd", label: "LGPD" },
  { to: "/aia", label: "AIA" },
  { to: "/privacidade", label: "Política de Privacidade" },
  { to: "/termos", label: "Termos" },
  { to: "/faq", label: "Perguntas Frequentes" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Hub de Skills Intelligence. A plataforma apenas recomenda oportunidades — nunca contrata
            e nunca elimina candidatos.
          </p>
          <a
            href="https://www.linkedin.com/company/upgrade-educacao"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-block text-sm font-medium text-brand hover:underline"
          >
            LinkedIn
          </a>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Navegar</p>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
          <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Transparência</p>
          {LEGAL.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/70 px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Upgrade Educação · Conformidade com a LGPD e princípios do PL
        2338/2023
      </div>
    </footer>
  );
}