export type ItemVenda = { id: string; codigo: string; descricao: string; preco: number; qtd: number };
export type Desconto = { tipo: "percentual" | "valor"; valor: number };

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Subtotal, discount (capped at subtotal) and final total of a sale. */
export function calcularTotais(itens: ItemVenda[], desconto: Desconto) {
  const subtotal = itens.reduce((s, i) => s + i.preco * Math.max(0, i.qtd), 0);
  const bruto = desconto.tipo === "percentual" ? (subtotal * Math.min(100, Math.max(0, desconto.valor))) / 100 : Math.max(0, desconto.valor);
  const valorDesconto = Math.min(subtotal, Math.round(bruto * 100) / 100);
  return { subtotal, valorDesconto, total: Math.round((subtotal - valorDesconto) * 100) / 100 };
}

/** Value of each installment; remainder after down payment split evenly. */
export function valorParcela(total: number, entrada: number, parcelas: number) {
  const restante = Math.max(0, total - Math.max(0, entrada));
  return Math.round((restante / Math.max(1, parcelas)) * 100) / 100;
}
