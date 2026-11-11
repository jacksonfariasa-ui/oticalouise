import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHAVE_ATIVIDADES } from "@/lib/atividades";
import { findLabel } from "@/lib/nav";

const keys = ["vendas", "fluxo-de-caixa", "contas-a-receber", "contas-a-pagar", "ordens-de-servico"].map((slug) => `modulo:${findLabel(slug)}`);
export const reportOptions = queryOptions({
  queryKey: ["relatorios"],
  queryFn: async (): Promise<Record<string, Record<string, unknown>[]>> => {
    const { data, error } = await supabase.from("dados_salvos").select("chave, dados").in("chave", [...keys, CHAVE_ATIVIDADES]);
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((row) => [row.chave, Array.isArray(row.dados) ? row.dados as Record<string, unknown>[] : []]));
  },
  staleTime: 15_000,
  refetchInterval: 15_000,
  refetchIntervalInBackground: false,
});