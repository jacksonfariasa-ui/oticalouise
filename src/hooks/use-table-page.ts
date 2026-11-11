import { useState } from "react";

export function useTablePage<T>(items: T[], scope: string, size = 50) {
  const [state, setState] = useState({ scope, page: 0 });
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = state.scope === scope ? Math.min(state.page, pages - 1) : 0;
  return { page, pages, visible: items.slice(page * size, (page + 1) * size), onPage: (next: number) => setState({ scope, page: Math.max(0, Math.min(next, pages - 1)) }) };
}