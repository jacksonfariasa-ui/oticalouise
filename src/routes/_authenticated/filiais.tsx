import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, MapPin, Phone, Mail, Clock, Users, TrendingUp, ShoppingCart, Wrench, Package, Pencil, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFiliais, updateFilial, brl, MESES, STATUS_CLS, type Filial, pctMeta } from "@/lib/filiais";

export const Route = createFileRoute("/_authenticated/filiais")({
  head: () => ({
    meta: [
      { title: "Filiais — Ótica Louise" },
      { name: "description", content: "Gestão e desempenho das unidades Matriz, Rorainópolis e Pintolândia." },
      { property: "og:title", content: "Filiais — Ótica Louise" },
      { property: "og:description", content: "Gestão e desempenho das unidades da Ótica Louise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Filiais,
});

function Filiais() {
  const lista = useFiliais();
  const [selId, setSelId] = useState("matriz");
  const [edit, setEdit] = useState<Filial | null>(null);
  const sel = lista.find((f) => f.id === selId)!;

  const total = lista.reduce((a, f) => a + f.faturamento, 0);
  const totalVendas = lista.reduce((a, f) => a + f.vendas, 0);
  const totalOS = lista.reduce((a, f) => a + f.osAbertas, 0);
  const totalEquipe = lista.reduce((a, f) => a + f.equipe.length, 0);
  const ranking = [...lista].sort((a, b) => pctMeta(b.faturamento, b.meta) - pctMeta(a.faturamento, a.meta));

  function salvar() {
    if (!edit) return;
    const e = edit; updateFilial(e.id, (f) => ({ ...f, ...e }));
    setEdit(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Filiais</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada e detalhada das unidades da Ótica Louise · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Faturamento da rede" value={brl(total)} />
        <Kpi icon={ShoppingCart} label="Vendas no mês" value={String(totalVendas)} />
        <Kpi icon={Wrench} label="O.S. em aberto" value={String(totalOS)} />
        <Kpi icon={Users} label="Colaboradores" value={String(totalEquipe)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {lista.map((f) => {
          const pct = pctMeta(f.faturamento, f.meta);
          return (
            <button key={f.id} onClick={() => setSelId(f.id)}
              className={cn("rounded-xl border bg-card p-5 text-left transition hover:border-primary", selId === f.id && "border-primary ring-2 ring-primary/30")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><span className="font-semibold">{f.nome}</span></div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLS[f.status])}>{f.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.cidade}</p>
              <div className="mt-4 text-xl font-bold">{brl(f.faturamento)}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{pct}% da meta de {brl(f.meta)}</p>
            </button>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-5 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{sel.tipo}</div>
              <h2 className="text-lg font-bold">{sel.nome}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEdit(sel)}><Pencil className="mr-1 h-4 w-4" />Editar dados</Button>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info icon={MapPin} text={`${sel.endereco}, ${sel.cidade}`} />
            <Info icon={Phone} text={sel.telefone} />
            <Info icon={Mail} text={sel.email} />
            <Info icon={Clock} text={sel.horario} />
            <Info icon={Building2} text={`CNPJ ${sel.cnpj}`} />
            <Info icon={Users} text={`Gerente: ${sel.gerente}`} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="Vendas" value={sel.vendas} icon={ShoppingCart} />
            <Mini label="O.S. abertas" value={sel.osAbertas} icon={Wrench} />
            <Mini label="Itens em estoque" value={sel.estoque} icon={Package} />
            <Mini label="Clientes" value={sel.clientes} icon={Users} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Faturamento mensal</h3>
            <div className="flex h-40 items-end gap-3">
              {sel.mensal.map((v, i) => {
                const max = Math.max(1, ...sel.mensal);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{brl(v)}</span>
                    <div className="w-full rounded-t bg-primary/80" style={{ height: `${(v / max) * 110}px` }} />
                    <span className="text-xs text-muted-foreground">{MESES[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Equipe ({sel.equipe.length})</h3>
            <ul className="space-y-2">
              {sel.equipe.map((m) => (
                <li key={m.nome} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold">{m.nome.charAt(0)}</div>
                  <div className="min-w-0"><div className="truncate text-sm font-medium">{m.nome}</div><div className="text-xs text-muted-foreground">{m.cargo}</div></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" />Ranking de metas</h3>
            <ol className="space-y-2">
              {ranking.map((f, i) => (
                <li key={f.id} className="flex items-center justify-between text-sm">
                  <span>{i + 1}º {f.nome}</span>
                  <span className="font-semibold">{pctMeta(f.faturamento, f.meta)}%</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar {edit?.nome}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3 sm:grid-cols-2">
              {([["endereco", "Endereço"], ["cidade", "Cidade"], ["telefone", "Telefone"], ["email", "E-mail"], ["horario", "Horário"], ["gerente", "Gerente"]] as const).map(([k, l]) => (
                <label key={k} className="space-y-1 text-sm"><span className="text-muted-foreground">{l}</span>
                  <Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></label>
              ))}
              <label className="space-y-1 text-sm"><span className="text-muted-foreground">Meta mensal (R$)</span>
                <Input type="number" value={edit.meta} onChange={(e) => setEdit({ ...edit, meta: Number(e.target.value) || 0 })} /></label>
              <label className="space-y-1 text-sm"><span className="text-muted-foreground">Status</span>
                <select className="h-9 w-full rounded-md border bg-background px-2" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as Filial["status"] })}>
                  <option>Ativa</option><option>Em reforma</option><option>Inativa</option>
                </select></label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
                <Button onClick={salvar}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 text-lg font-bold md:text-xl">{value}</div>
    </Card>
  );
}
function Mini({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-1 text-lg font-bold">{value.toLocaleString("pt-BR")}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Info({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span>{text}</span></div>;
}
