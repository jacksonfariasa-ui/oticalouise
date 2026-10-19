import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/** Lista salva no banco (tabela dados_salvos) com a mesma API do useState. */
export function usePersistedList<T>(chave: string, inicial: T[] | (() => T[])): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const [lista, setLista] = useState<T[]>(inicial);
  const [carregado, setCarregado] = useState(false);
  const pronto = useRef<string | null>(null);

  useEffect(() => {
    let ativo = true;
    pronto.current = null;
    setCarregado(false);
    supabase.from("dados_salvos").select("dados").eq("chave", chave).maybeSingle().then(({ data }) => {
      if (!ativo) return;
      if (data && Array.isArray(data.dados)) setLista(data.dados as T[]);
      else setLista(typeof inicial === "function" ? (inicial as () => T[])() : inicial);
      pronto.current = chave;
      setCarregado(true);
    });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    if (pronto.current !== chave) return;
    const t = setTimeout(() => {
      supabase.from("dados_salvos").upsert({ chave, dados: lista as unknown as Json, updated_at: new Date().toISOString() }).then(({ error }) => {
        if (error) console.error("Erro ao salvar", chave, error.message);
      });
    }, 600);
    return () => clearTimeout(t);
  }, [lista, chave]);

  return [lista, setLista, carregado];
}
