import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { findLabel } from "@/lib/nav";

export type Membro = { nome: string; cargo: string };
export type Filial = {
  id: string; nome: string; tipo: "Matriz" | "Filial"; status: "Ativa" | "Em reforma" | "Inativa";
  cnpj: string; endereco: string; cidade: string; telefone: string; email: string; horario: string;
  gerente: string; faturamento: number; meta: number; vendas: number; osAbertas: number; estoque: number; clientes: number;
  mensal: number[]; equipe: Membro[];
};

export const MESES = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""); });

const BASE: Filial[] = [
  {
    id: "matriz", nome: "Matriz", tipo: "Matriz", status: "Ativa", cnpj: "12.345.678/0001-90",
    endereco: "Av. Ville Roy, 1820 — Centro", cidade: "Boa Vista - RR", telefone: "(95) 3224-1500", email: "matriz@oticalouise.com.br",
    horario: "Seg a Sex 8h–18h · Sáb 8h–13h", gerente: "", faturamento: 0, meta: 0, vendas: 0,
    osAbertas: 0, estoque: 0, clientes: 0, mensal: [0, 0, 0, 0, 0, 0],
    equipe: [],
  },
  {
    id: "rorainopolis", nome: "Filial Rorainópolis", tipo: "Filial", status: "Ativa", cnpj: "12.345.678/0002-71",
    endereco: "Av. Juscelino Kubitschek, 455 — Centro", cidade: "Rorainópolis - RR", telefone: "(95) 3238-2210", email: "rorainopolis@oticalouise.com.br",
    horario: "Seg a Sex 8h–18h · Sáb 8h–12h", gerente: "", faturamento: 0, meta: 0, vendas: 0,
    osAbertas: 0, estoque: 0, clientes: 0, mensal: [0, 0, 0, 0, 0, 0],
    equipe: [],
  },
  {
    id: "pintolandia", nome: "Filial Pintolândia", tipo: "Filial", status: "Ativa", cnpj: "12.345.678/0003-52",
    endereco: "Rua Pedro Aldemar Bantim, 980 — Pintolândia", cidade: "Boa Vista - RR", telefone: "(95) 3626-4480", email: "pintolandia@oticalouise.com.br",
    horario: "Seg a Sex 9h–19h · Sáb 8h–14h", gerente: "", faturamento: 0, meta: 0, vendas: 0,
    osAbertas: 0, estoque: 0, clientes: 0, mensal: [0, 0, 0, 0, 0, 0],
    equipe: [],
  },
];

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const STATUS_CLS: Record<Filial["status"], string> = {
  Ativa: "bg-primary/15 text-primary", "Em reforma": "bg-accent text-accent-foreground", Inativa: "bg-destructive/15 text-destructive",
};


export type Venda = { id: number; data: string; cliente: string; descricao: string; valor: number; vendedor: string };
export type OS = { id: number; numero: string; cliente: string; servico: string; status: "Aberta" | "Concluída" };
export type ItemEstoque = { id: number; produto: string; categoria: string; qtd: number };
export type Unidade = Filial & { vendasLista: Venda[]; osLista: OS[]; estoqueLista: ItemEstoque[] };

const EXTRA: Record<string, Pick<Unidade, "vendasLista" | "osLista" | "estoqueLista">> = {
};

let state: Unidade[] = BASE.map((f) => ({ ...f, ...(EXTRA[f.id] ?? { vendasLista: [], osLista: [], estoqueLista: [] }) }));
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

const CHAVE_MANUAL = "filiais:dados";
type Manual = { meta: number; vendasLista: Venda[]; osLista: OS[]; estoqueLista: ItemEstoque[] };
type MembroEquipe = { nome: string; filial: string | null; role: string | null };
let equipeReal: MembroEquipe[] = [];
let vendasSistema: Record<string, unknown>[] = [];
let osSistema: Record<string, unknown>[] = [];
let carregado = false;
let salvarTimer: ReturnType<typeof setTimeout> | undefined;

const mesKey = (d: Date) => d.toISOString().slice(0, 7);
const ultimosMeses = () => Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
const CARGO: Record<string, string> = { admin: "Administrador", gerente: "Gerente", vendedor: "Vendedor", tecnico: "Técnico" };

/** Branch of a seller by name; unknown sellers count for the Matriz. */
function filialDe(vendedor: string) {
  return equipeReal.find((m) => m.nome === vendedor)?.filial ?? "matriz";
}

/** Recomputes all branch numbers from manual entries plus system sales, O.S. and team. */
function recalcular(u: Unidade): Unidade {
  const manuais = { v: u.vendasLista.filter((v) => v.id > 0), o: u.osLista.filter((o) => o.id > 0) };
  const doSistema = vendasSistema.filter((v) => filialDe(String(v["vendedor"] ?? "")) === u.id);
  const numeros = new Set(doSistema.map((v) => String(v["numero"] ?? "").replace("PED", "OS")));
  const vendasLista: Venda[] = [...manuais.v, ...doSistema.map((v, i) => ({
    id: -(i + 1), data: String(v["data"] ?? ""), cliente: String(v["cliente"] ?? ""), descricao: `Venda ${String(v["numero"] ?? "")} · ${String(v["pagamento"] ?? "")}`,
    valor: Number(v["total"]) || 0, vendedor: String(v["vendedor"] ?? ""),
  }))].sort((a, b) => b.data.localeCompare(a.data));
  const osLista: OS[] = [...manuais.o, ...osSistema.filter((o) => numeros.has(String(o["os"] ?? ""))).map((o, i) => ({
    id: -(i + 1), numero: String(o["os"] ?? ""), cliente: String(o["cliente"] ?? ""), servico: String(o["servico"] ?? ""),
    status: (String(o["etapa"] ?? "") === "Entregue" ? "Concluída" : "Aberta") as OS["status"],
  }))];
  const mesAtual = mesKey(new Date());
  const doMes = vendasLista.filter((v) => v.data.startsWith(mesAtual));
  const time = equipeReal.filter((m) => (m.filial ?? (m.role === "admin" ? null : "matriz")) === u.id);
  const gerente = time.find((m) => m.role === "gerente")?.nome;
  return {
    ...u, vendasLista, osLista,
    faturamento: doMes.reduce((s, v) => s + v.valor, 0), vendas: doMes.length,
    osAbertas: osLista.filter((o) => o.status === "Aberta").length,
    estoque: u.estoqueLista.reduce((s, i) => s + i.qtd, 0),
    clientes: new Set(vendasLista.map((v) => v.cliente).filter(Boolean)).size,
    mensal: ultimosMeses().map((d) => vendasLista.filter((v) => v.data.startsWith(mesKey(d))).reduce((s, v) => s + v.valor, 0)),
    equipe: time.map((m) => ({ nome: m.nome, cargo: CARGO[m.role ?? ""] ?? "Aguardando liberação" })),
    gerente: gerente ?? u.gerente,
  };
}

function salvarManual() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    const dados: Record<string, Manual> = Object.fromEntries(state.map((u) => [u.id, {
      meta: u.meta, vendasLista: u.vendasLista.filter((v) => v.id > 0), osLista: u.osLista.filter((o) => o.id > 0), estoqueLista: u.estoqueLista,
    }]));
    void supabase.from("dados_salvos").upsert({ chave: CHAVE_MANUAL, dados: [dados] as unknown as Json, updated_at: new Date().toISOString() });
  }, 600);
}

/** Loads saved branch entries, system sales/O.S. and the team, then recomputes. */
export async function carregarFiliais() {
  const [{ data }, { data: eq }] = await Promise.all([
    supabase.from("dados_salvos").select("chave, dados").in("chave", [CHAVE_MANUAL, `modulo:${findLabel("vendas")}`, `modulo:${findLabel("ordens-de-servico")}`]),
    supabase.rpc("equipe_filiais"),
  ]);
  const get = (k: string) => { const r = (data ?? []).find((x) => x.chave === k); return Array.isArray(r?.dados) ? (r.dados as Record<string, unknown>[]) : []; };
  vendasSistema = get(`modulo:${findLabel("vendas")}`);
  osSistema = get(`modulo:${findLabel("ordens-de-servico")}`);
  equipeReal = (eq ?? []) as MembroEquipe[];
  const manual = (get(CHAVE_MANUAL)[0] ?? {}) as Record<string, Partial<Manual>>;
  state = state.map((u) => {
    const m = carregado ? {} : manual[u.id] ?? {};
    return recalcular({ ...u, meta: m.meta ?? u.meta, vendasLista: m.vendasLista ?? u.vendasLista, osLista: m.osLista ?? u.osLista, estoqueLista: m.estoqueLista ?? u.estoqueLista });
  });
  carregado = true;
  emit();
}

export function updateFilial(id: string, fn: (f: Unidade) => Unidade) {
  state = state.map((f) => (f.id === id ? recalcular(fn(f)) : f));
  emit();
  if (carregado) salvarManual();
}

export function useFiliais(): Unidade[] {
  useEffect(() => { void carregarFiliais(); }, []);
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => state,
    () => state,
  );
}


/** Branch options for team registration (sellers/managers belong to one branch). */
export const FILIAIS_OPCOES = BASE.map((f) => ({ id: f.id, nome: f.nome }));
export const filialNome = (id?: string | null) => FILIAIS_OPCOES.find((f) => f.id === id)?.nome ?? null;
export const ROLES_COM_FILIAL = ["gerente", "vendedor"] as const;
export const exigeFilial = (role: string) => (ROLES_COM_FILIAL as readonly string[]).includes(role);

/** Goal achievement in %, 0 when no goal is set (avoids NaN/Infinity). */
export const pctMeta = (feito: number, meta: number) => (meta > 0 ? Math.round((feito / meta) * 100) : 0);
