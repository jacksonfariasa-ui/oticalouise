import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VARILUX } from "@/lib/lentes-varilux";

export type CatalogItem = { codigo: string; descricao: string; grupo: string; preco: number; origem: "produto" | "lente" };
type RecordItem = Record<string, unknown>;
const lensNames: Record<string, string> = { "lentes-monofocais": "Lente monofocal", "lentes-multifocais": "Lente multifocal", "lentes-de-contato": "Lente de contato", tratamentos: "Tratamento" };
function lensItem(lens: RecordItem, type: string): CatalogItem {
  const description = [lens["nome"], lens["material"], lens["indice"]].filter(Boolean).join(" ");
  return { codigo: String(lens["id"] ? `L${lens["id"]}` : description), descricao: description, grupo: [lensNames[type] ?? "Lente", lens["fornecedor"], lens["faixa"]].filter(Boolean).join(" · "), preco: Number(lens["preco"]) || 0, origem: "lente" };
}
export const catalogOptions = queryOptions({
  queryKey: ["catalogo-venda"],
  queryFn: async (): Promise<CatalogItem[]> => {
    const { data, error } = await supabase.from("dados_salvos").select("chave,dados").in("chave", ["produtos", ...Object.keys(lensNames).map((type) => `lentes:${type}`)]);
    if (error) throw error;
    const rows = data ?? [];
    const out: CatalogItem[] = [];
    for (const row of rows) {
      const list = Array.isArray(row.dados) ? row.dados as RecordItem[] : [];
      if (row.chave === "produtos") for (const item of list) out.push({ codigo: String(item["codigo"] || `P${item["id"]}`), descricao: String(item["nome"] ?? ""), grupo: `${item["categoria"] ?? "Produto"}${Number(item["estoque"]) >= 0 ? ` · estoque ${item["estoque"]}` : ""}`, preco: Number(item["preco"]) || 0, origem: "produto" });
      else for (const item of list) out.push(lensItem(item, row.chave.slice(7)));
    }
    if (!rows.some((row) => row.chave === "lentes:lentes-multifocais")) for (const lens of VARILUX) out.push(lensItem(lens as unknown as RecordItem, "lentes-multifocais"));
    return out;
  },
  staleTime: 30_000,
});