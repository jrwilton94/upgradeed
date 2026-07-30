import { Link } from "@tanstack/react-router";
import logoHorizontal from "@/assets/upgrade-logo-horizontal.png.asset.json";
import logoIcon from "@/assets/upgrade-icon.jpg.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("inline-flex items-center", className)}>
      <img
        src={logoHorizontal.url}
        alt="Upgrade Educação"
        className="h-9 w-auto dark:hidden"
        width={220}
        height={64}
      />
      <span className="hidden items-center gap-2 dark:flex">
        <img src={logoIcon.url} alt="" className="size-9 rounded-full bg-white p-0.5" />
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          UPGRADE <span className="font-medium text-brand">EDUCAÇÃO</span>
        </span>
      </span>
    </Link>
  );
}