import { printElement } from "@/lib/print";
import { distribuirVenda } from "@/lib/venda-etapas";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, FileText, Minus, Plus, Printer, Search, ShoppingBag, Trash2, Eye, ArrowRightLeft, Paperclip, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { brl, calcularTotais, valorParcela, type Desconto, type ItemVenda } from "@/lib/venda";
import { VARILUX } from "@/lib/lentes-varilux";
import logo from "@/assets/otica-louise.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/realizar-venda")({
  head: () => ({
    meta: [
      { title: "Realizar Venda — Ótica Louise" },
      { name: "description", content: "Monte a venda, emita pedido ou orçamento e imprima para o cliente." },
      { property: "og:title", content: "Realizar Venda — Ótica Louise" },
      { property: "og:description", content: "Monte a venda, emita pedido ou orçamento e imprima para o cliente." },
    ],
  }),
  component: RealizarVenda,
});

type Cliente = { id: string; nome: string; cpf: string; telefone: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reg = any;
type ItemCatalogo = { codigo: string; descricao: string; grupo: string; preco: number; origem: "produto" | "lente" };
const NOMES_LENTES: Record<string, string> = { "lentes-monofocais": "Lente monofocal", "lentes-multifocais": "Lente multifocal", "lentes-de-contato": "Lente de contato", tratamentos: "Tratamento" };

const PAGAMENTOS = ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito", "Boleto", "Crediário"];
type Olho = { esf: string; cil: string; eixo: string; adicao: string; dnp: string };
const OLHO: Olho = { esf: "", cil: "", eixo: "", adicao: "", dnp: "" };

type Documento = {
  numero: string; tipo: "Pedido" | "Orçamento"; data: string; validade: string; cliente: Cliente; vendedor: string;
  itens: ItemVenda[]; desconto: Desconto; pagamento: string; parcelas: number; entrada: number;
  receita: { od: Olho; oe: Olho }; entrega: string; obs: string;
  anexo?: { nome: string; tipo: string; url: string } | undefined;
};

const hoje = () => new Date().toISOString().slice(0, 10);
const somarDias = (d: string, n: number) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const fmtData = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");
const sel = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

const EXEMPLOS: Documento[] = [];

function RealizarVenda() {
  const { nome } = useAuth();
  const [docs, setDocs] = useState<Documento[]>(EXEMPLOS);
  const [seq, setSeq] = useState({ ped: 1, orc: 1 });
  const [clienteId, setClienteId] = useState<string>("");
  const [CLIENTES, setClientes] = useState<Cliente[]>([]);
  useEffect(() => {
    supabase.from("clientes").select("id,nome,cpf,telefone").order("nome").then(({ data }) => setClientes(data ?? []));
  }, []);
  async function registrar(doc: Documento) {
    const { anexo, ...resto } = doc;
    const { error } = await supabase.from("cliente_vendas").insert({
      cliente_id: doc.cliente.id, numero: doc.numero, tipo: doc.tipo, total: calcularTotais(doc.itens, doc.desconto).total,
      dados: JSON.parse(JSON.stringify({ ...resto, anexo: anexo ? { nome: anexo.nome, tipo: anexo.tipo } : null })),
    });
    if (error) toast.error("Não foi possível salvar no cadastro do cliente.");
    else toast.success(`${doc.tipo} ${doc.numero} salvo no cadastro de ${doc.cliente.nome}.`);
  }
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"produto" | "lente">("produto");
  const [CATALOGO, setCatalogo] = useState<ItemCatalogo[]>([]);
  useEffect(() => {
    supabase.from("dados_salvos").select("chave, dados").then(({ data }) => {
      const out: ItemCatalogo[] = [];
      const rows = data ?? [];
      for (const r of rows) {
        const lista = Array.isArray(r.dados) ? (r.dados as Reg[]) : [];
        if (r.chave === "produtos") for (const p of lista) out.push({ codigo: String(p.codigo || `P${p.id}`), descricao: String(p.nome ?? ""), grupo: `${p.categoria ?? "Produto"}${Number(p.estoque) >= 0 ? ` · estoque ${p.estoque}` : ""}`, preco: Number(p.preco) || 0, origem: "produto" });
        if (r.chave.startsWith("lentes:")) for (const l of lista) out.push(lenteItem(l, r.chave.slice(7)));
      }
      if (!rows.some((r) => r.chave === "lentes:lentes-multifocais")) for (const l of VARILUX) out.push(lenteItem(l as unknown as Reg, "lentes-multifocais"));
      setCatalogo(out);
    });
  }, []);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [desconto, setDesconto] = useState<Desconto>({ tipo: "percentual", valor: 0 });
  const [pagamento, setPagamento] = useState("PIX");
  const [parcelas, setParcelas] = useState(1);
  const [entrada, setEntrada] = useState(0);
  const [od, setOd] = useState<Olho>(OLHO);
  const [oe, setOe] = useState<Olho>(OLHO);
  const [entrega, setEntrega] = useState(somarDias(hoje(), 7));
  const [obs, setObs] = useState("");
  const [anexo, setAnexo] = useState<Documento["anexo"]>();
  const [erro, setErro] = useState("");
  const [visualizar, setVisualizar] = useState<Documento | null>(null);

  const cliente = CLIENTES.find((c) => c.id === clienteId);
  const totais = calcularTotais(itens, desconto);
  const parcelavel = ["Cartão de crédito", "Boleto", "Crediário"].includes(pagamento);
  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return CATALOGO.filter((p) => p.origem === aba && (!q || p.descricao.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || p.grupo.toLowerCase().includes(q)));
  }, [busca, aba, CATALOGO]);

  function adicionar(p: (typeof CATALOGO)[number]) {
    setItens((l) => {
      const ex = l.find((i) => i.codigo === p.codigo);
      if (ex) return l.map((i) => (i.codigo === p.codigo ? { ...i, qtd: i.qtd + 1 } : i));
      return [...l, { id: crypto.randomUUID(), codigo: p.codigo, descricao: p.descricao, preco: p.preco, qtd: 1 }];
    });
  }
  const alterar = (id: string, patch: Partial<ItemVenda>) => setItens((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  function limpar() {
    setClienteId(""); setItens([]); setDesconto({ tipo: "percentual", valor: 0 }); setPagamento("PIX"); setParcelas(1);
    setEntrada(0); setOd(OLHO); setOe(OLHO); setEntrega(somarDias(hoje(), 7)); setObs(""); setErro(""); setAnexo(undefined);
  }

  function emitir(tipo: Documento["tipo"]) {
    if (!cliente) return setErro("Selecione o cliente.");
    if (itens.length === 0) return setErro("Adicione pelo menos um item.");
    const numero = tipo === "Pedido" ? `PED-${seq.ped}` : `ORC-${String(seq.orc).padStart(4, "0")}`;
    setSeq((s) => (tipo === "Pedido" ? { ...s, ped: s.ped + 1 } : { ...s, orc: s.orc + 1 }));
    const doc: Documento = {
      numero, tipo, data: hoje(), validade: tipo === "Orçamento" ? somarDias(hoje(), 10) : "", cliente, vendedor: nome || "Vendedor",
      itens, desconto, pagamento, parcelas: parcelavel ? parcelas : 1, entrada, receita: { od, oe }, entrega: tipo === "Pedido" ? entrega : "", obs, anexo,
    };
    setDocs((d) => [doc, ...d]);
    void registrar(doc);
    if (tipo === "Pedido") distribuirVenda({ ...doc, cliente: cliente.nome })
      .then(() => toast.success("Venda lançada em Vendas, O.S., Financeiro e Estoque."))
      .catch(() => toast.error("Não foi possível lançar a venda em todas as etapas."));
    limpar();
    setVisualizar(doc);
  }

  function converter(doc: Documento) {
    const numero = `PED-${seq.ped}`;
    setSeq((s) => ({ ...s, ped: s.ped + 1 }));
    const novo: Documento = { ...doc, numero, tipo: "Pedido", data: hoje(), validade: "", entrega: somarDias(hoje(), 7), obs: `${doc.obs ? doc.obs + " · " : ""}Gerado a partir do ${doc.numero}` };
    setDocs((d) => [novo, ...d]);
    void registrar(novo);
    distribuirVenda({ ...novo, cliente: novo.cliente.nome })
      .then(() => toast.success("Venda lançada em Vendas, O.S., Financeiro e Estoque."))
      .catch(() => toast.error("Não foi possível lançar a venda em todas as etapas."));
    setVisualizar(novo);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingBag className="h-6 w-6 shrink-0 text-primary" />Realizar venda</h1>
          <p className="text-sm text-muted-foreground">Monte a venda, emita um pedido ou orçamento e imprima para o cliente.</p>
        </div>
        <Button variant="outline" onClick={limpar}>Limpar</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">1. Cliente</h2>
            <select className={sel} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione o cliente…</option>
              {CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.cpf}</option>)}
            </select>
            {cliente && <p className="mt-2 text-sm text-muted-foreground">Telefone: {cliente.telefone}</p>}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">2. Produtos e lentes</h2>
            <div className="mb-3 flex gap-2">
              {(["produto", "lente"] as const).map((a) => (
                <Button key={a} type="button" size="sm" variant={aba === a ? "default" : "outline"} onClick={() => setAba(a)}>
                  {a === "produto" ? "Produtos" : "Lentes"} ({CATALOGO.filter((c) => c.origem === a).length})
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
              {resultados.map((p) => (
                <button key={p.origem + p.codigo + p.descricao} onClick={() => adicionar(p)} className="flex items-center justify-between gap-2 rounded-md border p-3 text-left text-sm transition-colors hover:bg-accent">
                  <span className="min-w-0"><span className="block truncate font-medium">{p.descricao}</span><span className="text-xs text-muted-foreground">{p.codigo} · {p.grupo}</span></span>
                  <span className="shrink-0 font-semibold">{brl(p.preco)}</span>
                </button>
              ))}
              {resultados.length === 0 && <p className="col-span-full rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">{aba === "produto" ? "Nenhum produto cadastrado ou encontrado." : "Nenhuma lente cadastrada ou encontrada."}</p>}
            </div>

            <div className="mt-5 space-y-2">
              {itens.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum item adicionado. Clique em um produto acima.</p>}
              {itens.map((i) => (
                <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_auto_110px_auto]">
                  <div className="min-w-0"><div className="truncate text-sm font-medium">{i.descricao}</div><div className="text-xs text-muted-foreground">{i.codigo} · {brl(i.preco * i.qtd)}</div></div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Diminuir" onClick={() => alterar(i.id, { qtd: Math.max(1, i.qtd - 1) })}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center text-sm">{i.qtd}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Aumentar" onClick={() => alterar(i.id, { qtd: i.qtd + 1 })}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <Input type="number" step="0.01" min={0} aria-label="Preço unitário" value={i.preco} onChange={(e) => alterar(i.id, { preco: Number(e.target.value) || 0 })} />
                  <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">3. Receita (opcional)</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1">Olho</th><th>Esférico</th><th>Cilíndrico</th><th>Eixo</th><th>Adição</th><th>DNP</th></tr></thead>
                <tbody>
                  {([["OD", od, setOd], ["OE", oe, setOe]] as const).map(([lbl, v, set]) => (
                    <tr key={lbl}>
                      <td className="py-1 pr-2 font-semibold">{lbl}</td>
                      {(Object.keys(OLHO) as (keyof Olho)[]).map((k) => (
                        <td key={k} className="pr-2"><Input aria-label={`${lbl} ${k}`} value={v[k]} onChange={(e) => set({ ...v, [k]: e.target.value })} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                <Paperclip className="h-4 w-4" />{anexo ? "Trocar arquivo" : "Anexar receita (JPG ou PDF)"}
                <input type="file" accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  if (!/\.(jpe?g|pdf)$/i.test(file.name)) return setErro("A receita deve ser um arquivo JPG ou PDF.");
                  if (file.size > 10 * 1024 * 1024) return setErro("Arquivo muito grande (máximo 10 MB).");
                  setErro(""); setAnexo({ nome: file.name, tipo: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"), url: URL.createObjectURL(file) });
                }} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                <Camera className="h-4 w-4" />Tirar foto
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]; e.target.value = "";
                  if (!file) return;
                  if (!file.type.startsWith("image/")) return setErro("A foto deve ser uma imagem.");
                  if (file.size > 10 * 1024 * 1024) return setErro("Foto muito grande (máximo 10 MB).");
                  setErro(""); setAnexo({ nome: file.name || "foto-receita.jpg", tipo: file.type, url: URL.createObjectURL(file) });
                }} />
              </label>
              {anexo && (
                <span className="inline-flex items-center gap-2 text-sm">
                  <a href={anexo.url} target="_blank" rel="noreferrer" className="text-primary underline">{anexo.nome}</a>
                  <button aria-label="Remover anexo" onClick={() => setAnexo(undefined)} className="rounded p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
                </span>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold">4. Pagamento e resumo</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
              <Input type="number" min={0} step="0.01" aria-label="Desconto" placeholder="Desconto" value={desconto.valor || ""} onChange={(e) => setDesconto({ ...desconto, valor: Number(e.target.value) || 0 })} />
              <select className={sel} value={desconto.tipo} onChange={(e) => setDesconto({ ...desconto, tipo: e.target.value as Desconto["tipo"] })}>
                <option value="percentual">%</option><option value="valor">R$</option>
              </select>
            </div>
            <select className={sel} aria-label="Forma de pagamento" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
              {PAGAMENTOS.map((p) => <option key={p}>{p}</option>)}
            </select>
            {parcelavel && (
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">Entrada<Input type="number" min={0} step="0.01" value={entrada || ""} onChange={(e) => setEntrada(Number(e.target.value) || 0)} /></label>
                <label className="text-xs text-muted-foreground">Parcelas
                  <select className={sel} value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
                    {Array.from({ length: 10 }, (_, n) => <option key={n} value={n + 1}>{n + 1}x</option>)}
                  </select>
                </label>
              </div>
            )}
            <label className="block text-xs text-muted-foreground">Previsão de entrega<Input type="date" value={entrega} onChange={(e) => setEntrega(e.target.value)} /></label>
            <textarea className={sel} rows={2} placeholder="Observações" value={obs} onChange={(e) => setObs(e.target.value)} />

            <div className="space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{brl(totais.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Desconto</span><span>- {brl(totais.valorDesconto)}</span></div>
              <div className="flex justify-between pt-1 text-lg font-bold"><span>Total</span><span className="text-primary">{brl(totais.total)}</span></div>
              {parcelavel && parcelas > 1 && <div className="text-right text-xs text-muted-foreground">{entrada > 0 && `Entrada ${brl(entrada)} + `}{parcelas}x de {brl(valorParcela(totais.total, entrada, parcelas))}</div>}
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <div className="grid gap-2">
              <Button onClick={() => emitir("Pedido")}><ShoppingBag className="mr-2 h-4 w-4" />Emitir pedido</Button>
              <Button variant="outline" onClick={() => emitir("Orçamento")}><FileText className="mr-2 h-4 w-4" />Emitir orçamento</Button>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Pedidos e orçamentos emitidos</h2>
        <div className="divide-y">
          {docs.map((d) => (
            <div key={d.numero} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className={d.tipo === "Pedido" ? "rounded bg-primary/15 px-2 py-0.5 text-xs text-primary" : "rounded bg-muted px-2 py-0.5 text-xs"}>{d.tipo}</span>
                  {d.numero} · <span className="truncate">{d.cliente.nome}</span>
                </div>
                <div className="text-xs text-muted-foreground">{fmtData(d.data)} · {d.pagamento} · {brl(calcularTotais(d.itens, d.desconto).total)}</div>
              </div>
              <div className="flex gap-1">
                {d.tipo === "Orçamento" && <Button size="sm" variant="ghost" onClick={() => converter(d)} title="Transformar em pedido"><ArrowRightLeft className="h-4 w-4" /><span className="ml-1 hidden sm:inline">Virar pedido</span></Button>}
                <Button size="sm" variant="outline" onClick={() => setVisualizar(d)}><Eye className="h-4 w-4" /><span className="ml-1 hidden sm:inline">Ver / imprimir</span></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!visualizar} onOpenChange={(o) => !o && setVisualizar(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader className="no-print"><DialogTitle>{visualizar?.tipo} {visualizar?.numero}</DialogTitle></DialogHeader>
          {visualizar && <DocumentoImpresso doc={visualizar} />}
          <div className="no-print flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVisualizar(null)}>Fechar</Button>
            <Button onClick={() => printElement(document.querySelector(".print-area") as HTMLElement)}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentoImpresso({ doc }: { doc: Documento }) {
  const t = calcularTotais(doc.itens, doc.desconto);
  const temReceita = [doc.receita.od, doc.receita.oe].some((o) => Object.values(o).some(Boolean));
  return (
    <div className="print-area space-y-5 rounded-md border bg-card p-6 text-sm text-card-foreground">
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <img src={logo.url} alt="Ótica Louise" className="h-16 w-16 rounded-full object-cover" />
          <div><div className="text-lg font-bold">Ótica Louise</div><div className="text-xs text-muted-foreground">Seu olhar, nossa prioridade</div><div className="text-xs text-muted-foreground">Rua das Flores, 250 — Centro · (11) 4000-1234</div></div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold uppercase">{doc.tipo}</div>
          <div className="font-mono">{doc.numero}</div>
          <div className="text-xs text-muted-foreground">Emitido em {fmtData(doc.data)}</div>
          {doc.validade && <div className="text-xs text-muted-foreground">Válido até {fmtData(doc.validade)}</div>}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div><div className="text-xs text-muted-foreground">Cliente</div><div className="font-medium">{doc.cliente.nome}</div><div className="text-xs">CPF {doc.cliente.cpf} · {doc.cliente.telefone}</div></div>
        <div className="sm:text-right"><div className="text-xs text-muted-foreground">Vendedor</div><div className="font-medium">{doc.vendedor}</div>{doc.entrega && <div className="text-xs">Entrega prevista: {fmtData(doc.entrega)}</div>}</div>
      </div>

      <table className="w-full">
        <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1">Código</th><th>Descrição</th><th className="text-center">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr></thead>
        <tbody>
          {doc.itens.map((i) => (
            <tr key={i.id} className="border-b"><td className="py-1.5 font-mono text-xs">{i.codigo}</td><td>{i.descricao}</td><td className="text-center">{i.qtd}</td><td className="text-right">{brl(i.preco)}</td><td className="text-right">{brl(i.preco * i.qtd)}</td></tr>
          ))}
        </tbody>
      </table>

      {temReceita && (
        <table className="w-full text-center text-xs">
          <thead><tr className="border-b text-muted-foreground"><th className="py-1 text-left">Receita</th><th>Esf.</th><th>Cil.</th><th>Eixo</th><th>Adição</th><th>DNP</th></tr></thead>
          <tbody>
            {([["OD", doc.receita.od], ["OE", doc.receita.oe]] as const).map(([l, o]) => (
              <tr key={l} className="border-b"><td className="py-1 text-left font-semibold">{l}</td><td>{o.esf || "—"}</td><td>{o.cil || "—"}</td><td>{o.eixo || "—"}</td><td>{o.adicao || "—"}</td><td>{o.dnp || "—"}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      {doc.anexo && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Receita anexada: <a href={doc.anexo.url} target="_blank" rel="noreferrer" className="text-primary underline">{doc.anexo.nome}</a></div>
          {doc.anexo.tipo.startsWith("image/") && <img src={doc.anexo.url} alt="Receita anexada" className="max-h-96 rounded border object-contain" />}
        </div>
      )}

      <div className="ml-auto max-w-xs space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(t.subtotal)}</span></div>
        <div className="flex justify-between"><span>Desconto</span><span>- {brl(t.valorDesconto)}</span></div>
        <div className="flex justify-between border-t pt-1 text-base font-bold"><span>Total</span><span>{brl(t.total)}</span></div>
        <div className="text-right text-xs text-muted-foreground">
          {doc.pagamento}{doc.parcelas > 1 && ` · ${doc.entrada > 0 ? `entrada ${brl(doc.entrada)} + ` : ""}${doc.parcelas}x de ${brl(valorParcela(t.total, doc.entrada, doc.parcelas))}`}
        </div>
      </div>

      {doc.obs && <p className="text-xs"><b>Observações:</b> {doc.obs}</p>}
      <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
        <div className="border-t pt-1">Assinatura do cliente</div>
        <div className="border-t pt-1">Ótica Louise</div>
      </div>
      {doc.tipo === "Orçamento" && <p className="text-center text-xs text-muted-foreground">Orçamento sem valor fiscal. Preços sujeitos a alteração após a validade.</p>}
    </div>
  );
}

function lenteItem(l: Reg, tipo: string): ItemCatalogo {
  const desc = [l.nome, l.material, l.indice].filter(Boolean).join(" ");
  return { codigo: String(l.id ? `L${l.id}` : desc), descricao: desc, grupo: [NOMES_LENTES[tipo] ?? "Lente", l.fornecedor, l.faixa].filter(Boolean).join(" · "), preco: Number(l.preco) || 0, origem: "lente" };
}
