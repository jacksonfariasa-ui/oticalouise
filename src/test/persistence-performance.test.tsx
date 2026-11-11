import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistedList } from "@/lib/persisted";
import { savedListKey, savedListOptions, saveList } from "@/lib/saved-data";
import { useTablePage } from "@/hooks/use-table-page";
import { catalogOptions } from "@/lib/sale-catalog";
import { reportOptions } from "@/lib/report-data";

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), single: vi.fn(), inKeys: vi.fn(), log: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({
    upsert: mocks.upsert,
    select: () => ({ eq: () => ({ maybeSingle: mocks.single }), in: mocks.inKeys }),
  }),
} }));
vi.mock("@/lib/atividades", () => ({ CHAVE_ATIVIDADES: "atividades", registrarAtividade: mocks.log, nomeSecao: (key: string) => key, descreverMudanca: () => "alterado" }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.single.mockResolvedValue({ data: { dados: [{ id: 1 }] }, error: null });
  mocks.inKeys.mockResolvedValue({ data: [], error: null });
});

describe("Persisted data reliability", () => {
  it("does not replace a failed read with writable defaults", async () => {
    mocks.single.mockResolvedValueOnce({ data: null, error: new Error("network") });
    await expect(savedListOptions("read-error", []).queryFn?.({} as never)).rejects.toThrow("network");
  });

  it("serializes edits to the same key", async () => {
    let finish: ((value: { error: null }) => void) | undefined;
    mocks.upsert.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const first = saveList("serialized", [{ id: 1 }]);
    const second = saveList("serialized", [{ id: 2 }]);
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(1));
    finish?.({ error: null });
    await Promise.all([first, second]);
    expect(mocks.upsert.mock.calls.map(([row]) => row.dados)).toEqual([[{ id: 1 }], [{ id: 2 }]]);
  });

  it("saves an edit even when its page immediately unmounts", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(savedListKey("navigation"), [{ id: 1 }]);
    const hook = renderHook(() => usePersistedList<{ id: number }>("navigation", []), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}><Suspense>{children}</Suspense></QueryClientProvider>,
    });
    act(() => hook.result.current[1]((rows) => [...rows, { id: 2 }]));
    hook.unmount();
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalled());
    expect(mocks.upsert.mock.calls[0]?.[0].dados).toEqual([{ id: 1 }, { id: 2 }]);
    expect(qc.getQueryData(savedListKey("navigation"))).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("Bounded data reads and rendering", () => {
  it("reads only product and lens keys for a sale", async () => {
    await catalogOptions.queryFn?.({} as never);
    expect(mocks.inKeys).toHaveBeenCalledWith("chave", ["produtos", "lentes:lentes-monofocais", "lentes:lentes-multifocais", "lentes:lentes-de-contato", "lentes:tratamentos"]);
  });
  it("excludes unrelated catalogs from report reads", async () => {
    await reportOptions.queryFn?.({} as never);
    expect(mocks.inKeys).toHaveBeenCalledWith("chave", ["modulo:Vendas", "modulo:Fluxo de Caixa", "modulo:Contas a pagar", "modulo:Contas a receber", "modulo:Ordens de Serviço (O.S.)", "atividades"]);
  });
  it("keeps every row reachable and resets page when filtering", () => {
    const items = Array.from({ length: 404 }, (_, id) => id);
    const hook = renderHook(({ scope }) => useTablePage(items, scope), { initialProps: { scope: "all" } });
    expect(hook.result.current.visible).toEqual(items.slice(0, 50));
    act(() => hook.result.current.onPage(8));
    expect(hook.result.current.visible).toEqual([400, 401, 402, 403]);
    hook.rerender({ scope: "search" });
    expect(hook.result.current.page).toBe(0);
  });
});