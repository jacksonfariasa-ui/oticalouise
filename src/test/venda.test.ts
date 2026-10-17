import { describe, expect, it } from "vitest";
import { calcularTotais, valorParcela } from "@/lib/venda";
import { canAccess } from "@/lib/permissions";

const itens = [
  { id: "a", codigo: "A", descricao: "Armação", preco: 500, qtd: 1 },
  { id: "b", codigo: "B", descricao: "Lente", preco: 250, qtd: 2 },
];

describe("realizar venda", () => {
  it("desconto percentual", () => expect(calcularTotais(itens, { tipo: "percentual", valor: 10 }).total).toBe(900));
  it("desconto em valor não passa do subtotal", () => expect(calcularTotais(itens, { tipo: "valor", valor: 5000 }).total).toBe(0));
  it("parcelas descontam a entrada", () => expect(valorParcela(1000, 100, 3)).toBe(300));
  it("vendedor pode realizar venda", () => expect(canAccess("vendedor", "realizar-venda")).toBe(true));
  it("gerente pode realizar venda", () => expect(canAccess("gerente", "realizar-venda")).toBe(true));
  it("técnico não pode realizar venda", () => expect(canAccess("tecnico", "realizar-venda")).toBe(false));
});
