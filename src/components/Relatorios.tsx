import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, ShoppingCart, Users, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findLabel } from "@/lib/nav";
import { CHAVE_ATIVIDADES, type Atividade } from "@/lib/atividades";

type Reg = Record<string, unknown>;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (v: unknown) => Number(v) || 0;
const str = (v: unknown) => String(v ?? "");
const dataBR = (d: string) => (d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—");
const chave = (slug: string) => `modulo:${findLabel(slug)}`;
const mesAtual = () => new Date().toISOString().slice(0, 7);

function useDados() {
  const [dados, setDados] = useState<Record<string, Reg[]>>({});
  const [vez, setVez] = useState(0);
  useEffect(() => {
    let ativo = true;
    const carregar = () => supabase.from("dados_salvos").select("chave, dados").then(({ data }) => {
      if (!ativo) return;
      setDados(Object.fromEntries((data ?? []).map((r) => [r.chave, Array.isArray(r.dados) ? (r.dados as Reg[]) : []])));
    });
    void carregar();
    const t = setInterval(carregar, 15000);
    return () => { ativo = false; clearInterval(t); };
  }, [vez]);
  return [dados, () => setVez((v) => v + 1)] as const;
}

export function Relatorios() {
  const [dados, recarregar] = useDados();
  const [aba, setAba] = useState<"vendas" | "caixa" | "equipe">("vendas");
  const [mes, setMes] = useState(mesAtual());
  const noMes = (d: unknown) => !mes || str(d).startsWith(mes);

  const vendas = useMemo(() => (dados[chave("vendas")] ?? []).filter((v) => noMes(v["data"])), [dados, mes]); // eslint-disable-line react-hooks/exhaustive-deps
  const caixa = useMemo(() => (dados[chave("fluxo-de-caixa")] ?? []).filter((v) => noMes(v["data"])), [dados, mes]); // eslint-disable-line react-hooks/exhaustive-deps
  const receber = (dados[chave("contas-a-receber")] ?? []).filter((c) => str(c["status"]) !== "Recebido");
  const pagar = (dados[chave("contas-a-pagar")] ?? []).filter((c) => str(c["status"]) !== "Pago");
  const os = dados[chave("ordens-de-servico")] ?? [];
  const atividades = ((dados[CHAVE_ATIVIDADES] ?? []) as unknown as Atividade[]).filter((a) => noMes(a.quando));

  const totalVendas = vendas.reduce((s, v) => s + num(v["total"]), 0);
  const entradas = caixa.filter((c) => c["tipo"] === "Entrada").reduce((s, c) => s + num(c["valor"]), 0);
  const saidas = caixa.filter((c) => c["tipo"] === "Saída").reduce((s, c) => s + num(c["valor"]), 0);

  const porPagamento = agrupar(vendas, (v) => str(v["pagamento"]) || "—", (v) => num(v["total"]));
  const equipe = useMemo(() => {
    const m = new Map<string, { vendas: number; valor: number; acoes: number; ultima: string }>();
    const get = (n: string) => m.get(n) ?? (m.set(n, { vendas: 0, valor: 0, acoes: 0, ultima: "" }), m.get(n)!);
    for (const v of vendas) { const e = get(str(v["vendedor"]) || "Sem vendedor"); e.vendas++; e.valor += num(v["total"]); }
    for (const a of atividades) { const e = get(a.quem); e.acoes++; if (a.quando > e.ultima) e.ultima = a.quando; }
    return [...m.entries()].sort((a, b) => b[1].valor - a[1].valor || b[1].acoes - a[1].acoes);
  }, [vendas, atividades]);

  const ABAS = [
    { id: "vendas" as const, label: "Vendas", icon: ShoppingCart },
    { id: "caixa" as const, label: "Fluxo de caixa", icon: Wallet },
    { id: "equipe" as const, label: "Equipe", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><BarChart3 className="h-6 w-6 text-primary" />Relatórios</h1>
          <p className="text-sm text-muted-foreground">Atualizado automaticamente com tudo o que é lançado no sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mês" className="rounded-md border bg-background px-3 py-2 text-sm" />
          <Button variant="outline" size="sm" onClick={() => setMes("")}>Todo o período</Button>
          <Button variant="ghost" size="icon" aria-label="Atualizar" onClick={recarregar}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi titulo="Vendas" valor={brl(totalVendas)} sub={`${vendas.length} venda(s)`} />
        <Kpi titulo="Saldo do caixa" valor={brl(entradas - saidas)} sub={`${brl(entradas)} entradas · ${brl(saidas)} saídas`} />
        <Kpi titulo="A receber em aberto" valor={brl(receber.reduce((s, c) => s + num(c["valor"]), 0))} sub={`${receber.length} parcela(s)`} />
        <Kpi titulo="O.S. em andamento" valor={String(os.filter((o) => str(o["etapa"]) !== "Entregue").length)} sub={`${pagar.length} conta(s) a pagar em aberto`} />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {ABAS.map((a) => (
          <Button key={a.id} variant={aba === a.id ? "default" : "outline"} size="sm" onClick={() => setAba(a.id)}><a.icon className="h-4 w-4" />{a.label}</Button>
        ))}
      </div>

      {aba === "vendas" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Tabela vazio="Nenhuma venda no período." cab={["Venda", "Data", "Cliente", "Vendedor", "Pagamento", "Total"]}
            linhas={vendas.map((v) => [str(v["numero"]), dataBR(str(v["data"])), str(v["cliente"]), str(v["vendedor"]), str(v["pagamento"]), brl(num(v["total"]))])} />
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Por forma de pagamento</div>
            {porPagamento.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : porPagamento.map(([k, v]) => (
              <div key={k} className="mb-2">
                <div className="flex justify-between text-xs"><span>{k}</span><span className="font-medium">{brl(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${totalVendas ? (v / totalVendas) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {aba === "caixa" && (
        <Tabela vazio="Nenhuma movimentação no período." cab={["Data", "Descrição", "Tipo", "Valor"]}
          linhas={[...caixa].sort((a, b) => str(b["data"]).localeCompare(str(a["data"]))).map((c) => [dataBR(str(c["data"])), str(c["descricao"]), str(c["tipo"]), `${c["tipo"] === "Saída" ? "− " : ""}${brl(num(c["valor"]))}`])} />
      )}

      {aba === "equipe" && (
        <Tabela vazio="Nenhuma atividade da equipe no período." cab={["Pessoa", "Vendas", "Valor vendido", "Ações no sistema", "Última ação"]}
          linhas={equipe.map(([n, e]) => [n, String(e.vendas), brl(e.valor), String(e.acoes), e.ultima ? new Date(e.ultima).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"])} />
      )}
    </div>
  );
}

function agrupar(l: Reg[], k: (r: Reg) => string, v: (r: Reg) => number) {
  const m = new Map<string, number>();
  for (const r of l) m.set(k(r), (m.get(k(r)) ?? 0) + v(r));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Kpi({ titulo, valor, sub }: { titulo: string; valor: string; sub: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{titulo}</div>
      <div className="mt-1 text-xl font-bold">{valor}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}

function Tabela({ cab, linhas, vazio }: { cab: string[]; linhas: string[][]; vazio: string }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left"><tr>{cab.map((c, i) => <th key={c} className={`p-3 ${i === cab.length - 1 || /Valor|Total/.test(c) ? "text-right" : ""}`}>{c}</th>)}</tr></thead>
        <tbody>
          {linhas.length === 0 && <tr><td colSpan={cab.length} className="p-6 text-center text-muted-foreground">{vazio}</td></tr>}
          {linhas.map((l, i) => (
            <tr key={i} className="border-b last:border-0">{l.map((c, j) => <td key={j} className={`p-3 ${j === l.length - 1 || /Valor|Total/.test(cab[j]!) ? "text-right" : ""}`}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
