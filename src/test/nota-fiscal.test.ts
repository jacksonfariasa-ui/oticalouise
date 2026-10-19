import { describe, expect, it } from "vitest";
import { codigoPagamento, pendencias, validarNota } from "@/lib/nota-fiscal";
import { canAccess } from "@/lib/permissions";

const item = [{ codigo: "A", descricao: "Armação", qtd: 1, preco: 300 }];
describe("notas fiscais", () => {
  it("NF-e exige CPF/CNPJ do cliente", () => expect(validarNota("nfe", { nome: "Ana", doc: "" }, item)).not.toBeNull());
  it("NFC-e aceita consumidor sem CPF", () => expect(validarNota("nfce", { nome: "", doc: "" }, item)).toBeNull());
  it("NFC-e exige CSC", () => expect(pendencias({ token: "t", cnpj: "12345678000190", razao_social: "X", inscricao_estadual: "1" }, "nfce")).toContain("Código CSC da Sefaz"));
  it("Pix vira código 17", () => expect(codigoPagamento("Pix")).toBe("17"));
  it("vendedor pode emitir nota", () => expect(canAccess("vendedor", "notas-fiscais")).toBe(true));
  it("técnico não pode emitir nota", () => expect(canAccess("tecnico", "notas-fiscais")).toBe(false));
});
