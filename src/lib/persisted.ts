import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { savedListKey, savedListOptions, saveList } from "@/lib/saved-data";
import { descreverMudanca, nomeSecao, registrarAtividade } from "@/lib/atividades";

/** Lista salva no banco (tabela dados_salvos) com a mesma API do useState. */
export function usePersistedList<T>(chave: string, inicial: T[] | (() => T[])): [T[], Dispatch<SetStateAction<T[]>>, boolean] {
  const qc = useQueryClient();
  const { data: lista } = useSuspenseQuery(savedListOptions(chave, inicial));
  const setLista = useCallback<Dispatch<SetStateAction<T[]>>>((action) => {
    const key = savedListKey(chave);
    const before = qc.getQueryData<T[]>(key) ?? lista;
    const after = typeof action === "function" ? (action as (value: T[]) => T[])(before) : action;
    if (after === before) return;
    qc.setQueryData(key, after);
    void saveList(chave, after).then(() => {
      const change = descreverMudanca(before, after);
      if (change) registrarAtividade(`${nomeSecao(chave)}: ${change}`);
      void qc.invalidateQueries({ queryKey: ["relatorios"] });
      void qc.invalidateQueries({ queryKey: ["catalogo-venda"] });
    }).catch((error) => {
      console.error("Erro ao salvar", chave, error);
      if (qc.getQueryData(key) === after) qc.setQueryData(key, before);
    });
  }, [chave, lista, qc]);
  return [lista, setLista, true];
}
