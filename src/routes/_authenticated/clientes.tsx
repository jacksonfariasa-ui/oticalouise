import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

type Cliente = { id: number; nome: string; cpf: string; telefone: string; email: string; nascimento: string; cidade: string };

const INICIAIS: Cliente[] = [
  { id: 1, nome: "Mariana Souza", cpf: "123.456.789-00", telefone: "(11) 98765-4321", email: "mariana@email.com", nascimento: "1990-03-12", cidade: "São Paulo" },
  { id: 2, nome: "Carlos Mendes", cpf: "987.654.321-00", telefone: "(11) 91234-5678", email: "carlos@email.com", nascimento: "1985-10-18", cidade: "Guarulhos" },
  { id: 3, nome: "Fernanda Lima", cpf: "456.789.123-00", telefone: "(11) 99876-1234", email: "fernanda@email.com", nascimento: "1978-07-05", cidade: "Osasco" },
  { id: 4, nome: "João Pereira", cpf: "321.654.987-00", telefone: "(11) 97654-3210", email: "joao@email.com", nascimento: "1995-01-22", cidade: "São Paulo" },
];

const VAZIO = { nome: "", cpf: "", telefone: "", email: "", nascimento: "", cidade: "" };
const CAMPOS: [keyof typeof VAZIO, string, string][] = [
  ["nome", "Nome completo", "text"], ["cpf", "CPF", "text"], ["telefone", "Telefone", "tel"],
  ["email", "E-mail", "email"], ["nascimento", "Nascimento", "date"], ["cidade", "Cidade", "text"],
];

function Clientes() {
  const [lista, setLista] = useState<Cliente[]>(INICIAIS);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return lista.filter((c) => [c.nome, c.cpf, c.telefone, c.email].some((v) => v.toLowerCase().includes(q)));
  }, [lista, busca]);

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setLista((l) => [{ id: Date.now(), ...form }, ...l]);
    setForm(VAZIO);
    setAberto(false);
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
                  <td className="text-right"><Button size="icon" variant="ghost" aria-label={`Excluir ${c.nome}`} onClick={() => setLista((l) => l.filter((x) => x.id !== c.id))}><Trash2 className="h-4 w-4" /></Button></td>
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
    </div>
  );
}
