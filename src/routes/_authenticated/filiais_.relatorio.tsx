import { printElement } from "@/lib/print";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, FileBarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFiliais, brl, pctMeta } from "@/lib/filiais";

export const Route = createFileRoute("/_authenticated/filiais_/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório final das filiais — Ótica Louise" },
      { name: "description", content: "Relatório consolidado da Matriz, Filial Rorainópolis e Filial Pintolândia." },
      { property: "og:title", content: "Relatório final das filiais — Ótica Louise" },
      { property: "og:description", content: "Relatório consolidado das três unidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Relatorio,
});

function Relatorio() {
  const lista = useFiliais();
  const soma = (k: "faturamento" | "meta" | "vendas" | "osAbertas" | "estoque" | "clientes") => lista.reduce((a, f) => a + f[k], 0);
  const equipe = lista.reduce((a, f) => a + f.equipe.length, 0);
  const total = soma("faturamento");
  const gerado = new Date().toLocaleString("pt-BR");

  const linhas: [string, (f: (typeof lista)[number]) => string, string][] = [
    ["Faturamento", (f) => brl(f.faturamento), brl(total)],
    ["Meta mensal", (f) => brl(f.meta), brl(soma("meta"))],
    ["Atingimento da meta", (f) => `${pctMeta(f.faturamento, f.meta)}%`, `${pctMeta(total, soma("meta"))}%`],
    ["Participação no faturamento", (f) => `${Math.round((f.faturamento / total) * 100)}%`, "100%"],
    ["Vendas", (f) => String(f.vendas), String(soma("vendas"))],
    ["Ticket médio", (f) => brl(f.vendas ? f.faturamento / f.vendas : 0), brl(soma("vendas") ? total / soma("vendas") : 0)],
    ["O.S. em aberto", (f) => String(f.osAbertas), String(soma("osAbertas"))],
    ["Itens em estoque", (f) => f.estoque.toLocaleString("pt-BR"), soma("estoque").toLocaleString("pt-BR")],
    ["Clientes", (f) => f.clientes.toLocaleString("pt-BR"), soma("clientes").toLocaleString("pt-BR")],
    ["Colaboradores", (f) => String(f.equipe.length), String(equipe)],
    ["Status", (f) => f.status, "—"],
  ];

  return (
    <div className="space-y-6">
      <header className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatório final das filiais</h1>
          <p className="text-sm text-muted-foreground">Consolidado da Matriz, Filial Rorainópolis e Filial Pintolândia</p>
        </div>
        <Button onClick={() => printElement(document.querySelector(".print-area") as HTMLElement)}><Printer className="mr-1 h-4 w-4" />Gerar relatório (imprimir / PDF)</Button>
      </header>

      <Card className="print-area space-y-6 p-6">
        <div className="flex items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-2"><FileBarChart className="h-5 w-5 text-primary" /><span className="text-lg font-bold">Ótica Louise — Relatório consolidado</span></div>
          <span className="text-xs text-muted-foreground">Gerado em {gerado}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Indicador</th>
                {lista.map((f) => <th key={f.id} className="py-2 pr-3">{f.nome}</th>)}
                <th className="py-2">Total da rede</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(([rot, fn, tot]) => (
                <tr key={rot} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-muted-foreground">{rot}</td>
                  {lista.map((f) => <td key={f.id} className="py-2 pr-3">{fn(f)}</td>)}
                  <td className="py-2 font-semibold">{tot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {lista.map((f) => (
            <div key={f.id} className="rounded-lg border p-4 text-sm">
              <div className="font-semibold">{f.nome}</div>
              <div className="text-xs text-muted-foreground">{f.endereco}, {f.cidade}</div>
              <div className="mt-2 text-xs">Gerente: {f.gerente} · {f.telefone}</div>
              <div className="mt-3 text-xs font-medium">Últimas vendas</div>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {f.vendasLista.slice(0, 3).map((v) => <li key={v.id}>{v.cliente} — {brl(v.valor)}</li>)}
                {!f.vendasLista.length && <li>Sem vendas registradas</li>}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
