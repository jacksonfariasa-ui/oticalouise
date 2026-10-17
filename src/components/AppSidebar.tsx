import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut } from "lucide-react";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { canAccess, roleLabel } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/otica-louise.jpg.asset.json";

const LENTES = ["lentes-monofocais", "lentes-multifocais", "lentes-de-contato", "tratamentos"];

function Item({ to, active, children, onNav }: { to: string; active: boolean; children: React.ReactNode; onNav: () => void }) {
  const cls = cn(
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
    active && "bg-sidebar-accent text-sidebar-primary font-semibold",
  );
  if (to === "/") return <Link to="/" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "otica-zap") return <Link to="/otica-zap" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "clientes") return <Link to="/clientes" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "promocoes") return <Link to="/promocoes" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "produtos") return <Link to="/produtos" className={cls} onClick={onNav}>{children}</Link>;
  if (to === "administracao") return <Link to="/usuarios" className={cls} onClick={onNav}>{children}</Link>;
  if (LENTES.includes(to)) return <Link to="/lentes/$tipo" params={{ tipo: to }} className={cls} onClick={onNav}>{children}</Link>;
  return <Link to="/modulo/$slug" params={{ slug: to }} className={cls} onClick={onNav}>{children}</Link>;
}

export function AppSidebar({ onNav }: { onNav: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { role, nome } = useAuth();
  const [open, setOpen] = useState<string | null>(null);
  const isActive = (slug: string) =>
    slug === "" ? pathname === "/"
      : slug === "administracao" ? pathname === "/usuarios"
      : ["otica-zap", "clientes", "produtos", "promocoes"].includes(slug) ? pathname === `/${slug}`
      : LENTES.includes(slug) ? pathname === `/lentes/${slug}` : pathname === `/modulo/${slug}`;

  const items = NAV.map((n) => (n.children ? { ...n, children: n.children.filter((c) => canAccess(role, c.slug)) } : n))
    .filter((n) => (n.children ? n.children.length > 0 : canAccess(role, n.slug)));

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-sidebar-border"><img src={logo.url} alt="Logo Ótica Louise" className="h-full w-full rounded-full object-cover" /></div>
        <div className="min-w-0"><div className="truncate font-bold leading-tight">Ótica Louise</div><div className="text-xs opacity-60">Gestão para óticas</div></div>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((n) => {
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
      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-bold">{(nome || "?").charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{nome}</div><div className="text-xs opacity-60">{roleLabel(role)}</div></div>
        <button aria-label="Sair" title="Sair" onClick={sair} className="rounded p-2 hover:bg-sidebar-accent"><LogOut className="h-4 w-4" /></button>
      </div>
    </nav>
  );
}
