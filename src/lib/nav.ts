import {
  LayoutDashboard, Users, Package, Glasses, Tag, FileText, Wrench, ShoppingCart, ClipboardList,
  ListChecks, ShoppingBag, Sparkles, TrendingUp, Megaphone, BarChart3, Wallet, Boxes, Building2, FolderPlus, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; slug: string; icon: LucideIcon; children?: { label: string; slug: string }[] };

const s = (label: string) =>
  label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const kids = (...l: string[]) => l.map((label) => ({ label, slug: s(label) }));

export const NAV: NavItem[] = [
  { label: "Painel de Informações", slug: "", icon: LayoutDashboard },
  { label: "Realizar Venda", slug: "realizar-venda", icon: ShoppingBag },
  { label: "Clientes", slug: "clientes", icon: Users },
  { label: "Produtos", slug: "produtos", icon: Package },
  { label: "Tabelas de Lentes", slug: "tabelas-de-lentes", icon: Glasses, children: kids("Lentes Monofocais", "Lentes Multifocais", "Lentes de Contato", "Tratamentos") },
  { label: "Promoções", slug: "promocoes", icon: Tag },
  { label: "Orçamentos", slug: "orcamentos", icon: FileText },
  { label: "Ordens de Serviço (O.S.)", slug: "ordens-de-servico", icon: Wrench },
  { label: "Vendas", slug: "vendas", icon: ShoppingCart },
  { label: "Pedidos", slug: "pedidos", icon: ClipboardList },
  { label: "Etapas O.S.", slug: "etapas-os", icon: ListChecks },
  { label: "Nossas Soluções", slug: "solucoes", icon: Sparkles, children: kids("Painel Estratégico", "Cashback", "Boleto Fácil", "Agenda", "Certificado Digital", "Plug Chat", "Indicadores Inteligentes", "Agente Consultivo", "Ótica Zap", "Pupilômetro Virtual", "Análise de Crédito", "Vitrine Online") },
  { label: "Venda Mais", slug: "venda-mais", icon: TrendingUp },
  { label: "Marketing", slug: "marketing", icon: Megaphone },
  { label: "Relatórios", slug: "relatorios", icon: BarChart3 },
  { label: "Financeiro", slug: "financeiro", icon: Wallet, children: kids("Contas a pagar", "Contas a receber", "Fluxo de caixa") },
  { label: "Estoque", slug: "estoque", icon: Boxes, children: kids("Validade de produtos", "Produtos abaixo do mínimo") },
  { label: "Controle Patrimonial", slug: "controle-patrimonial", icon: Building2 },
  { label: "Cadastros", slug: "cadastros", icon: FolderPlus },
  { label: "Administração", slug: "administracao", icon: Settings },
];

export function findLabel(slug: string): string {
  for (const n of NAV) {
    if (n.slug === slug) return n.label;
    const c = n.children?.find((k) => k.slug === slug);
    if (c) return c.label;
  }
  return "Módulo";
}
