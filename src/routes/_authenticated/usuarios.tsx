import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { createUser, deleteUser, listUsers, resetUserPassword, setUserRole } from "@/lib/users.functions";
import { ROLES, canAccess, roleLabel, type Role } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e permissões — Ótica Louise" },
      { name: "description", content: "Cadastre a equipe, defina perfis de acesso e gerencie senhas." },
      { property: "og:title", content: "Usuários e permissões — Ótica Louise" },
      { property: "og:description", content: "Cadastre a equipe, defina perfis de acesso e gerencie senhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Usuarios,
});

function Usuarios() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const setRole = useServerFn(setUserRole);
  const reset = useServerFn(resetUserPassword);
  const del = useServerFn(deleteUser);
  const { data: users = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["usuarios"] });
  const run = useMutation({ mutationFn: (f: () => Promise<unknown>) => f(), onSuccess: refresh, onError: (e: Error) => setErro(e.message) });

  const counts = ROLES.map((r) => ({ ...r, n: users.filter((u) => u.role === r.value).length }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuários e permissões</h1>
          <p className="text-sm text-muted-foreground">Cadastre a equipe e escolha o perfil de cada pessoa.</p>
        </div>
        <button onClick={() => { setErro(""); setOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Novo usuário</button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {counts.map((c) => (
          <div key={c.value} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.n}</div>
          </div>
        ))}
      </div>

      {erro && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">E-mail</th><th className="p-3">Perfil</th><th className="p-3">Último acesso</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {users.map((u) => {
              const self = u.id === session?.user.id;
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{u.nome}{self && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <select disabled={self} value={u.role ?? ""} onChange={(e) => { setErro(""); run.mutate(() => setRole({ data: { userId: u.id, role: e.target.value as Role } })); }} className="rounded-md border bg-background px-2 py-1">
                      {!u.role && <option value="">Aguardando liberação</option>}
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground">{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString("pt-BR") : "Nunca"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button title="Definir nova senha" onClick={() => { const s = prompt(`Nova senha para ${u.nome} (mín. 8 caracteres):`); if (s) { setErro(""); run.mutate(() => reset({ data: { userId: u.id, senha: s } })); } }} className="rounded p-2 hover:bg-accent"><KeyRound className="h-4 w-4" /></button>
                      {!self && <button title="Excluir" onClick={() => { if (confirm(`Excluir ${u.nome}?`)) { setErro(""); run.mutate(() => del({ data: { userId: u.id } })); } }} className="rounded p-2 text-destructive hover:bg-accent"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />O que cada perfil acessa</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Área</th>{ROLES.map((r) => <th key={r.value} className="p-3 text-center">{r.label}</th>)}</tr>
            </thead>
            <tbody>
              {NAV.map((n) => (
                <tr key={n.label} className="border-b last:border-0">
                  <td className="p-3">{n.label}</td>
                  {ROLES.map((r) => {
                    const ok = n.children ? n.children.some((c) => canAccess(r.value, c.slug)) : canAccess(r.value, n.slug);
                    return <td key={r.value} className="p-3 text-center">{ok ? <span className="text-primary">●</span> : <span className="text-muted-foreground">—</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && <NovoUsuario onClose={() => setOpen(false)} onSave={async (d) => { await create({ data: d }); refresh(); }} />}
    </div>
  );
}

function NovoUsuario({ onClose, onSave }: { onClose: () => void; onSave: (d: { nome: string; email: string; senha: string; role: Role }) => Promise<void> }) {
  const [f, setF] = useState({ nome: "", email: "", senha: "", role: "vendedor" as Role });
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const inp = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.nome.trim().length < 2) return setErro("Informe o nome");
    if (f.senha.length < 8) return setErro("A senha precisa de ao menos 8 caracteres");
    setBusy(true);
    try { await onSave(f); onClose(); } catch (err) { setErro((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Novo usuário</h2><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div>
        <input className={inp} placeholder="Nome completo" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <input className={inp} type="email" placeholder="E-mail de acesso" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className={inp} type="text" placeholder="Senha inicial (mín. 8)" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
        <div className="space-y-2">
          {ROLES.map((r) => (
            <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary">
              <input type="radio" name="role" checked={f.role === r.value} onChange={() => setF({ ...f, role: r.value })} className="mt-1" />
              <span><span className="block text-sm font-medium">{r.label}</span><span className="text-xs text-muted-foreground">{r.desc}</span></span>
            </label>
          ))}
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <p className="text-xs text-muted-foreground">Perfil escolhido: {roleLabel(f.role)}. Entregue o e-mail e a senha à pessoa; ela já pode entrar.</p>
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Salvando…" : "Criar usuário"}</button>
      </form>
    </div>
  );
}
