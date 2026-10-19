import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, FileUp, Plus, Search, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ACCEPT, readTableFile } from "@/lib/import-table";

const TIPOS: Record<string, string> = {
  "lentes-monofocais": "Lentes Monofocais",
  "lentes-multifocais": "Lentes Multifocais",
  "lentes-de-contato": "Lentes de Contato",
  tratamentos: "Tratamentos",
};

export const Route = createFileRoute("/_authenticated/lentes/$tipo")({
  head: ({ params }) => {
    const t = `${TIPOS[params.tipo] ?? "Tabelas de Lentes"} — Ótica Louise`;
    const d = "Tabela de preços de lentes com importação de planilhas e documentos.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Lentes,
});

type Lente = { id: number; tipo: string; fornecedor: string; nome: string; material: string; indice: string; faixa: string; custo: number; preco: number };
type Campo = Exclude<keyof Lente, "id" | "tipo">;

const COLUNAS: { k: Campo; label: string; alias: string[] }[] = [
  { k: "fornecedor", label: "Fornecedor", alias: ["fornecedor", "marca", "fabricante", "laboratorio"] },
  { k: "nome", label: "Lente", alias: ["lente", "nome", "produto", "descricao", "tratamento"] },
  { k: "material", label: "Material", alias: ["material", "tipo"] },
  { k: "indice", label: "Índice", alias: ["indice", "ind", "refracao"] },
  { k: "faixa", label: "Faixa", alias: ["faixa", "grau", "dioptria", "esferico", "cobertura"] },
  { k: "custo", label: "Custo", alias: ["custo", "compra", "preco custo"] },
  { k: "preco", label: "Preço venda", alias: ["preco", "venda", "valor", "preco venda"] },
];

let seq = 100;
const L = (tipo: string, fornecedor: string, nome: string, material: string, indice: string, faixa: string, custo: number, preco: number): Lente =>
  ({ id: seq++, tipo, fornecedor, nome, material, indice, faixa, custo, preco });

const INICIAIS: Lente[] = [];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const num = (s: string) => {
  const c = String(s ?? "").replace(/[^\d,.-]/g, "");
  const v = c.includes(",") ? Number(c.replace(/\./g, "").replace(",", ".")) : Number(c);
  return Number.isFinite(v) ? v : 0;
};
const VAZIO: Record<Campo, string> = { fornecedor: "", nome: "", material: "", indice: "", faixa: "", custo: "", preco: "" };

function Lentes() {
  const { tipo } = Route.useParams();
  const titulo = TIPOS[tipo] ?? "Tabelas de Lentes";
  const [lista, setLista] = useState<Lente[]>(INICIAIS);
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [imp, setImp] = useState<{ arquivo: string; linhas: string[][]; mapa: (Campo | "")[] } | null>(null);
  const [erro, setErro] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const itens = useMemo(() => {
    const q = norm(busca);
    return lista.filter((l) => l.tipo === tipo && [l.nome, l.fornecedor, l.material, l.faixa].some((v) => norm(v).includes(q)));
  }, [lista, tipo, busca]);
  const margem = itens.length ? itens.reduce((a, l) => a + (l.preco ? (l.preco - l.custo) / l.preco : 0), 0) / itens.length : 0;

  async function abrirArquivo(file?: File) {
    setErro("");
    if (!file) return;
    try {
      setLendo(true);
      const bruto = isImagem(file) ? (await lerImagemLentes({ data: { imagem: await imagemDataUrl(file) } })).linhas : await readTableFile(file);
      let rows = bruto.filter((r) => r.some((c) => c?.trim()));
      if (isImagem(file) && rows.length < 2) throw new Error("Nenhuma lente foi encontrada na foto. Tente uma imagem mais nítida.");
      const reconhece = (r: string[]) => r.filter((h) => COLUNAS.some((c) => c.alias.some((a) => norm(h ?? "").includes(a)))).length;
      const ini = rows.findIndex((r) => reconhece(r) >= 2);
      if (ini > 0) rows = rows.slice(ini);
      if (rows.length < 2) throw new Error("O arquivo precisa ter uma linha de títulos e pelo menos uma linha de dados.");
      const mapa = (rows[0] ?? []).map((h) => COLUNAS.find((c) => c.alias.some((a) => norm(h ?? "").includes(a)))?.k ?? ("" as const));
      setImp({ arquivo: file.name, linhas: rows, mapa });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmarImportacao() {
    if (!imp) return;
    const novos = imp.linhas.slice(1).map((r) => {
      const o: Record<Campo, string> = { ...VAZIO };
      imp.mapa.forEach((k, i) => { if (k) o[k] = r[i] ?? ""; });
      return { id: seq++, tipo, fornecedor: o.fornecedor, nome: o.nome, material: o.material, indice: o.indice, faixa: o.faixa, custo: num(o.custo), preco: num(o.preco) };
    }).filter((l) => l.nome);
    setLista((l) => [...novos, ...l]);
    setImp(null);
  }

  function exportar() {
    const linhas = [COLUNAS.map((c) => c.label), ...itens.map((l) => COLUNAS.map((c) => String(l[c.k]).replace(".", c.k === "custo" || c.k === "preco" ? "," : ".")))];
    const blob = new Blob(["\ufeff" + linhas.map((r) => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tipo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setLista((l) => [{ id: seq++, tipo, ...form, custo: num(form.custo), preco: num(form.preco) }, ...l]);
    setForm(VAZIO);
    setNovo(false);
  }

  const mapeadas = imp?.mapa.filter(Boolean).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tabelas de Lentes</p>
          <h1 className="text-2xl font-bold">{titulo}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!lista.some((l) => l.tipo === tipo)}
            onClick={() => { if (confirm(`Apagar todas as lentes de ${titulo}?`)) setLista((x) => x.filter((l) => l.tipo !== tipo)); }}>
            <Trash2 className="h-4 w-4" />Limpar tabela
          </Button>
          <Button variant="outline" onClick={exportar}><Download className="h-4 w-4" />Exportar</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Importar arquivo</Button>
          <Button onClick={() => setNovo(true)}><Plus className="h-4 w-4" />Nova lente</Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b">
        {Object.entries(TIPOS).map(([slug, label]) => (
          <Link key={slug} to="/lentes/$tipo" params={{ tipo: slug }}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${slug === tipo ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label} <span className="ml-1 rounded bg-muted px-1.5 text-xs">{lista.filter((l) => l.tipo === slug).length}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><div className="text-sm text-muted-foreground">Itens na tabela</div><div className="text-2xl font-bold">{itens.length}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Fornecedores</div><div className="text-2xl font-bold">{new Set(itens.map((l) => l.fornecedor)).size}</div></Card>
        <Card className="p-4"><div className="text-sm text-muted-foreground">Margem média</div><div className="text-2xl font-bold">{(margem * 100).toFixed(0)}%</div></Card>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); abrirArquivo(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${arrastando ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
        <FileUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Arraste sua tabela aqui ou clique para escolher</p>
        <p className="text-xs text-muted-foreground">Aceita PDF, PowerPoint (.pptx), Excel (.xlsx), Word (.docx), CSV, TXT, TSV e HTML. A primeira linha da tabela deve conter os títulos das colunas.</p>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => abrirArquivo(e.target.files?.[0])} />
      </div>
      {erro && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por lente, fornecedor, material ou faixa" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              {COLUNAS.map((c) => <th key={c.k} className={`py-2 pr-3 ${c.k === "custo" || c.k === "preco" ? "text-right" : ""}`}>{c.label}</th>)}<th />
            </tr></thead>
            <tbody>
              {itens.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{l.fornecedor}</td><td className="pr-3 font-medium">{l.nome}</td><td className="pr-3">{l.material}</td>
                  <td className="pr-3">{l.indice}</td><td className="pr-3">{l.faixa}</td>
                  <td className="pr-3 text-right text-muted-foreground">{brl(l.custo)}</td><td className="pr-3 text-right font-semibold">{brl(l.preco)}</td>
                  <td className="text-right"><Button size="icon" variant="ghost" aria-label={`Excluir ${l.nome}`} onClick={() => setLista((x) => x.filter((i) => i.id !== l.id))}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {itens.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhuma lente nesta tabela. Importe um arquivo ou cadastre manualmente.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova lente — {titulo}</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            {COLUNAS.map((c) => (
              <label key={c.k} className={c.k === "nome" ? "sm:col-span-2" : ""}>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{c.label}{c.k === "custo" || c.k === "preco" ? " (R$)" : ""}</span>
                <Input required={c.k === "nome"} inputMode={c.k === "custo" || c.k === "preco" ? "decimal" : undefined} value={form[c.k]} onChange={(e) => setForm({ ...form, [c.k]: e.target.value })} />
              </label>
            ))}
            <Button type="submit" className="sm:col-span-2">Salvar lente</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!imp} onOpenChange={(o) => !o && setImp(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Importar “{imp?.arquivo}”</DialogTitle></DialogHeader>
          {imp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {imp.linhas.length - 1} linhas encontradas · {mapeadas} de {imp.mapa.length} colunas reconhecidas. Confira a coluna correspondente de cada título antes de importar para <b className="text-foreground">{titulo}</b>.
              </p>
              <div className="max-h-80 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>{(imp.linhas[0] ?? []).map((h, i) => (
                      <th key={i} className="p-2 text-left align-top">
                        <div className="mb-1 font-semibold">{h || `Coluna ${i + 1}`}</div>
                        <select aria-label={`Campo para ${h}`} className="h-8 w-full rounded border border-input bg-background px-1 text-xs font-normal" value={imp.mapa[i]}
                          onChange={(e) => setImp({ ...imp, mapa: imp.mapa.map((m, j) => (j === i ? (e.target.value as Campo | "") : m)) })}>
                          <option value="">Ignorar</option>
                          {COLUNAS.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}
                        </select>
                      </th>
                    ))}</tr>
                  </thead>
                  <tbody>{imp.linhas.slice(1, 9).map((r, i) => <tr key={i} className="border-t">{(imp.linhas[0] ?? []).map((_, j) => <td key={j} className="p-2">{r[j]}</td>)}</tr>)}</tbody>
                </table>
              </div>
              {!imp.mapa.includes("nome") && <p className="text-sm text-destructive">Escolha qual coluna contém o nome da lente.</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImp(null)}>Cancelar</Button>
                <Button disabled={!imp.mapa.includes("nome")} onClick={confirmarImportacao}>Importar {imp.linhas.length - 1} linhas</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
