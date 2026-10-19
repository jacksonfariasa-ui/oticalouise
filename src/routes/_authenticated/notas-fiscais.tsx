import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Ban, Download, FileText, Plus, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { registrarAtividade } from "@/lib/atividades";
import { brl } from "@/lib/venda";
import { STATUS_NOTA, TIPOS_NOTA, totalNota, validarNota, type ItemNota, type TipoNota } from "@/lib/nota-fiscal";
import { cancelarNota, consultarNota, emitirNota } from "@/lib/nota-fiscal.functions";

export const Route = createFileRoute("/_authenticated/notas-fiscais")({
  head: () => ({
    meta: [
      { title: "Notas Fiscais — Ótica Louise" },
      { name: "description", content: "Emissão e consulta de NFC-e, NF-e e NFS-e da ótica." },
      { property: "og:title", content: "Notas Fiscais — Ótica Louise" },
      { property: "og:description", content: "Emissão e consulta de NFC-e, NF-e e NFS-e da ótica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotasFiscais,
});

type Nota = { id: string; ref: string; tipo: string; status: string; ambiente: string; numero: string; serie: string; cliente_nome: string; cliente_doc: string; valor: number; mensagem: string; url_pdf: string; url_xml: string; created_at: string };
type Venda = { id: string; numero: string; tipo: string; dados: { pagamento?: string; itens?: { codigo: string; descricao: string; preco: number; qtd: number }[] }; clientes: { nome: string; cpf: string; email: string } | null };
const PAGAMENTOS = ["Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito", "Boleto", "Crediário"];
const COR: Record<string, string> = { autorizado: "bg-primary/15 text-primary", processando: "bg-muted text-foreground", erro: "bg-destructive/15 text-destructive", cancelado: "bg-muted text-muted-foreground line-through", rascunho: "bg-muted" };
const ITEM_VAZIO: ItemNota = { codigo: "", descricao: "", qtd: 1, preco: 0, ncm: "", cfop: "" };
const inp = "w-full rounded-md border bg-background px-3 py-2 text-sm";

function NotasFiscais() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [aberto, setAberto] = useState(false);
  const [cancelando, setCancelando] = useState<Nota | null>(null);
  const consultar = useServerFn(consultarNota);
  const cancelar = useServerFn(cancelarNota);

  const carregar = () => supabase.from("notas_fiscais").select("*").order("created_at", { ascending: false }).limit(300).then(({ data }) => setNotas((data ?? []) as Nota[]));
  useEffect(() => { carregar(); }, []);

  const lista = useMemo(() => notas.filter((n) => (filtro === "todas" || n.tipo === filtro) &&
    `${n.numero} ${n.cliente_nome} ${n.cliente_doc}`.toLowerCase().includes(busca.toLowerCase())), [notas, busca, filtro]);
  const mes = new Date().toISOString().slice(0, 7);
  const doMes = notas.filter((n) => n.created_at.startsWith(mes) && n.status === "autorizado");
  const cards = [
    { l: "Autorizadas no mês", v: String(doMes.length) },
    { l: "Valor autorizado no mês", v: brl(doMes.reduce((s, n) => s + Number(n.valor), 0)) },
    { l: "Processando", v: String(notas.filter((n) => n.status === "processando").length) },
    { l: "Com erro", v: String(notas.filter((n) => n.status === "erro").length) },
  ];

  async function atualizar(n: Nota) {
    try { const r = await consultar({ data: { ref: n.ref } }); toast.success(`Situação: ${STATUS_NOTA[r.status] ?? r.status}`); carregar(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground">Emita cupom, nota de produto e nota de serviço, e acompanhe a situação de cada uma.</p>
        </div>
        <button onClick={() => setAberto(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Emitir nota</button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => <div key={c.l} className="rounded-xl border bg-card p-4"><div className="text-xs text-muted-foreground">{c.l}</div><div className="mt-1 text-xl font-bold">{c.v}</div></div>)}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por número, cliente ou CPF/CNPJ" className={inp + " pl-9"} />
        </div>
        {[{ value: "todas", label: "Todas" }, ...TIPOS_NOTA].map((t) => (
          <button key={t.value} onClick={() => setFiltro(t.value)} className={`rounded-full border px-3 py-1.5 text-sm ${filtro === t.value ? "border-primary bg-primary text-primary-foreground" : ""}`}>{t.label}</button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-3">Data</th><th className="p-3">Tipo</th><th className="p-3">Número</th><th className="p-3">Cliente</th><th className="p-3 text-right">Valor</th><th className="p-3">Situação</th><th className="p-3 text-right">Ações</th></tr></thead>
          <tbody>
            {lista.map((n) => (
              <tr key={n.id} className="border-b last:border-0 align-top">
                <td className="p-3 whitespace-nowrap">{new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="p-3 whitespace-nowrap">{TIPOS_NOTA.find((t) => t.value === n.tipo)?.label}{n.ambiente !== "producao" && <span className="ml-1 text-[10px] uppercase text-muted-foreground">teste</span>}</td>
                <td className="p-3">{n.numero ? `${n.numero}${n.serie ? "/" + n.serie : ""}` : "—"}</td>
                <td className="p-3">{n.cliente_nome || "Consumidor final"}<div className="text-xs text-muted-foreground">{n.cliente_doc}</div></td>
                <td className="p-3 text-right">{brl(Number(n.valor))}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COR[n.status] ?? ""}`}>{STATUS_NOTA[n.status] ?? n.status}</span>
                  {n.mensagem && <div className="mt-1 max-w-xs text-xs text-muted-foreground">{n.mensagem}</div>}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {n.url_pdf && <a href={n.url_pdf} target="_blank" rel="noreferrer" title="Abrir nota (PDF)" className="rounded-md border p-1.5 hover:bg-accent"><FileText className="h-4 w-4" /></a>}
                    {n.url_xml && <a href={n.url_xml} target="_blank" rel="noreferrer" title="Baixar XML" className="rounded-md border p-1.5 hover:bg-accent"><Download className="h-4 w-4" /></a>}
                    {n.status !== "cancelado" && <button title="Atualizar situação" onClick={() => atualizar(n)} className="rounded-md border p-1.5 hover:bg-accent"><RefreshCw className="h-4 w-4" /></button>}
                    {n.status === "autorizado" && <button title="Cancelar nota" onClick={() => setCancelando(n)} className="rounded-md border p-1.5 text-destructive hover:bg-accent"><Ban className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma nota emitida ainda. Clique em <b>Emitir nota</b> para começar.</td></tr>}
          </tbody>
        </table>
      </div>

      <EmitirDialog open={aberto} onClose={() => setAberto(false)} onDone={carregar} />
      <CancelarDialog nota={cancelando} onClose={() => setCancelando(null)} onDone={carregar} cancelar={cancelar} />
    </div>
  );
}

function EmitirDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const emitir = useServerFn(emitirNota);
  const [tipo, setTipo] = useState<TipoNota>("nfce");
  const [cliente, setCliente] = useState({ nome: "", doc: "", email: "" });
  const [itens, setItens] = useState<ItemNota[]>([{ ...ITEM_VAZIO }]);
  const [pagamento, setPagamento] = useState("Pix");
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("cliente_vendas").select("id,numero,tipo,dados,clientes(nome,cpf,email)").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setVendas(((data ?? []) as unknown as Venda[]).filter((v) => !/or[cç]amento/i.test(v.tipo))));
  }, [open]);

  function usarVenda(id: string) {
    const v = vendas.find((x) => x.id === id);
    if (!v) return;
    setCliente({ nome: v.clientes?.nome ?? "", doc: v.clientes?.cpf ?? "", email: v.clientes?.email ?? "" });
    setItens((v.dados.itens ?? []).map((i) => ({ codigo: i.codigo, descricao: i.descricao, qtd: i.qtd, preco: i.preco, ncm: "", cfop: "" })));
    if (v.dados.pagamento) setPagamento(v.dados.pagamento);
  }
  const setItem = (n: number, p: Partial<ItemNota>) => setItens(itens.map((i, k) => (k === n ? { ...i, ...p } : i)));
  const erro = validarNota(tipo, cliente, itens);

  async function enviar() {
    if (erro) return toast.error(erro);
    setEnviando(true);
    try {
      const r = await emitir({ data: { tipo, cliente, itens, pagamento } });
      registrarAtividade(`Notas fiscais: emitiu ${TIPOS_NOTA.find((t) => t.value === tipo)?.label} de ${brl(totalNota(itens))}`);
      if (r.status === "erro") toast.error(r.mensagem || "O emissor recusou a nota."); else toast.success(`Nota enviada: ${STATUS_NOTA[r.status] ?? r.status}`);
      onDone(); onClose(); setItens([{ ...ITEM_VAZIO }]); setCliente({ nome: "", doc: "", email: "" });
    } catch (e) { toast.error((e as Error).message); }
    setEnviando(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Emitir nota fiscal</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {TIPOS_NOTA.map((t) => (
              <button key={t.value} onClick={() => setTipo(t.value)} className={`rounded-lg border p-3 text-left ${tipo === t.value ? "border-primary ring-1 ring-primary" : ""}`}>
                <div className="text-sm font-semibold">{t.label}</div><div className="text-xs text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>

          {vendas.length > 0 && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Preencher a partir de uma venda (opcional)</span>
              <select defaultValue="" onChange={(e) => usarVenda(e.target.value)} className={inp + " mt-1"}>
                <option value="" disabled>Escolha um pedido…</option>
                {vendas.map((v) => <option key={v.id} value={v.id}>{v.numero} · {v.clientes?.nome ?? "Sem cliente"}</option>)}
              </select>
            </label>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{tipo === "nfse" ? "Tomador do serviço" : "Cliente"}{tipo === "nfce" && <span className="ml-1 font-normal text-muted-foreground">(opcional no cupom)</span>}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={cliente.nome} onChange={(e) => setCliente({ ...cliente, nome: e.target.value })} placeholder="Nome ou razão social" className={inp} />
              <input value={cliente.doc} onChange={(e) => setCliente({ ...cliente, doc: e.target.value })} placeholder="CPF ou CNPJ" className={inp} />
              <input value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} placeholder="E-mail para envio" className={inp} />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{tipo === "nfse" ? "Serviços" : "Itens"}</legend>
            <div className="space-y-2">
              {itens.map((i, n) => (
                <div key={n} className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_3fr_70px_110px_auto]">
                  <input value={i.codigo} onChange={(e) => setItem(n, { codigo: e.target.value })} placeholder="Código" className={inp} />
                  <input value={i.descricao} onChange={(e) => setItem(n, { descricao: e.target.value })} placeholder={tipo === "nfse" ? "Ex.: Montagem de lentes" : "Ex.: Armação Ray-Ban RB5154"} className={inp + " col-span-2 sm:col-span-1"} />
                  <input type="number" min={1} value={i.qtd} onChange={(e) => setItem(n, { qtd: Number(e.target.value) })} className={inp} />
                  <input type="number" min={0} step="0.01" value={i.preco || ""} onChange={(e) => setItem(n, { preco: Number(e.target.value) })} placeholder="Valor" className={inp} />
                  <button title="Remover" onClick={() => setItens(itens.filter((_, k) => k !== n))} disabled={itens.length === 1} className="rounded-md border p-2 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  {tipo !== "nfse" && (
                    <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-5 sm:grid-cols-4">
                      <input value={i.ncm} onChange={(e) => setItem(n, { ncm: e.target.value })} placeholder="NCM (padrão da config.)" className={inp + " text-xs"} />
                      <input value={i.cfop} onChange={(e) => setItem(n, { cfop: e.target.value })} placeholder="CFOP (padrão da config.)" className={inp + " text-xs"} />
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setItens([...itens, { ...ITEM_VAZIO }])} className="inline-flex items-center gap-1 text-sm font-medium text-primary"><Plus className="h-4 w-4" />Adicionar item</button>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t pt-4">
            {tipo !== "nfse" ? (
              <label><span className="text-xs font-medium text-muted-foreground">Forma de pagamento</span>
                <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className={inp + " mt-1"}>{PAGAMENTOS.map((p) => <option key={p}>{p}</option>)}</select>
              </label>
            ) : <span />}
            <div className="text-right"><div className="text-xs text-muted-foreground">Total da nota</div><div className="text-2xl font-bold">{brl(totalNota(itens))}</div></div>
          </div>
          {erro && <p className="text-xs text-muted-foreground">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
            <button disabled={enviando || !!erro} onClick={enviar} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4" />{enviando ? "Enviando…" : "Emitir nota"}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CancelarDialog({ nota, onClose, onDone, cancelar }: { nota: Nota | null; onClose: () => void; onDone: () => void; cancelar: (a: { data: { ref: string; justificativa: string } }) => Promise<unknown> }) {
  const [just, setJust] = useState("");
  async function confirmar() {
    if (!nota) return;
    try { await cancelar({ data: { ref: nota.ref, justificativa: just } }); registrarAtividade(`Notas fiscais: cancelou a nota ${nota.numero}`); toast.success("Nota cancelada."); setJust(""); onDone(); onClose(); }
    catch (e) { toast.error((e as Error).message); }
  }
  return (
    <Dialog open={!!nota} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancelar nota {nota?.numero}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">O cancelamento é enviado para a Sefaz e não pode ser desfeito.</p>
        <textarea value={just} onChange={(e) => setJust(e.target.value)} rows={3} placeholder="Motivo (mínimo 15 letras). Ex.: Cliente desistiu da compra" className={inp} />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Voltar</button>
          <button disabled={just.trim().length < 15} onClick={confirmar} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-60">Cancelar nota</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
