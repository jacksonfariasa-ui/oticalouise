import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CHAVE_ATIVIDADES, type Atividade } from "@/lib/atividades";
import { savedListOptions } from "@/lib/saved-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/AppSidebar";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início — Ótica Louise" },
      { name: "description", content: "Atalhos para as áreas do sistema da ótica." },
      { property: "og:title", content: "Início — Ótica Louise" },
      { property: "og:description", content: "Atalhos para as áreas do sistema da ótica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return <SellerHome />;
}

function SellerHome() {
  const { nome, acessos, role } = useAuth();
  const buttons = useMemo(() => NAV.flatMap((n) =>
    n.children
      ? n.children.filter((c) => canAccess(role, c.slug, acessos)).map((c) => ({ label: c.label, slug: c.slug, icon: n.icon }))
      : n.slug && canAccess(role, n.slug, acessos) ? [{ label: n.label, slug: n.slug, icon: n.icon }] : [],
  ), [role, acessos]);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Olá, {nome}</h1><p className="text-sm text-muted-foreground">Escolha o que deseja fazer</p></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {buttons.map((b) => {
          const Icon = b.icon;
          return (
            <Item key={b.slug} to={b.slug} active={false} onNav={() => {}}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center text-sm font-semibold shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
              {b.label}
            </Item>
          );
        })}
      </div>
      {(role === "admin" || role === "gerente") && <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}><Atividades /></Suspense>}
    </div>
  );
}

function Atividades() {
  const { data: lista } = useSuspenseQuery({ ...savedListOptions<Atividade>(CHAVE_ATIVIDADES, []), staleTime: 15_000, refetchInterval: 15_000, refetchIntervalInBackground: false });
  const [todas, setTodas] = useState(false);
  const vis = todas ? lista : lista.slice(0, 8);
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="font-semibold">Atividades recentes</div>
        <div className="text-xs text-muted-foreground">{lista.length} registros</div>
      </div>
      {vis.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p> : (
        <ul className="divide-y text-sm">
          {vis.map((a, i) => (
            <li key={a.quando + i} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2">
              <span className="min-w-0">{a.texto}</span>
              <span className="text-xs text-muted-foreground">{a.quem} · {new Date(a.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
            </li>
          ))}
        </ul>
      )}
      {lista.length > 8 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTodas(!todas)}>{todas ? "Ver menos" : "Ver todas"}</Button>}
    </Card>
  );
}
