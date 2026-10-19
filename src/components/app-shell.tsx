import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Briefcase,
  BadgeDollarSign,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { profileByRole, type ProfileRole } from "@/lib/profiles";
import { useIsAdmin } from "@/hooks/use-plans";
import { TestProfileSwitcher } from "@/components/test-profile-switcher";
import { useOrganization } from "@/hooks/use-organization";
import { hasPermission } from "@/lib/organization";

type NavItem = { to: LinkProps["to"]; label: string; icon: LucideIcon };

function navForRole(role?: ProfileRole | null): NavItem[] {
  const base: NavItem[] = [{ to: "/painel", label: "Painel", icon: LayoutDashboard }];
  const learning: NavItem[] = [
    { to: "/meus-cursos", label: "Meus cursos", icon: BookOpen },
    { to: "/certificados", label: "Certificados", icon: Award },
    { to: "/cursos", label: "Catálogo", icon: LibraryBig },
  ];
  switch (role) {
    case "estudante":
    case "geral":
      return [
        ...base,
        ...learning,
        { to: "/preferencias", label: "Preferências de vaga", icon: Settings2 },
      ];
    case "colaborador":
      return [...base, ...learning];
    case "professor":
      return [...base, { to: "/cursos", label: "Catálogo", icon: LibraryBig }];
    case "ies":
      return [...base, { to: "/cursos", label: "Catálogo", icon: LibraryBig }];
    case "empresa":
      return [...base, { to: "/vagas", label: "Vagas", icon: Briefcase }];
    default:
      return base;
  }
}

export function AppShell({
  children,
  role,
  userName,
}: {
  children: ReactNode;
  role?: ProfileRole | null;
  userName?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const organization = useOrganization();
  const items = [
    ...navForRole(role).filter(item => item.to !== "/vagas" || hasPermission(organization.data, "vagas_internas") || hasPermission(organization.data, "vagas_externas")),
    ...(hasPermission(organization.data, "subperfis") ? [{ to: "/organizacao/acessos" as LinkProps["to"], label: "Subperfis", icon: Settings2 }] : []),
    ...(isAdmin
      ? [{ to: "/gestao" as LinkProps["to"], label: "Gestão", icon: BadgeDollarSign }]
      : []),
  ];
  const definition = profileByRole(role);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-4">
            <Logo to="/painel" />
            {definition && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {definition.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <TestProfileSwitcher role={role} />

      <div className="mx-auto flex w-full max-w-7xl gap-8 px-5 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-brand-soft text-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground"
                activeProps={{ className: "border-brand bg-brand-soft text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-brand" />}
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}