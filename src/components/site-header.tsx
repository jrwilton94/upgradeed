import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINKS = [
  { to: "/plataforma", label: "A plataforma" },
  { to: "/cursos", label: "Cursos" },
] as const;

const FOR_YOU = [
  { to: "/para/estudante", label: "Estudante" },
  { to: "/para/usuario-geral", label: "Profissional" },
  { to: "/para/colaborador", label: "Colaborador" },
] as const;

const FOR_BUSINESS = [
  { to: "/para/empresa", label: "Sou empresa" },
  { to: "/para/professor", label: "Sou professor" },
  { to: "/para/ies", label: "Sou IES" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground">
              Para você
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {FOR_YOU.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground">
              Para empresas
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {FOR_BUSINESS.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            to="/contato"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Contato
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth" search={{ mode: "login" }}>
              Entrar
            </Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/auth" search={{ mode: "signup" }}>
              Começar agora
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto p-6">
              <div className="mt-8 flex flex-col gap-1">
                {LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <p className="mt-3 px-3 text-xs font-semibold text-muted-foreground uppercase">
                  Para você
                </p>
                {FOR_YOU.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <p className="mt-3 px-3 text-xs font-semibold text-muted-foreground uppercase">
                  Para empresas
                </p>
                {FOR_BUSINESS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/contato"
                  className="mt-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Contato
                </Link>
                <Button asChild className="mt-4">
                  <Link to="/auth" search={{ mode: "login" }}>
                    Entrar / Criar conta
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}