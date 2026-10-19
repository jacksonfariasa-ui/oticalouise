import { describe, expect, it } from "vitest";
import { canAccess } from "@/lib/permissions";

describe("permissões por perfil", () => {
  it("administrador acessa a administração", () => expect(canAccess("admin", "administracao")).toBe(true));
  it("gerente não acessa a administração", () => expect(canAccess("gerente", "administracao")).toBe(false));
  it("gerente acessa o financeiro", () => expect(canAccess("gerente", "contas-a-pagar")).toBe(true));
  it("vendedor acessa vendas", () => expect(canAccess("vendedor", "vendas")).toBe(true));
  it("vendedor não acessa o financeiro", () => expect(canAccess("vendedor", "fluxo-de-caixa")).toBe(false));
  it("técnico acessa ordens de serviço", () => expect(canAccess("tecnico", "ordens-de-servico")).toBe(true));
  it("técnico não acessa vendas", () => expect(canAccess("tecnico", "vendas")).toBe(false));
  it("vendedor acessa a própria filial", () => expect(canAccess("vendedor", "pintolandia")).toBe(true));
  it("vendedor não acessa o relatório final das filiais", () => expect(canAccess("vendedor", "relatorio")).toBe(false));
  it("vendedor não acessa a visão geral das filiais", () => expect(canAccess("vendedor", "filiais")).toBe(false));
  it("sem perfil não acessa nada", () => expect(canAccess(null, "")).toBe(false));
});

describe("acessos personalizados por usuário", () => {
  it("vendedor com acesso liberado ao financeiro entra", () => expect(canAccess("vendedor", "fluxo-de-caixa", ["fluxo-de-caixa"])).toBe(true));
  it("vendedor sem a área marcada não entra, mesmo sendo do perfil", () => expect(canAccess("vendedor", "vendas", ["clientes"])).toBe(false));
  it("administração nunca é liberada a não administradores", () => expect(canAccess("gerente", "administracao", ["administracao"])).toBe(false));
  it("administrador continua com tudo", () => expect(canAccess("admin", "vendas", [])).toBe(true));
  it("painel sempre acessível", () => expect(canAccess("tecnico", "", [])).toBe(true));
});
