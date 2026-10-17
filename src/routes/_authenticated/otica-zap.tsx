import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/otica-zap")({
  head: () => ({
    meta: [
      { title: "Ótica Zap — Visão Ótica" },
      { name: "description", content: "Envio e acompanhamento de mensagens de WhatsApp para clientes da ótica." },
      { property: "og:title", content: "Ótica Zap — Visão Ótica" },
      { property: "og:description", content: "Envio e acompanhamento de mensagens de WhatsApp para clientes da ótica." },
    ],
  }),
  component: OticaZap,
});

const STATUS = ["Ver todas", "Na fila de envio", "Enviadas", "Entregues", "Sem WhatsApp", "Bloqueado pelo cliente", "Visualizadas", "Canceladas", "Erro"];
const TIPOS = ["Todos", "Aniversário", "Pós-venda", "O.S. pronta", "Receita vencida", "Cobrança"];
const MSGS = [
  { cliente: "Mariana Souza", tel: "(11) 98877-1122", tipo: "O.S. pronta", status: "Visualizadas", data: "2026-10-17" },
  { cliente: "Carlos Mendes", tel: "(11) 97766-2233", tipo: "Aniversário", status: "Entregues", data: "2026-10-17" },
  { cliente: "Fernanda Lima", tel: "(21) 99654-8811", tipo: "Pós-venda", status: "Enviadas", data: "2026-10-16" },
  { cliente: "João Pereira", tel: "(31) 3344-5566", tipo: "Cobrança", status: "Sem WhatsApp", data: "2026-10-16" },
  { cliente: "Ana Beatriz Rocha", tel: "(11) 91234-5678", tipo: "Receita vencida", status: "Na fila de envio", data: "2026-10-17" },
  { cliente: "Roberto Alves", tel: "(19) 98111-4455", tipo: "Cobrança", status: "Bloqueado pelo cliente", data: "2026-10-14" },
  { cliente: "Patrícia Gomes", tel: "(11) 95544-3322", tipo: "Pós-venda", status: "Erro", data: "2026-10-15" },
  { cliente: "Lucas Martins", tel: "(41) 99887-6655", tipo: "Aniversário", status: "Canceladas", data: "2026-10-13" },
  { cliente: "Juliana Castro", tel: "(11) 96655-7788", tipo: "O.S. pronta", status: "Entregues", data: "2026-10-15" },
];

function OticaZap() {
  const [status, setStatus] = useState("Ver todas");
  const [tipo, setTipo] = useState("Todos");
  const [de, setDe] = useState("2026-10-01");
  const [ate, setAte] = useState("2026-10-31");
  const [applied, setApplied] = useState({ tipo: "Todos", de: "2026-10-01", ate: "2026-10-31" });
  const base = MSGS.filter((m) => (applied.tipo === "Todos" || m.tipo === applied.tipo) && m.data >= applied.de && m.data <= applied.ate);
  const rows = base.filter((m) => status === "Ver todas" || m.status === status);
  const count = (s: string) => (s === "Ver todas" ? base.length : base.filter((m) => m.status === s).length);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ótica Zap</h1>
      <Card className="flex items-center gap-3 border-success/40 bg-success/10 p-4">
        <CheckCircle2 className="h-6 w-6 text-success" />
        <div><div className="font-semibold">Seu WhatsApp está conectado</div><div className="text-sm text-muted-foreground">Número (11) 4002-8922 · sincronizado há 2 min</div></div>
      </Card>
      <Card className="p-5">
        <div className="mb-4 border-b pb-3 font-semibold">Outros envios</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS.map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
              {s} <Badge variant="secondary" className="ml-1">{count(s)}</Badge>
            </Button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">Tipo de mensagem
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-1 block h-9 rounded-md border bg-background px-2">{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="text-sm">De<Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="mt-1" /></label>
          <label className="text-sm">Até<Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="mt-1" /></label>
          <Button onClick={() => setApplied({ tipo, de, ate })}>Filtrar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="py-2">Cliente</th><th>Telefone</th><th>Tipo</th><th>Data</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.cliente} className="border-t"><td className="py-2 font-medium">{m.cliente}</td><td>{m.tel}</td><td>{m.tipo}</td><td>{m.data.split("-").reverse().join("/")}</td><td><Badge variant="outline">{m.status}</Badge></td></tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma mensagem encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
