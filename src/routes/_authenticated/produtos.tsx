import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { lerNfeXml, type Nfe } from "@/lib/nfe";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Ótica Louise" },
      { name: "description", content: "Cadastro de armações, lentes e acessórios da ótica." },
      { property: "og:title", content: "Produtos — Ótica Louise" },
      { property: "og:description", content: "Cadastro de armações, lentes e acessórios da ótica." },
    ],
  }),
  component: Produtos,
});

type Produto = { id: number; codigo: string; nome: string; categoria: string; marca: string; preco: number; estoque: number; minimo: number };

const CATEGORIAS = ["Armação", "Óculos de sol", "Lente de contato", "Acessório", "Solução"];
const INICIAIS: Produto[] = [];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const VAZIO = { codigo: "", nome: "", categoria: "Armação", marca: "", preco: "", estoque: "", minimo: "" };

function Produtos() {
  const [lista, setLista] = useState<Produto[]>(INICIAIS);
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("Todas");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return lista.filter((p) => (cat === "Todas" || p.categoria === cat) && [p.nome, p.codigo, p.marca].some((v) => v.toLowerCase().includes(q)));
  }, [lista, busca, cat]);

  const [nfe, setNfe] = useState<Nfe | null>(null);
  const [nfeCat, setNfeCat] = useState("Armação");
  const [nfeErro, setNfeErro] = useState("");
  const [margem, setMargem] = useState("100");

  const abrirXml = async (f?: File) => {
    if (!f) return;
    setNfeErro("");
    try { setNfe(lerNfeXml(await f.text())); } catch (err) { setNfeErro((err as Error).message); setNfe({ numero: "", fornecedor: "", itens: [] }); }
  };

  const importarNfe = () => {
    if (!nfe) return;
    const fator = 1 + (Number(margem) || 0) / 100;
    setLista((l) => {
      const nova = [...l];
      nfe.itens.forEach((it, i) => {
        const idx = nova.findIndex((p) => p.codigo && p.codigo === it.codigo);
        if (idx >= 0) { const p = nova[idx]!; nova[idx] = { ...p, estoque: p.estoque + it.quantidade }; }
        else nova.unshift({ id: Date.now() + i, codigo: it.codigo, nome: it.nome, categoria: nfeCat, marca: nfe.fornecedor,
          preco: Math.round(it.valorUnit * fator * 100) / 100, estoque: it.quantidade, minimo: 0 });
      });
      return nova;
    });
    setNfe(null);
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setLista((l) => [{ id: Date.now(), codigo: form.codigo, nome: form.nome, categoria: form.categoria, marca: form.marca,
      preco: Number(form.preco) || 0, estoque: Number(form.estoque) || 0, minimo: Number(form.minimo) || 0 }, ...l]);
    setForm(VAZIO);
    setAberto(false);
  };

  const campo = (k: keyof typeof VAZIO, label: string, type = "text", span = false) => (
    <label className={span ? "sm:col-span-2" : ""}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <Input type={type} step={type === "number" ? "0.01" : undefined} required={k === "nome"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold">Produtos</h1><p className="text-sm text-muted-foreground">{lista.length} produtos · {lista.filter((p) => p.estoque < p.minimo).length} abaixo do mínimo</p></div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <label className="cursor-pointer"><FileText className="h-4 w-4" />Importar nota fiscal (XML)
              <input type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={(e) => { abrirXml(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </Button>
          <Button onClick={() => setAberto(true)}><Plus className="h-4 w-4" />Novo produto</Button>
        </div>
      </div>

      <Dialog open={!!nfe} onOpenChange={(o) => !o && setNfe(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{nfeErro ? "Não foi possível ler a nota" : `Nota fiscal nº ${nfe?.numero} — ${nfe?.fornecedor}`}</DialogTitle></DialogHeader>
          {nfeErro ? <p className="text-sm text-destructive">{nfeErro}</p> : nfe && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Categoria dos produtos novos</span>
                  <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={nfeCat} onChange={(e) => setNfeCat(e.target.value)}>
                    {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                  </select></label>
                <label><span className="mb-1 block text-xs font-medium text-muted-foreground">Margem sobre o custo (%) para preço de venda</span>
                  <Input type="number" value={margem} onChange={(e) => setMargem(e.target.value)} /></label>
              </div>
              <div className="max-h-80 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs"><tr><th className="p-2">Código</th><th className="p-2">Produto</th><th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Custo</th><th className="p-2">Situação</th></tr></thead>
                  <tbody>{nfe.itens.map((it, i) => (
                    <tr key={i} className="border-t"><td className="p-2">{it.codigo}</td><td className="p-2">{it.nome}</td><td className="p-2 text-right">{it.quantidade}</td><td className="p-2 text-right">{brl(it.valorUnit)}</td>
                      <td className="p-2 text-xs">{lista.some((p) => p.codigo && p.codigo === it.codigo) ? "Soma ao estoque" : "Novo"}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <Button className="w-full" onClick={importarNfe}>Incluir {nfe.itens.length} produtos</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, código ou marca" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <select aria-label="Categoria" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
            {["Todas", ...CATEGORIAS].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">Código</th><th className="pr-3">Produto</th><th className="pr-3">Categoria</th><th className="pr-3">Marca</th><th className="pr-3 text-right">Preço</th><th className="pr-3 text-right">Estoque</th><th />
            </tr></thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground">{p.codigo}</td><td className="pr-3 font-medium">{p.nome}</td>
                  <td className="pr-3">{p.categoria}</td><td className="pr-3">{p.marca}</td><td className="pr-3 text-right">{brl(p.preco)}</td>
                  <td className={`pr-3 text-right font-semibold ${p.estoque < p.minimo ? "text-destructive" : ""}`}>{p.estoque} <span className="text-xs font-normal text-muted-foreground">/ mín. {p.minimo}</span></td>
                  <td className="text-right"><Button size="icon" variant="ghost" aria-label={`Excluir ${p.nome}`} onClick={() => setLista((l) => l.filter((x) => x.id !== p.id))}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo produto</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            {campo("nome", "Nome do produto", "text", true)}
            {campo("codigo", "Código")}
            <label>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Categoria</span>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            {campo("marca", "Marca")}
            {campo("preco", "Preço (R$)", "number")}
            {campo("estoque", "Estoque atual", "number")}
            {campo("minimo", "Estoque mínimo", "number")}
            <Button type="submit" className="sm:col-span-2">Salvar produto</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
