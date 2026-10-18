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
    horario: "Seg a Sex 8h–18h · Sáb 8h–13h", gerente: "Louise Andrade", faturamento: 148500, meta: 160000, vendas: 312,
    osAbertas: 27, estoque: 1840, clientes: 4210, mensal: [118, 126, 131, 139, 142, 148.5],
    equipe: [{ nome: "Louise Andrade", cargo: "Gerente geral" }, { nome: "Rafael Costa", cargo: "Vendedor" }, { nome: "Juliana Prado", cargo: "Vendedora" }, { nome: "Marcos Lima", cargo: "Técnico óptico" }, { nome: "Patrícia Reis", cargo: "Financeiro" }],
  },
  {
    id: "rorainopolis", nome: "Filial Rorainópolis", tipo: "Filial", status: "Ativa", cnpj: "12.345.678/0002-71",
    endereco: "Av. Juscelino Kubitschek, 455 — Centro", cidade: "Rorainópolis - RR", telefone: "(95) 3238-2210", email: "rorainopolis@oticalouise.com.br",
    horario: "Seg a Sex 8h–18h · Sáb 8h–12h", gerente: "Diego Martins", faturamento: 62300, meta: 70000, vendas: 141,
    osAbertas: 12, estoque: 720, clientes: 1580, mensal: [48, 51, 55, 58, 60, 62.3],
    equipe: [{ nome: "Diego Martins", cargo: "Gerente" }, { nome: "Aline Souza", cargo: "Vendedora" }, { nome: "Bruno Ferreira", cargo: "Técnico óptico" }],
  },
  {
    id: "pintolandia", nome: "Filial Pintolândia", tipo: "Filial", status: "Ativa", cnpj: "12.345.678/0003-52",
    endereco: "Rua Pedro Aldemar Bantim, 980 — Pintolândia", cidade: "Boa Vista - RR", telefone: "(95) 3626-4480", email: "pintolandia@oticalouise.com.br",
    horario: "Seg a Sex 9h–19h · Sáb 8h–14h", gerente: "Camila Rocha", faturamento: 81900, meta: 75000, vendas: 198,
    osAbertas: 18, estoque: 965, clientes: 2240, mensal: [61, 66, 70, 73, 77, 81.9],
    equipe: [{ nome: "Camila Rocha", cargo: "Gerente" }, { nome: "Thiago Alves", cargo: "Vendedor" }, { nome: "Larissa Melo", cargo: "Vendedora" }, { nome: "Ênio Barbosa", cargo: "Técnico óptico" }],
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
  matriz: {
    vendasLista: [
      { id: 1, data: "2026-10-16", cliente: "Mariana Souza", descricao: "Armação Ray-Ban + lente multifocal", valor: 1890, vendedor: "Rafael Costa" },
      { id: 2, data: "2026-10-15", cliente: "Carlos Mendes", descricao: "Lente de contato mensal (2 cx)", valor: 340, vendedor: "Juliana Prado" },
      { id: 3, data: "2026-10-14", cliente: "Fernanda Lima", descricao: "Óculos de sol Oakley", valor: 980, vendedor: "Rafael Costa" },
    ],
    osLista: [
      { id: 1, numero: "OS-1042", cliente: "Mariana Souza", servico: "Montagem multifocal", status: "Aberta" },
      { id: 2, numero: "OS-1039", cliente: "João Pereira", servico: "Troca de plaquetas", status: "Concluída" },
    ],
    estoqueLista: [
      { id: 1, produto: "Armação Ray-Ban RB5154", categoria: "Armações", qtd: 14 },
      { id: 2, produto: "Lente Varilux Comfort 1.67", categoria: "Lentes", qtd: 22 },
      { id: 3, produto: "Solução multiuso 360 ml", categoria: "Acessórios", qtd: 48 },
    ],
  },
  rorainopolis: {
    vendasLista: [
      { id: 1, data: "2026-10-16", cliente: "Antônio Ribeiro", descricao: "Armação Chilli Beans + monofocal", valor: 620, vendedor: "Aline Souza" },
      { id: 2, data: "2026-10-13", cliente: "Sônia Batista", descricao: "Lente com antirreflexo", valor: 450, vendedor: "Aline Souza" },
    ],
    osLista: [
      { id: 1, numero: "OS-2210", cliente: "Antônio Ribeiro", servico: "Montagem monofocal", status: "Aberta" },
    ],
    estoqueLista: [
      { id: 1, produto: "Armação Chilli Beans CB-301", categoria: "Armações", qtd: 9 },
      { id: 2, produto: "Lente monofocal 1.56 AR", categoria: "Lentes", qtd: 30 },
    ],
  },
  pintolandia: {
    vendasLista: [
      { id: 1, data: "2026-10-17", cliente: "Rosa Nascimento", descricao: "Armação Vogue + lente Transitions", valor: 1450, vendedor: "Thiago Alves" },
      { id: 2, data: "2026-10-15", cliente: "Pedro Henrique", descricao: "Óculos infantil", valor: 390, vendedor: "Larissa Melo" },
      { id: 3, data: "2026-10-12", cliente: "Lucas Moraes", descricao: "Lente de contato colorida", valor: 260, vendedor: "Thiago Alves" },
    ],
    osLista: [
      { id: 1, numero: "OS-3105", cliente: "Rosa Nascimento", servico: "Montagem Transitions", status: "Aberta" },
      { id: 2, numero: "OS-3101", cliente: "Pedro Henrique", servico: "Ajuste de haste", status: "Concluída" },
    ],
    estoqueLista: [
      { id: 1, produto: "Armação Vogue VO5286", categoria: "Armações", qtd: 11 },
      { id: 2, produto: "Lente Transitions Gen S", categoria: "Lentes", qtd: 16 },
      { id: 3, produto: "Estojo rígido", categoria: "Acessórios", qtd: 60 },
    ],
  },
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
