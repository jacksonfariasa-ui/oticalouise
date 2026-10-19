import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { findLabel } from "@/lib/nav";
import { calcularTotais, valorParcela, type Desconto, type ItemVenda } from "@/lib/venda";

type Reg = Record<string, unknown>;
const somarMeses = (d: string, n: number) => { const x = new Date(d + "T12:00:00"); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };

async function editar(chave: string, fn: (l: Reg[]) => Reg[]) {
  const { data } = await supabase.from("dados_salvos").select("dados").eq("chave", chave).maybeSingle();
  const atual = data && Array.isArray(data.dados) ? (data.dados as Reg[]) : [];
  const { error } = await supabase.from("dados_salvos").upsert({ chave, dados: fn(atual) as unknown as Json, updated_at: new Date().toISOString() });
  if (error) throw error;
}
const novoId = (l: Reg[]) => l.reduce((m, r) => Math.max(m, Number(r["_id"]) || 0), 0) + 1;
const add = (slug: string, linhas: Reg[]) => editar(`modulo:${findLabel(slug)}`, (l) => {
  let id = novoId(l);
  return [...linhas.map((r) => ({ _id: id++, ...r })), ...l];
});

export type VendaEtapas = { numero: string; data: string; cliente: string; vendedor: string; itens: ItemVenda[]; desconto: Desconto; pagamento: string; parcelas: number; entrada: number; entrega: string };

/** Spreads a finished sale into Vendas, O.S., Financeiro and Estoque. */
export async function distribuirVenda(v: VendaEtapas) {
  const { total } = calcularTotais(v.itens, v.desconto);
  const resumo = v.itens.map((i) => `${i.qtd}x ${i.descricao}`).join(", ");
  const aPrazo = v.parcelas > 1 || v.pagamento === "Crediário" || v.pagamento === "Boleto";
  const recebidoAgora = aPrazo ? Math.min(total, Math.max(0, v.entrada)) : total;

  const contas: Reg[] = [];
  if (aPrazo) {
    const n = Math.max(1, v.parcelas);
    const vp = valorParcela(total, v.entrada, n);
    for (let k = 1; k <= n; k++) contas.push({ cliente: v.cliente, parcela: `${v.numero} ${k}/${n}`, vencimento: somarMeses(v.data, k), valor: vp, status: "Em aberto" });
  }

  await Promise.all([
    add("vendas", [{ numero: v.numero, cliente: v.cliente, vendedor: v.vendedor, data: v.data, pagamento: v.pagamento, total }]),
    add("ordens-de-servico", [{ os: v.numero.replace("PED", "OS"), cliente: v.cliente, servico: resumo, laboratorio: "", previsao: v.entrega, valor: total, etapa: "Aberta" }]),
    recebidoAgora > 0 ? add("fluxo-de-caixa", [{ data: v.data, descricao: `Venda ${v.numero} · ${v.cliente}`, tipo: "Entrada", valor: recebidoAgora }]) : null,
    contas.length ? add("contas-a-receber", contas) : null,
    editar("produtos", (l) => l.map((p) => {
      const q = v.itens.filter((i) => i.codigo === String(p["codigo"] || `P${p["id"]}`)).reduce((s, i) => s + i.qtd, 0);
      return q ? { ...p, estoque: Math.max(0, Number(p["estoque"]) - q) } : p;
    })),
  ]);
}
