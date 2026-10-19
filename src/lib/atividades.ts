import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { findLabel } from "@/lib/nav";

export type Atividade = { quando: string; quem: string; texto: string };
export const CHAVE_ATIVIDADES = "atividades";
const LIMITE = 300;

let nomeCache: Promise<string> | null = null;
function meuNome() {
  nomeCache ??= (async () => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return "Sistema";
    const { data: p } = await supabase.from("profiles").select("nome").eq("id", u.id).maybeSingle();
    return p?.nome || u.email || "Usuário";
  })();
  return nomeCache;
}
supabase.auth.onAuthStateChange(() => { nomeCache = null; });

let fila: Promise<void> = Promise.resolve();
/** Appends an entry to the shared activity log shown on the dashboard. */
export function registrarAtividade(texto: string) {
  fila = fila.then(async () => {
    const quem = await meuNome();
    const { data } = await supabase.from("dados_salvos").select("dados").eq("chave", CHAVE_ATIVIDADES).maybeSingle();
    const atual = data && Array.isArray(data.dados) ? (data.dados as Atividade[]) : [];
    const nova = [{ quando: new Date().toISOString(), quem, texto }, ...atual].slice(0, LIMITE);
    await supabase.from("dados_salvos").upsert({ chave: CHAVE_ATIVIDADES, dados: nova as unknown as Json, updated_at: new Date().toISOString() });
  }).catch(() => {});
}

/** Human name of a saved list key, e.g. "modulo:Vendas" -> "Vendas". */
export function nomeSecao(chave: string) {
  if (chave.startsWith("modulo:")) return chave.slice(7);
  if (chave.startsWith("lentes:")) return findLabel(chave.slice(7));
  return findLabel(chave) === "Módulo" ? chave.charAt(0).toUpperCase() + chave.slice(1) : findLabel(chave);
}

/** Describes what changed between two versions of a list. */
export function descreverMudanca(antes: unknown[], depois: unknown[]) {
  const s = (x: unknown) => JSON.stringify(x);
  const a = new Set(antes.map(s)), d = new Set(depois.map(s));
  const novos = depois.filter((x) => !a.has(s(x))).length;
  const sairam = antes.filter((x) => !d.has(s(x))).length;
  const editados = Math.min(novos, sairam);
  const add = novos - editados, del = sairam - editados;
  const partes: string[] = [];
  if (add) partes.push(`${add} ${add === 1 ? "registro adicionado" : "registros adicionados"}`);
  if (editados) partes.push(`${editados} ${editados === 1 ? "registro alterado" : "registros alterados"}`);
  if (del) partes.push(`${del} ${del === 1 ? "registro excluído" : "registros excluídos"}`);
  return partes.join(", ");
}
