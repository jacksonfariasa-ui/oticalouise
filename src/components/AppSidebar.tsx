import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, Eye } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

function Item({ to, active, children, onNav }: { to: string; active: boolean; children: React.ReactNode; onNav: () => void }) {
  const cls = cn(
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
    active && "bg-sidebar-accent text-sidebar-primary font-semibold",
  );
  if (to === "/") return <Link to="/" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "otica-zap") return <Link to="/otica-zap" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "clientes") return <Link to="/clientes" className={cls} onClick={onNav}>{children}</Link>;
  return <Link to="/modulo/$slug" params={{ slug: to }} className={cls} onClick={onNav}>{children}</Link>;
}

export function AppSidebar({ onNav }: { onNav: () => void }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState<string | null>(null);
  const isActive = (slug: string) =>
    slug === "" ? pathname === "/" : slug === "otica-zap" || slug === "clientes" ? pathname === `/${slug}` : pathname === `/modulo/${slug}`;

  return (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Eye className="h-5 w-5" /></div>
        <div><div className="font-bold leading-tight">Visão Ótica</div><div className="text-xs opacity-60">Gestão para óticas</div></div>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((n) => {
          const Icon = n.icon;
          if (!n.children) return (
            <li key={n.label}><Item to={n.slug || "/"} active={isActive(n.slug)} onNav={onNav}><Icon className="h-4 w-4 shrink-0" />{n.label}</Item></li>
          );
          const expanded = open === n.label || n.children.some((c) => isActive(c.slug));
          return (
            <li key={n.label}>
              <button onClick={() => setOpen(open === n.label ? null : n.label)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
                <Icon className="h-4 w-4 shrink-0" /><span className="flex-1 text-left">{n.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-300", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <ul className="overflow-hidden pl-7">
                  {n.children.map((c) => (
                    <li key={c.slug}><Item to={c.slug} active={isActive(c.slug)} onNav={onNav}><span className="text-xs">{c.label}</span></Item></li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
