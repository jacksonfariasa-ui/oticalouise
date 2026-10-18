export type Role = "admin" | "gerente" | "vendedor" | "tecnico";

export const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "admin", label: "Administrador", desc: "Acesso total, incluindo usuários e permissões" },
  { value: "gerente", label: "Gerente", desc: "Tudo exceto a administração de usuários" },
  { value: "vendedor", label: "Vendedor", desc: "Atendimento, orçamentos, vendas e promoções" },
  { value: "tecnico", label: "Técnico / Laboratório", desc: "Ordens de serviço, etapas e estoque" },
];

export const roleLabel = (r: Role | null | undefined) => ROLES.find((x) => x.value === r)?.label ?? "Sem perfil";

const LENTES = ["tabelas-de-lentes", "lentes-monofocais", "lentes-multifocais", "lentes-de-contato", "tratamentos"];

const VENDEDOR = new Set([
  "", "realizar-venda", "clientes", "produtos", ...LENTES, "promocoes", "orcamentos", "vendas", "pedidos", "solucoes",
  "cashback", "agenda", "otica-zap", "pupilometro-virtual", "vitrine-online", "plug-chat", "boleto-facil",
  "analise-de-credito", "venda-mais", "matriz", "rorainopolis", "pintolandia",
]);

const TECNICO = new Set([
  "", "produtos", ...LENTES, "ordens-de-servico", "etapas-os", "pedidos", "solucoes", "agenda",
  "estoque", "validade-de-produtos", "produtos-abaixo-do-minimo",
]);

/** Whether a role may open the section identified by its menu slug ("" = painel). */
export function canAccess(role: Role | null | undefined, slug: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "gerente") return slug !== "administracao";
  if (role === "vendedor") return VENDEDOR.has(slug);
  return TECNICO.has(slug);
}

/** Maps a URL path to the menu slug used for permission checks. */
export function slugFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "";
  if (pathname.startsWith("/usuarios")) return "administracao";
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
