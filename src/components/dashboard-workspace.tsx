import type { ReactNode } from "react";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function WorkspaceHeader({ eyebrow, title, subtitle, icon: Icon, action }: {
  eyebrow: string; title: string; subtitle?: string; icon: LucideIcon; action?: ReactNode;
}) {
  return <header className="workspace-heading">
    <div className="min-w-0">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Icon className="size-4 text-brand" />{eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>;
}

export function MetricStrip({ items }: { items: { label: string; value: string | number; hint?: string; icon: LucideIcon }[] }) {
  return <dl className="workspace-metrics">
    {items.map(({ label, value, hint, icon: Icon }) => <div key={label} className="min-w-0 py-5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4 shrink-0 text-brand" />{label}</dt>
      <dd className="mt-3 break-words font-display text-2xl font-bold text-foreground">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </div>)}
  </dl>;
}

export function WorkspaceSection({ title, count, action, children, className = "" }: {
  title: string; count?: number; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return <section className={`workspace-section ${className}`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">{title}{count !== undefined && <span className="text-sm font-normal text-muted-foreground">/ {count.toString().padStart(2, "0")}</span>}</h2>
      {action}
    </div>
    {children}
  </section>;
}

export function WorkspaceEmpty({ icon: Icon, title, text, to, label }: {
  icon: LucideIcon; title: string; text?: string; to?: LinkProps["to"]; label?: string;
}) {
  return <div className="workspace-empty">
    <Icon className="mb-4 size-7 text-brand" />
    <p className="font-display font-semibold text-foreground">{title}</p>
    {text && <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>}
    {to && label && <Button asChild variant="outline" size="sm" className="mt-5"><Link to={to}>{label}<ArrowUpRight className="size-4" /></Link></Button>}
  </div>;
}

export function ProgressOrbit({ value, label }: { value: number; label: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return <div className="flex items-center gap-5">
    <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`${label}: ${safe}%`}>
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="var(--brand)" strokeWidth="7" pathLength="100" strokeDasharray={`${safe} 100`} strokeLinecap="round" />
      <text x="60" y="65" textAnchor="middle" fill="var(--foreground)" transform="rotate(90 60 60)" fontSize="22" fontWeight="700">{safe}%</text>
    </svg>
    <p className="max-w-44 text-sm text-muted-foreground">{label}</p>
  </div>;
}