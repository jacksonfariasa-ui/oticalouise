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

/**
 * Whether a role may open the section identified by its menu slug ("" = painel).
 * `acessos` = per-user list chosen by the admin; null/undefined = role defaults.
 * Admin always has everything; administration is never grantable to others; painel always open.
 */
export function canAccess(role: Role | null | undefined, slug: string, acessos?: string[] | null): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (slug === "administracao") return false;
  if (acessos) return slug === "" || acessos.includes(slug);
  if (role === "gerente") return true;
  if (role === "vendedor") return VENDEDOR.has(slug);
  return TECNICO.has(slug);
}

/** All grantable section slugs (leaf menu items), excluding painel and administração. */
export function grantableSlugs(nav: { slug: string; children?: { slug: string }[] }[]): string[] {
  return nav.flatMap((n) => (n.children ? n.children.map((c) => c.slug) : [n.slug])).filter((s) => s && s !== "administracao");
}

/** Maps a URL path to the menu slug used for permission checks. */
export function slugFromPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "";
  if (pathname.startsWith("/usuarios")) return "administracao";
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
