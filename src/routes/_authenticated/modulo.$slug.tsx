import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Construction, Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findLabel } from "@/lib/nav";
import { MODULES, type Mod } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/modulo/$slug")({
  head: ({ params }) => {
    const t = `${findLabel(params.slug)} — Visão Ótica`;
    const d = MODULES[params.slug]?.desc ?? `Módulo ${findLabel(params.slug)} do sistema de gestão para óticas.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: Modulo,
});

function Modulo() {
  const { slug } = Route.useParams();
  const mod = MODULES[slug];
  if (!mod) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{findLabel(slug)}</h1>
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Construction className="h-10 w-10 text-primary" />
          <p className="max-w-md text-muted-foreground">Esta tela ainda está em construção.</p>
          <Button asChild variant="outline"><Link to="/">Voltar ao painel</Link></Button>
        </Card>
      </div>
    );
  }
  return <Tabela key={slug} titulo={findLabel(slug)} mod={mod} />;
}

type Row = Record<string, string | number> & { _id: number };
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TONS = ["bg-primary/10 text-primary", "bg-success/10 text-success", "bg-warning/15 text-warning", "bg-destructive/10 text-destructive", "bg-muted text-muted-foreground"];

function Tabela({ titulo, mod }: { titulo: string; mod: Mod }) {
  const [rows, setRows] = useState<Row[]>(() => mod.linhas.map((l, i) => ({ _id: i, ...Object.fromEntries(mod.campos.map(([k], j) => [k, l[j] ?? ""])) })));
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const stField = mod.campos.find(([k]) => k === mod.status);
  const opcoes = stField && Array.isArray(stField[2]) ? stField[2] : [];
  const tom = (v: string) => TONS[Math.max(0, opcoes.indexOf(v)) % TONS.length];

  const itens = useMemo(() => {
    const q = busca.toLowerCase();
    return rows.filter((r) => (!filtro || r[mod.status!] === filtro) && Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [rows, busca, filtro, mod.status]);
  const total = mod.valor ? itens.reduce((a, r) => a + Number(r[mod.valor!] || 0), 0) : 0;

  const fmt = (v: string | number, t: unknown) =>
    t === "m" ? brl(Number(v)) : t === "d" && v ? String(v).split("-").reverse().join("/") : String(v);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const novo: Row = { _id: Date.now() };
    for (const [k, , t] of mod.campos) {
      const v = form[k] ?? (Array.isArray(t) ? t[0] ?? "" : "");
      novo[k] = t === "m" || t === "n" ? Number(String(v).replace(",", ".")) || 0 : v;
    }
    setRows((r) => [novo, ...r]);
    setForm({});
    setAberto(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold">{titulo}</h1><p className="text-sm text-muted-foreground">{mod.desc}</p></div>
        <Button onClick={() => setAberto(true)}><Plus className="h-4 w-4" />Novo registro</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><div className="text-sm text-muted-foreground">Registros</div><div className="text-2xl font-bold">{itens.length}</div></Card>
        {mod.valor && <Card className="p-4"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{brl(total)}</div></Card>}
        {opcoes.slice(0, mod.valor ? 2 : 3).map((o) => (
          <Card key={o} role="button" tabIndex={0} onClick={() => setFiltro(filtro === o ? null : o)}
            className={`cursor-pointer p-4 transition-shadow hover:shadow-md ${filtro === o ? "ring-2 ring-primary" : ""}`}>
            <div className="text-sm text-muted-foreground">{o}</div><div className="text-2xl font-bold">{rows.filter((r) => r[mod.status!] === o).length}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {opcoes.length > 0 && (
            <select aria-label="Filtrar" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={filtro ?? ""} onChange={(e) => setFiltro(e.target.value || null)}>
              <option value="">Todos</option>{opcoes.map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              {mod.campos.map(([k, l, t]) => <th key={k} className={`py-2 pr-3 ${t === "m" || t === "n" ? "text-right" : ""}`}>{l}</th>)}<th />
            </tr></thead>
            <tbody>
              {itens.map((r) => (
                <tr key={r._id} className="border-b last:border-0">
                  {mod.campos.map(([k, , t], i) => (
                    <td key={k} className={`py-2 pr-3 ${i === 0 || i === 1 ? "font-medium" : ""} ${t === "m" || t === "n" ? "text-right" : ""}`}>
                      {k === mod.status ? (
                        <select aria-label={`Alterar ${k}`} value={String(r[k])} onChange={(e) => setRows((x) => x.map((y) => (y._id === r._id ? { ...y, [k]: e.target.value } : y)))}
                          className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold ${tom(String(r[k]))}`}>
                          {opcoes.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : fmt(r[k] ?? "", t)}
                    </td>
                  ))}
                  <td className="text-right"><Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => setRows((x) => x.filter((y) => y._id !== r._id))}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {itens.length === 0 && <tr><td colSpan={mod.campos.length + 1} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo registro — {titulo}</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            {mod.campos.map(([k, l, t], i) => (
              <label key={k}>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{l}{t === "m" ? " (R$)" : ""}</span>
                {Array.isArray(t) ? (
                  <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form[k] ?? t[0]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                    {t.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input required={i === 0} type={t === "d" ? "date" : "text"} inputMode={t === "m" || t === "n" ? "decimal" : undefined}
                    value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                )}
              </label>
            ))}
            <Button type="submit" className="sm:col-span-2">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
