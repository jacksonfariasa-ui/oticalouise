import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, ShoppingCart, Wrench, Package, Users, Plus, Trash2, CheckCircle2, TrendingUp, Search, ShieldCheck, Trophy, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFiliais, updateFilial, brl } from "@/lib/filiais";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/permissions";

const NOMES: Record<string, string> = { matriz: "Matriz", rorainopolis: "Filial Rorainópolis", pintolandia: "Filial Pintolândia" };

export const Route = createFileRoute("/_authenticated/filiais_/$id")({
  beforeLoad: ({ params }) => { if (!NOMES[params.id]) throw notFound(); },
  head: ({ params }) => {
    const n = NOMES[params.id] ?? "Filial";
    return {
      meta: [
        { title: `${n} — Ótica Louise` },
        { name: "description", content: `Operação independente da unidade ${n}: vendas, O.S., estoque e equipe.` },
        { property: "og:title", content: `${n} — Ótica Louise` },
        { property: "og:description", content: `Operação independente da unidade ${n}.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Unidade,
});

const hoje = () => new Date().toISOString().slice(0, 10);

function Unidade() {
  const { id } = Route.useParams();
  const f = useFiliais().find((x) => x.id === id);
  const { role, nome } = useAuth();
  const gestor = role === "admin" || role === "gerente";
  const [buscaEst, setBuscaEst] = useState("");
  const [meta, setMeta] = useState("");
  const [venda, setVenda] = useState({ cliente: "", descricao: "", valor: "" });
  const [os, setOs] = useState({ cliente: "", servico: "" });
  const [item, setItem] = useState({ produto: "", categoria: "", qtd: "" });
  if (!f) return null;

  const nextId = (l: { id: number }[]) => Math.max(0, ...l.map((x) => x.id)) + 1;

  function addVenda() {
    const valor = Number(venda.valor);
    if (!venda.cliente || !valor) return;
    updateFilial(id, (u) => ({ ...u, vendas: u.vendas + 1, faturamento: u.faturamento + valor,
      vendasLista: [{ id: nextId(u.vendasLista), data: hoje(), cliente: venda.cliente, descricao: venda.descricao, valor, vendedor: nome || "Vendedor" }, ...u.vendasLista] }));
    setVenda({ cliente: "", descricao: "", valor: "" });
  }
  function delVenda(vid: number) {
    updateFilial(id, (u) => {
      const v = u.vendasLista.find((x) => x.id === vid);
      return { ...u, vendas: u.vendas - 1, faturamento: u.faturamento - (v?.valor ?? 0), vendasLista: u.vendasLista.filter((x) => x.id !== vid) };
    });
  }
  function addOS() {
    if (!os.cliente || !os.servico) return;
    updateFilial(id, (u) => ({ ...u, osAbertas: u.osAbertas + 1,
      osLista: [{ id: nextId(u.osLista), numero: `OS-${Math.floor(1000 + Math.random() * 9000)}`, cliente: os.cliente, servico: os.servico, status: "Aberta" }, ...u.osLista] }));
    setOs({ cliente: "", servico: "" });
  }
  function concluir(oid: number) {
    updateFilial(id, (u) => ({ ...u, osAbertas: Math.max(0, u.osAbertas - 1),
      osLista: u.osLista.map((o) => (o.id === oid ? { ...o, status: "Concluída" } : o)) }));
  }
  function addItem() {
    const qtd = Number(item.qtd);
    if (!item.produto || !qtd) return;
    updateFilial(id, (u) => ({ ...u, estoque: u.estoque + qtd,
      estoqueLista: [...u.estoqueLista, { id: nextId(u.estoqueLista), produto: item.produto, categoria: item.categoria || "Geral", qtd }] }));
    setItem({ produto: "", categoria: "", qtd: "" });
  }
  function delItem(iid: number) {
    updateFilial(id, (u) => {
      const it = u.estoqueLista.find((x) => x.id === iid);
      return { ...u, estoque: Math.max(0, u.estoque - (it?.qtd ?? 0)), estoqueLista: u.estoqueLista.filter((x) => x.id !== iid) };
    });
  }

  const pct = Math.round((f.faturamento / f.meta) * 100);
  const minhas = f.vendasLista.filter((v) => v.vendedor === nome);
  const meuTotal = minhas.reduce((a, v) => a + v.valor, 0);
  const porVendedor = Object.entries(f.vendasLista.reduce<Record<string, { qtd: number; total: number }>>((acc, v) => {
    const r = (acc[v.vendedor] ??= { qtd: 0, total: 0 }); r.qtd++; r.total += v.valor; return acc;
  }, {})).sort((a, b) => b[1].total - a[1].total);
  const estoqueVis = f.estoqueLista.filter((i) => `${i.produto} ${i.categoria}`.toLowerCase().includes(buscaEst.toLowerCase()));
  function salvarMeta() { const m = Number(meta); if (m > 0) { updateFilial(id, (u) => ({ ...u, meta: m })); setMeta(""); } }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary"><Building2 className="h-5 w-5" /></div>
        <div>
          <h1 className="text-2xl font-bold">{f.nome}</h1>
          <p className="text-sm text-muted-foreground">{f.endereco}, {f.cidade} · Gerente: {f.gerente}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"><ShieldCheck className="h-3.5 w-3.5" />Acesso: {gestor ? "Gerente" : roleLabel(role)}</span>
      </header>

      {gestor ? <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={TrendingUp} label="Faturamento" value={brl(f.faturamento)} sub={`${pct}% da meta`} />
        <Kpi icon={ShoppingCart} label="Vendas" value={String(f.vendas)} />
        <Kpi icon={Wrench} label="O.S. abertas" value={String(f.osAbertas)} />
        <Kpi icon={Package} label="Itens em estoque" value={f.estoque.toLocaleString("pt-BR")} />
        <Kpi icon={Users} label="Equipe" value={String(f.equipe.length)} />
      </section> : <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={ShoppingCart} label="Minhas vendas" value={String(minhas.length)} />
        <Kpi icon={TrendingUp} label="Meu faturamento" value={brl(meuTotal)} />
        <Kpi icon={Target} label="Meta da loja" value={`${pct}%`} sub="atingido no mês" />
        <Kpi icon={Wrench} label="O.S. abertas" value={String(f.osAbertas)} />
      </section>}

      <Tabs defaultValue="vendas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="os">Ordens de serviço</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          {gestor && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
          {gestor && <TabsTrigger value="gestao">Gestão</TabsTrigger>}
        </TabsList>

        <TabsContent value="vendas">
          <Card className="space-y-4 p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
              <Input placeholder="Cliente" value={venda.cliente} onChange={(e) => setVenda({ ...venda, cliente: e.target.value })} />
              <Input placeholder="Descrição" value={venda.descricao} onChange={(e) => setVenda({ ...venda, descricao: e.target.value })} />
              <Input placeholder="Valor (R$)" type="number" value={venda.valor} onChange={(e) => setVenda({ ...venda, valor: e.target.value })} />
              <Button onClick={addVenda}><Plus className="mr-1 h-4 w-4" />Registrar</Button>
            </div>
            <Lista vazio="Nenhuma venda registrada." itens={(gestor ? f.vendasLista : minhas).map((v) => ({
              id: v.id, titulo: `${v.cliente} — ${brl(v.valor)}`, sub: `${v.data.split("-").reverse().join("/")} · ${v.descricao} · ${v.vendedor}`,
              acao: gestor && <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => delVenda(v.id)}><Trash2 className="h-4 w-4" /></Button>,
            }))} />
          </Card>
        </TabsContent>

        <TabsContent value="os">
          <Card className="space-y-4 p-5">
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <Input placeholder="Cliente" value={os.cliente} onChange={(e) => setOs({ ...os, cliente: e.target.value })} />
              <Input placeholder="Serviço" value={os.servico} onChange={(e) => setOs({ ...os, servico: e.target.value })} />
              <Button onClick={addOS}><Plus className="mr-1 h-4 w-4" />Abrir O.S.</Button>
            </div>
            <Lista vazio="Nenhuma O.S. registrada." itens={f.osLista.map((o) => ({
              id: o.id, titulo: `${o.numero} · ${o.cliente}`, sub: `${o.servico} · ${o.status}`,
              acao: o.status === "Aberta" && !gestor ? <span className="text-xs text-muted-foreground">Aberta</span> : o.status === "Aberta"
                ? <Button variant="outline" size="sm" onClick={() => concluir(o.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Concluir</Button>
                : <span className="text-xs text-success">Concluída</span>,
            }))} />
          </Card>
        </TabsContent>

        <TabsContent value="estoque">
          <Card className="space-y-4 p-5">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Consultar produto ou categoria" value={buscaEst} onChange={(e) => setBuscaEst(e.target.value)} /></div>
            {gestor && <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Input placeholder="Produto" value={item.produto} onChange={(e) => setItem({ ...item, produto: e.target.value })} />
              <Input placeholder="Categoria" value={item.categoria} onChange={(e) => setItem({ ...item, categoria: e.target.value })} />
              <Input placeholder="Quantidade" type="number" value={item.qtd} onChange={(e) => setItem({ ...item, qtd: e.target.value })} />
              <Button onClick={addItem}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
            </div>}
            <Lista vazio="Nenhum item encontrado." itens={estoqueVis.map((i) => ({
              id: i.id, titulo: i.produto, sub: `${i.categoria} · ${i.qtd} un.`,
              acao: gestor && <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => delItem(i.id)}><Trash2 className="h-4 w-4" /></Button>,
            }))} />
          </Card>
        </TabsContent>

        <TabsContent value="equipe">
          <Card className="p-5">
            <Lista vazio="Sem equipe." itens={f.equipe.map((m, i) => ({ id: i, titulo: m.nome, sub: m.cargo }))} />
          </Card>
        </TabsContent>

        {gestor && <TabsContent value="gestao">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4" />Meta mensal da unidade</h3>
              <p className="text-sm text-muted-foreground">Atual: <b className="text-foreground">{brl(f.meta)}</b> · {pct}% atingido</p>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div className="flex gap-2"><Input type="number" placeholder="Nova meta (R$)" value={meta} onChange={(e) => setMeta(e.target.value)} /><Button onClick={salvarMeta}>Salvar</Button></div>
            </Card>
            <Card className="space-y-3 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" />Desempenho dos vendedores</h3>
              <Lista vazio="Sem vendas registradas." itens={porVendedor.map(([n, r], i) => ({ id: i, titulo: `${i + 1}º ${n}`, sub: `${r.qtd} venda(s) · ${brl(r.total)}` }))} />
            </Card>
          </div>
        </TabsContent>}
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 text-lg font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function Lista({ itens, vazio }: { itens: { id: number; titulo: string; sub: string; acao?: React.ReactNode | false }[]; vazio: string }) {
  if (!itens.length) return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>;
  return (
    <ul className="divide-y">
      {itens.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><div className="truncate text-sm font-medium">{i.titulo}</div><div className="truncate text-xs text-muted-foreground">{i.sub}</div></div>
          {i.acao}
        </li>
      ))}
    </ul>
  );
}
