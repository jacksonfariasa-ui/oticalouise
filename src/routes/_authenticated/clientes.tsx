import { registrarAtividade } from "@/lib/atividades";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { History, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/venda";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Ótica Louise" },
      { name: "description", content: "Cadastro e consulta de clientes da ótica." },
      { property: "og:title", content: "Clientes — Ótica Louise" },
      { property: "og:description", content: "Cadastro e consulta de clientes da ótica." },
    ],
  }),
  component: Clientes,
});

type Cliente = { id: string; nome: string; cpf: string; telefone: string; email: string; nascimento: string; cidade: string };
type Olho = { esf: string; cil: string; eixo: string; adicao: string; dnp: string };
type Dados = {
  data?: string; validade?: string; vendedor?: string; pagamento?: string; parcelas?: number; entrada?: number;
  entrega?: string; obs?: string; desconto?: { tipo: string; valor: number };
  itens?: { codigo: string; descricao: string; preco: number; qtd: number }[];
  receita?: { od: Olho; oe: Olho }; anexo?: { nome: string } | null;
};
type Venda = { id: string; numero: string; tipo: string; total: number; created_at: string; dados: Dados };

const VAZIO = { nome: "", cpf: "", telefone: "", email: "", nascimento: "", cidade: "" };
const CAMPOS: [keyof typeof VAZIO, string, string][] = [
  ["nome", "Nome completo", "text"], ["cpf", "CPF", "text"], ["telefone", "Telefone", "tel"],
  ["email", "E-mail", "email"], ["nascimento", "Nascimento", "date"], ["cidade", "Cidade", "text"],
];
const fmt = (d?: string) => (d ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—");

function Clientes() {
  const [lista, setLista] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [historico, setHistorico] = useState<{ cliente: Cliente; vendas: Venda[] } | null>(null);

  const carregar = () => supabase.from("clientes").select("*").order("nome").then(({ data }) => setLista(data ?? []));
  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return lista.filter((c) => [c.nome, c.cpf, c.telefone, c.email].some((v) => v.toLowerCase().includes(q)));
  }, [lista, busca]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    const { error } = await supabase.from("clientes").insert(form);
    if (error) { toast.error("Não foi possível salvar o cliente."); return; }
    registrarAtividade(`Clientes: cadastrou ${form.nome}`);
    setForm(VAZIO); setAberto(false); void carregar();
  };

  const excluir = async (c: Cliente) => {
    if (!confirm(`Excluir ${c.nome} e todo o histórico?`)) return;
    const { error } = await supabase.from("clientes").delete().eq("id", c.id).select();
    if (error) { toast.error("Sem permissão para excluir."); return; }
    registrarAtividade(`Clientes: excluiu ${c.nome}`);
    void carregar();
  };

  const verHistorico = async (c: Cliente) => {
    const { data } = await supabase.from("cliente_vendas").select("*").eq("cliente_id", c.id).order("created_at", { ascending: false });
    setHistorico({ cliente: c, vendas: (data ?? []) as unknown as Venda[] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-bold">Clientes</h1><p className="text-sm text-muted-foreground">{lista.length} clientes cadastrados</p></div>
        <Button onClick={() => setAberto(true)}><Plus className="h-4 w-4" />Novo cliente</Button>
      </div>
      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, CPF, telefone ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">Nome</th><th className="pr-3">CPF</th><th className="pr-3">Telefone</th><th className="pr-3">E-mail</th><th className="pr-3">Cidade</th><th />
            </tr></thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{c.nome}</td><td className="pr-3">{c.cpf}</td><td className="pr-3">{c.telefone}</td>
                  <td className="pr-3">{c.email}</td><td className="pr-3">{c.cidade}</td>
                  <td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => verHistorico(c)}><History className="h-4 w-4" />Histórico</Button>
                    <Button size="icon" variant="ghost" aria-label={`Excluir ${c.nome}`} onClick={() => excluir(c)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="grid gap-3 sm:grid-cols-2">
            {CAMPOS.map(([k, label, type]) => (
              <label key={k} className={k === "nome" ? "sm:col-span-2" : ""}>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
                <Input type={type} required={k === "nome"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
            <Button type="submit" className="sm:col-span-2">Salvar cliente</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historico} onOpenChange={(o) => !o && setHistorico(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Histórico — {historico?.cliente.nome}</DialogTitle></DialogHeader>
          {historico?.vendas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma venda ou orçamento registrado.</p>}
          <div className="space-y-4">
            {historico?.vendas.map((v) => {
              const d = v.dados;
              return (
                <Card key={v.id} className="space-y-3 p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="font-semibold">{v.tipo} {v.numero}</div>
                    <div className="text-muted-foreground">{fmt(d.data ?? v.created_at)} · Vendedor: {d.vendedor || "—"}</div>
                  </div>
                  <table className="w-full">
                    <thead><tr className="text-left text-xs text-muted-foreground"><th>Item</th><th>Qtd</th><th className="text-right">Valor</th></tr></thead>
                    <tbody>{d.itens?.map((i, n) => <tr key={n}><td>{i.codigo} — {i.descricao}</td><td>{i.qtd}</td><td className="text-right">{brl(i.preco * i.qtd)}</td></tr>)}</tbody>
                  </table>
                  <div className="grid gap-1 sm:grid-cols-2">
                    <div>Pagamento: {d.pagamento} {d.parcelas && d.parcelas > 1 ? `em ${d.parcelas}x` : ""}</div>
                    <div>Entrada: {brl(d.entrada ?? 0)}</div>
                    <div>Desconto: {d.desconto ? (d.desconto.tipo === "percentual" ? `${d.desconto.valor}%` : brl(d.desconto.valor)) : "—"}</div>
                    <div className="font-semibold">Total: {brl(Number(v.total))}</div>
                    {d.entrega && <div>Entrega: {fmt(d.entrega)}</div>}
                    {d.validade && <div>Validade: {fmt(d.validade)}</div>}
                  </div>
                  {d.receita && (
                    <table className="w-full text-xs">
                      <thead><tr className="text-left text-muted-foreground"><th>Receita</th><th>Esf</th><th>Cil</th><th>Eixo</th><th>Adição</th><th>DNP</th></tr></thead>
                      <tbody>
                        {(["od", "oe"] as const).map((o) => (
                          <tr key={o}><td className="font-medium uppercase">{o}</td><td>{d.receita![o].esf}</td><td>{d.receita![o].cil}</td><td>{d.receita![o].eixo}</td><td>{d.receita![o].adicao}</td><td>{d.receita![o].dnp}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {d.obs && <div>Obs.: {d.obs}</div>}
                  {d.anexo && <div className="text-muted-foreground">Anexo na venda: {d.anexo.nome}</div>}
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
