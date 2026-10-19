import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CHAVE_ATIVIDADES, type Atividade } from "@/lib/atividades";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownCircle, ArrowUpCircle, Split, ShieldAlert, Cake, PhoneCall, FileWarning, Truck, CalendarClock, PackageMinus,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Item } from "@/components/AppSidebar";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/lib/permissions";
import { useEmpresa } from "@/lib/empresa";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início — Ótica Louise" },
      { name: "description", content: "Atalhos para as áreas do sistema da ótica." },
      { property: "og:title", content: "Início — Ótica Louise" },
      { property: "og:description", content: "Atalhos para as áreas do sistema da ótica." },
    ],
  }),
  component: Dashboard,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DAILY = Array.from({ length: 17 }, (_, i) => ({
  dia: `${String(i + 1).padStart(2, "0")}/10`,
  faturamento: 0,
  despesas: 0,
}));

type Widget = {
  title: string; icon: LucideIcon; tone: "primary" | "destructive" | "warning" | "success";
  value: string; sub?: string; stats?: [string, number][]; action?: string; rows: string[];
};

const WIDGETS: Widget[] = [
  { title: "Contas a Pagar em Aberto", icon: ArrowDownCircle, tone: "destructive", value: brl(0),
    rows: [] },
  { title: "Contas Rateadas em Aberto", icon: Split, tone: "warning", value: brl(0),
    rows: [] },
  { title: "Contas a Receber em Aberto", icon: ArrowUpCircle, tone: "success", value: brl(0),
    rows: [] },
  { title: "Remover Clientes do SPC / Pagar Contas", icon: ShieldAlert, tone: "destructive", value: "0 clientes", action: "Ver clientes",
    rows: [] },
  { title: "Aniversariantes da Semana", icon: Cake, tone: "primary", value: "0 clientes",
    rows: [] },
  { title: "Pós-Vendas do Dia", icon: PhoneCall, tone: "primary", value: "0 contatos", stats: [["No prazo", 0], ["Último dia", 0], ["Atrasados", 0]], action: "Ver Pós-Vendas",
    rows: [] },
  { title: "Receitas Vencidas", icon: FileWarning, tone: "warning", value: "0 receitas",
    rows: [] },
  { title: "Ordens de Serviço a Entregar", icon: Truck, tone: "primary", value: "0 O.S.", stats: [["Hoje", 0], ["Esta semana", 0], ["Atrasadas", 0]],
    rows: [] },
  { title: "Validade de Produtos", icon: CalendarClock, tone: "warning", value: "0 itens", stats: [["Vencidos", 0], ["A vencer", 0]], action: "Listar Produtos",
    rows: [] },
  { title: "Produtos Abaixo do Estoque Mínimo", icon: PackageMinus, tone: "destructive", value: "0", action: "Listar Produtos",
    rows: [] },
];

const TONE = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/10 text-success",
};

function Dashboard() {
  const { role } = useAuth();
  return <SellerHome />;
}

function SellerHome() {
  const { nome, acessos, role } = useAuth();
  const buttons = NAV.flatMap((n) =>
    n.children
      ? n.children.filter((c) => canAccess(role, c.slug, acessos)).map((c) => ({ label: c.label, slug: c.slug, icon: n.icon }))
      : n.slug && canAccess(role, n.slug, acessos) ? [{ label: n.label, slug: n.slug, icon: n.icon }] : [],
  );
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
      {(role === "admin" || role === "gerente") && <Atividades />}
    </div>
  );
}

function Atividades() {
  const [lista, setLista] = useState<Atividade[]>([]);
  const [todas, setTodas] = useState(false);
  useEffect(() => {
    const carregar = () => supabase.from("dados_salvos").select("dados").eq("chave", CHAVE_ATIVIDADES).maybeSingle()
      .then(({ data }) => setLista(data && Array.isArray(data.dados) ? (data.dados as Atividade[]) : []));
    void carregar();
    const t = setInterval(carregar, 15000);
    return () => clearInterval(t);
  }, []);
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
