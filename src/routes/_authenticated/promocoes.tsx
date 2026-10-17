import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Plus, Search, Tag, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções — Visão Ótica" },
      { name: "description", content: "Crie e acompanhe promoções de armações, lentes e acessórios." },
      { property: "og:title", content: "Promoções — Visão Ótica" },
      { property: "og:description", content: "Crie e acompanhe promoções de armações, lentes e acessórios." },
    ],
  }),
  component: Promocoes,
});

type TipoDesc = "percentual" | "valor";
type Promo = { id: number; nome: string; aplicaEm: string; tipo: TipoDesc; valor: number; inicio: string; fim: string; ativa: boolean; usos: number };
type Status = "Ativa" | "Agendada" | "Encerrada" | "Pausada";

const ALVOS = ["Todos os produtos", "Armações", "Óculos de sol", "Lentes oftálmicas", "Lentes de contato", "Acessórios"];
const INICIAIS: Promo[] = [
  { id: 1, nome: "Outubro Rosa — armações femininas", aplicaEm: "Armações", tipo: "percentual", valor: 20, inicio: "2026-10-01", fim: "2026-10-31", ativa: true, usos: 37 },
  { id: 2, nome: "Multifocal com antirreflexo grátis", aplicaEm: "Lentes oftálmicas", tipo: "valor", valor: 390, inicio: "2026-09-15", fim: "2026-11-15", ativa: true, usos: 12 },
  { id: 3, nome: "Black Friday Óculos de Sol", aplicaEm: "Óculos de sol", tipo: "percentual", valor: 35, inicio: "2026-11-20", fim: "2026-11-30", ativa: true, usos: 0 },
  { id: 4, nome: "Dia das Crianças", aplicaEm: "Armações", tipo: "percentual", valor: 15, inicio: "2026-10-01", fim: "2026-10-12", ativa: true, usos: 24 },
  { id: 5, nome: "Lentes de contato — 2ª caixa", aplicaEm: "Lentes de contato", tipo: "percentual", valor: 30, inicio: "2026-08-01", fim: "2026-12-31", ativa: false, usos: 41 },
];

const HOJE = "2026-10-17";
const status = (p: Promo): Status => (!p.ativa ? "Pausada" : HOJE < p.inicio ? "Agendada" : HOJE > p.fim ? "Encerrada" : "Ativa");
const COR: Record<Status, string> = {
  Ativa: "bg-success/10 text-success",
  Agendada: "bg-primary/10 text-primary",
  Encerrada: "bg-muted text-muted-foreground",
  Pausada: "bg-warning/15 text-warning",
};
const data = (d: string) => d.split("-").reverse().join("/");
const desc = (p: Promo) => (p.tipo === "percentual" ? `${p.valor}% OFF` : `${p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} OFF`);
const VAZIO = { nome: "", aplicaEm: ALVOS[1] ?? "", tipo: "percentual" as TipoDesc, valor: "", inicio: HOJE, fim: "" };

function Promocoes() {
  const [lista, setLista] = useState<Promo[]>(INICIAIS);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Status | "Todas">("Todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");

  const itens = useMemo(
    () => lista.filter((p) => (filtro === "Todas" || status(p) === filtro) && p.nome.toLowerCase().includes(busca.toLowerCase())),
    [lista, busca, filtro],
  );
  const conta = (s: Status) => lista.filter((p) => status(p) === s).length;

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(form.valor.replace(",", "."));
    if (!form.nome.trim() || !form.fim) return setErro("Preencha o nome e a data de término.");
    if (!(valor > 0) || (form.tipo === "percentual" && valor > 100)) return setErro("Informe um desconto válido (percentual entre 1 e 100).");
    if (form.fim < form.inicio) return setErro("A data de término deve ser depois do início.");
    setLista((l) => [{ id: Date.now(), ...form, valor, ativa: true, usos: 0 }, ...l]);
    setForm(VAZIO);
    setErro("");
    setAberto(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold">Promoções</h1><p className="text-sm text-muted-foreground">Campanhas de desconto da loja</p></div>
        <Button onClick={() => setAberto(true)}><Plus className="h-4 w-4" />Nova promoção</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {(["Ativa", "Agendada", "Pausada", "Encerrada"] as Status[]).map((s) => (
          <Card key={s} role="button" tabIndex={0} onClick={() => setFiltro(filtro === s ? "Todas" : s)}
            className={`cursor-pointer p-4 transition-shadow hover:shadow-md ${filtro === s ? "ring-2 ring-primary" : ""}`}>
            <div className="text-sm text-muted-foreground">{s === "Ativa" ? "Ativas" : s === "Agendada" ? "Agendadas" : s === "Pausada" ? "Pausadas" : "Encerradas"}</div>
            <div className="text-2xl font-bold">{conta(s)}</div>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar promoção" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((p) => {
          const s = status(p);
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Tag className="h-5 w-5" /></div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COR[s]}`}>{s}</span>
              </div>
              <h3 className="mt-3 font-semibold">{p.nome}</h3>
              <p className="text-sm text-muted-foreground">{p.aplicaEm}</p>
              <div className="mt-3 text-2xl font-bold text-primary">{desc(p)}</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{data(p.inicio)} a {data(p.fim)} · {p.usos} vendas</div>
              <div className="mt-4 flex gap-2 pt-1">
                <Button size="sm" variant="outline" className="flex-1" disabled={s === "Encerrada"}
                  onClick={() => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, ativa: !x.ativa } : x)))}>
                  {p.ativa ? "Pausar" : "Reativar"}
                </Button>
                <Button size="icon" variant="ghost" aria-label={`Excluir ${p.nome}`} onClick={() => setLista((l) => l.filter((x) => x.id !== p.id))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
        {itens.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Nenhuma promoção encontrada.</p>}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova promoção</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted-foreground">Nome da promoção</span>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-medium text-muted-foreground">Aplica-se a</span>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.aplicaEm} onChange={(e) => setForm({ ...form, aplicaEm: e.target.value })}>
                {ALVOS.map((a) => <option key={a}>{a}</option>)}
              </select></label>
            <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de desconto</span>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoDesc })}>
                <option value="percentual">Percentual (%)</option><option value="valor">Valor fixo (R$)</option>
              </select></label>
            <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Desconto</span>
              <Input inputMode="decimal" placeholder={form.tipo === "percentual" ? "Ex.: 20" : "Ex.: 150,00"} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></label>
            <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Início</span>
              <Input type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></label>
            <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Término</span>
              <Input type="date" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} /></label>
            {erro && <p className="text-sm text-destructive sm:col-span-2">{erro}</p>}
            <Button type="submit" className="sm:col-span-2">Criar promoção</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
