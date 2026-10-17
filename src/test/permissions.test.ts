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
  it("sem perfil não acessa nada", () => expect(canAccess(null, "")).toBe(false));
});
