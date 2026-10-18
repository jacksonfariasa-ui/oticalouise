import { describe, expect, it } from "vitest";
import { loginEmail, normalizeUsername } from "@/lib/username";

describe("login por nome", () => {
  it("o mesmo nome com acento e maiúsculas entra na mesma conta", () =>
    expect(loginEmail("  João Silva ")).toBe(loginEmail("joao silva")));
  it("nome vira usuário sem espaços", () => expect(normalizeUsername("Ana Paula")).toBe("ana.paula"));
  it("conta antiga com e-mail continua entrando pelo e-mail", () => expect(loginEmail("Admin@Otica.com")).toBe("admin@otica.com"));
});
