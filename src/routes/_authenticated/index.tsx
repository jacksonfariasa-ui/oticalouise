import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Painel de Informações — Ótica Louise" },
      { name: "description", content: "Painel gerencial da ótica: faturamento, contas, pós-vendas, O.S. e estoque." },
      { property: "og:title", content: "Painel de Informações — Ótica Louise" },
      { property: "og:description", content: "Painel gerencial da ótica: faturamento, contas, pós-vendas, O.S. e estoque." },
    ],
  }),
  component: Dashboard,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DAILY = Array.from({ length: 17 }, (_, i) => ({
  dia: `${String(i + 1).padStart(2, "0")}/10`,
  faturamento: Math.round(3200 + Math.sin(i / 2) * 1400 + ((i * 937) % 1800)),
  despesas: Math.round(1500 + Math.cos(i / 3) * 600 + ((i * 431) % 700)),
}));

type Widget = {
  title: string; icon: LucideIcon; tone: "primary" | "destructive" | "warning" | "success";
  value: string; sub?: string; stats?: [string, number][]; action?: string; rows: string[];
};

const WIDGETS: Widget[] = [
  { title: "Contas a Pagar em Aberto", icon: ArrowDownCircle, tone: "destructive", value: brl(18430.5), sub: "7 vencem nesta semana · 2 vencidas",
    rows: ["Fornecedor Lentes Essilor — R$ 6.200,00 — vence 20/10", "Aluguel da loja — R$ 4.500,00 — vence 05/11", "Armações Ray-Ban — R$ 5.120,50 — vencida 14/10", "Energia elétrica — R$ 610,00 — vence 22/10"] },
  { title: "Contas Rateadas em Aberto", icon: Split, tone: "warning", value: brl(3260), sub: "4 rateios entre filiais",
    rows: ["Marketing digital — Matriz/Filial 1 — R$ 1.800,00", "Software de gestão — R$ 860,00", "Contabilidade — R$ 600,00"] },
  { title: "Contas a Receber em Aberto", icon: ArrowUpCircle, tone: "success", value: brl(42780.9), sub: "38 parcelas · 5 em atraso",
    rows: ["Mariana Souza — parcela 3/6 — R$ 280,00", "Carlos Mendes — parcela 1/10 — R$ 159,90", "Fernanda Lima — boleto — R$ 1.240,00 (atrasado)"] },
  { title: "Remover Clientes do SPC / Pagar Contas", icon: ShieldAlert, tone: "destructive", value: "3 clientes", sub: "Quitaram débitos e aguardam baixa", action: "Ver clientes",
    rows: ["João Pereira — quitado em 12/10", "Roberto Alves — quitado em 15/10", "Sandra Nunes — quitado em 16/10"] },
  { title: "Aniversariantes da Semana", icon: Cake, tone: "primary", value: "12 clientes", sub: "Ideal para campanha de relacionamento",
    rows: ["Carlos Mendes — 18/10", "Lucas Martins — 19/10", "Beatriz Ramos — 21/10", "Paulo Henrique — 22/10"] },
  { title: "Pós-Vendas do Dia", icon: PhoneCall, tone: "primary", value: "15 contatos", stats: [["No prazo", 9], ["Último dia", 4], ["Atrasados", 2]], action: "Ver Pós-Vendas",
    rows: ["Fernanda Lima — adaptação multifocal (no prazo)", "Patrícia Gomes — lente de contato (último dia)", "Diego Faria — armação nova (atrasado)"] },
  { title: "Receitas Vencidas", icon: FileWarning, tone: "warning", value: "27 receitas", sub: "9 vencem nos próximos 30 dias",
    rows: ["Ana Beatriz Rocha — venceu 02/10", "Marcos Vieira — vence 30/10", "Helena Duarte — venceu 21/09"] },
  { title: "Ordens de Serviço a Entregar", icon: Truck, tone: "primary", value: "21 O.S.", stats: [["Hoje", 5], ["Esta semana", 11], ["Atrasadas", 5]],
    rows: ["O.S. 10482 — Mariana Souza — pronta", "O.S. 10490 — Juliana Castro — no laboratório", "O.S. 10471 — Rafael Teixeira — atrasada"] },
  { title: "Validade de Produtos", icon: CalendarClock, tone: "warning", value: "18 itens", stats: [["Vencidos", 6], ["A vencer", 12]], action: "Listar Produtos",
    rows: ["Solução multiuso Renu 355ml — vencida", "Lente Acuvue Oasys cx 6 — vence 11/2026", "Colírio lubrificante — vence 12/2026"] },
  { title: "Produtos Abaixo do Estoque Mínimo", icon: PackageMinus, tone: "destructive", value: "34", sub: "produtos precisam de reposição", action: "Listar Produtos",
    rows: ["Armação Oakley OX8046 — 1 un (mín. 3)", "Estojo rígido preto — 4 un (mín. 20)", "Flanela microfibra — 12 un (mín. 50)"] },
];

const TONE = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/10 text-success",
};

function Dashboard() {
  const { role } = useAuth();
  if (role === "vendedor") return <SellerHome />;
  return <FullDashboard />;
}

function SellerHome() {
  const { nome, acessos } = useAuth();
  const buttons = NAV.flatMap((n) =>
    n.children
      ? n.children.filter((c) => canAccess("vendedor", c.slug, acessos)).map((c) => ({ label: c.label, slug: c.slug, icon: n.icon }))
      : n.slug && canAccess("vendedor", n.slug, acessos) ? [{ label: n.label, slug: n.slug, icon: n.icon }] : [],
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
    </div>
  );
}

function FullDashboard() {
  const [open, setOpen] = useState<Widget | null>(null);
  const total = DAILY.reduce((a, d) => a + d.faturamento, 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold">Painel de Informações</h1><p className="text-sm text-muted-foreground">Ótica Visão Clara · Outubro de 2026</p></div>
        <Button asChild variant="outline"><Link to="/otica-zap">Abrir Ótica Zap</Link></Button>
      </div>
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div className="font-semibold">Movimentação diária</div>
          <div className="text-sm text-muted-foreground">Faturamento no mês: <span className="font-bold text-foreground">{brl(total)}</span></div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DAILY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WIDGETS.map((w) => {
          const Icon = w.icon;
          return (
            <Card key={w.title} role="button" tabIndex={0} onClick={() => setOpen(w)} onKeyDown={(e) => e.key === "Enter" && setOpen(w)}
              className="cursor-pointer p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${TONE[w.tone]}`}><Icon className="h-5 w-5" /></div>
                <div className="min-w-0"><div className="text-sm font-medium text-muted-foreground">{w.title}</div><div className="text-2xl font-bold">{w.value}</div></div>
              </div>
              {w.sub && <p className="mt-3 text-sm text-muted-foreground">{w.sub}</p>}
              {w.stats && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {w.stats.map(([l, n]) => <div key={l} className="rounded-md bg-muted p-2 text-center"><div className="text-lg font-bold">{n}</div><div className="text-xs text-muted-foreground">{l}</div></div>)}
                </div>
              )}
              {w.action && <Button size="sm" className="mt-4 w-full">{w.action}</Button>}
            </Card>
          );
        })}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open?.title}</DialogTitle></DialogHeader>
          <ul className="divide-y text-sm">{open?.rows.map((r) => <li key={r} className="py-2">{r}</li>)}</ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
