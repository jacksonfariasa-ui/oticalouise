import { createFileRoute, Outlet, redirect, useLocation, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, ShieldX, Clock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth";
import { canAccess, roleLabel, slugFromPath } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import logo from "@/assets/otica-louise.jpg.asset.json";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppLayout,
});

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, loading, acessos } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  if (!role) return <Pending />;

  const allowed = canAccess(role, slugFromPath(pathname), acessos);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <AppSidebar onNav={() => setMobileOpen(false)} />
      </aside>
      {mobileOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
          <button aria-label="Abrir menu" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
          <img src={logo.url} alt="Logo Ótica Louise" className="h-8 w-8 rounded-full object-cover" /><span className="font-bold">Ótica Louise</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          {allowed ? <Outlet /> : (
            <div className="mx-auto mt-16 max-w-md rounded-xl border bg-card p-8 text-center">
              <ShieldX className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="mt-4 text-lg font-bold">Acesso não permitido</h1>
              <p className="mt-2 text-sm text-muted-foreground">O perfil <b>{roleLabel(role)}</b> não tem acesso a esta área. Fale com o administrador se precisar.</p>
              <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Voltar ao painel</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Pending() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-lg font-bold">Aguardando liberação</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sua conta foi criada, mas ainda não tem um perfil de acesso. Peça ao administrador da ótica para liberar.</p>
        <button onClick={() => supabase.auth.signOut().then(() => location.assign("/auth"))} className="mt-6 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"><LogOut className="h-4 w-4" />Sair</button>
      </div>
    </div>
  );
}
