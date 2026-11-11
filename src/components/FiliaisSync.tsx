import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyFiliaisMetadata, type Filial } from "@/lib/filiais";

export const filiaisInfoQuery = {
  queryKey: ["filiais_info"],
  queryFn: async () => {
    const { data, error } = await supabase.from("filiais_info").select("id,nome,status,cnpj,endereco,cidade,telefone,email,horario,gerente");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
};

export function FiliaisSync() {
  const { data } = useQuery(filiaisInfoQuery);
  useEffect(() => {
    if (data) applyFiliaisMetadata(data.map((row) => ({ ...row, status: row.status as Filial["status"] })));
  }, [data]);
  return null;
}