import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const savedListKey = (key: string) => ["saved-list", key] as const;

export function savedListOptions<T>(key: string, initial: T[] | (() => T[])) {
  return queryOptions({
    queryKey: savedListKey(key),
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase.from("dados_salvos").select("dados").eq("chave", key).maybeSingle();
      if (error) throw error;
      return data && Array.isArray(data.dados) ? data.dados as T[] : typeof initial === "function" ? initial() : initial;
    },
    staleTime: 30_000,
  });
}

// Serializing local writes prevents an older response from overwriting a newer edit.
const writes = new Map<string, Promise<void>>();
export function saveList<T>(key: string, list: T[]): Promise<void> {
  const previous = writes.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const { error } = await supabase.from("dados_salvos").upsert({ chave: key, dados: list as unknown as Json, updated_at: new Date().toISOString() });
    if (error) throw error;
  });
  writes.set(key, next);
  void next.finally(() => { if (writes.get(key) === next) writes.delete(key); }).catch(() => {});
  return next;
}