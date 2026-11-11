import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const clientOptions = queryOptions({
  queryKey: ["clientes"],
  queryFn: async () => {
    const { data, error } = await supabase.from("clientes").select("id,nome,cpf,telefone,email,nascimento,cidade").order("nome");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});