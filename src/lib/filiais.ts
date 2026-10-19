import { useSyncExternalStore } from "react";

export type Membro = { nome: string; cargo: string };
export type Filial = {
  id: string; nome: string; tipo: "Matriz" | "Filial"; status: "Ativa" | "Em reforma" | "Inativa";
  cnpj: string; endereco: string; cidade: string; telefone: string; email: string; horario: string;
  gerente: string; faturamento: number; meta: number; vendas: number; osAbertas: number; estoque: number; clientes: number;
  mensal: number[]; equipe: Membro[];
};

export const MESES = ["Mai", "Jun", "Jul", "Ago", "Set", "Out"];

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

export function updateFilial(id: string, fn: (f: Unidade) => Unidade) {
  state = state.map((f) => (f.id === id ? fn(f) : f));
  subs.forEach((s) => s());
}

export function useFiliais(): Unidade[] {
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
