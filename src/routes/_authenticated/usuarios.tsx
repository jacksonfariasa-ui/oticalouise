import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, KeyRound, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { displayLogin } from "@/lib/username";
import { createUser, deleteUser, listUsers, resetUserPassword, setUserFilial, setUserRole } from "@/lib/users.functions";
import { ROLES, canAccess, roleLabel, type Role } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { FILIAIS_OPCOES, exigeFilial } from "@/lib/filiais";

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
  const setFilial = useServerFn(setUserFilial);
  const [filtroFilial, setFiltroFilial] = useState("todas");
  const { data: users = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["usuarios"] });
  const run = useMutation({ mutationFn: (f: () => Promise<unknown>) => f(), onSuccess: refresh, onError: (e: Error) => setErro(e.message) });

  const porFilial = FILIAIS_OPCOES.map((f) => ({ ...f, n: users.filter((u) => u.filial === f.id).length }));
  const semFilial = users.filter((u) => u.role && exigeFilial(u.role) && !u.filial).length;
  const visiveis = users.filter((u) => filtroFilial === "todas" || (filtroFilial === "sem" ? !u.filial : u.filial === filtroFilial));
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

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4" />Equipe por filial</h2>
          {semFilial > 0 && <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">{semFilial} vendedor(es)/gerente(s) sem filial</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ id: "todas", nome: "Todas", n: users.length }, ...porFilial, { id: "sem", nome: "Sem filial", n: users.filter((u) => !u.filial).length }].map((f) => (
            <button key={f.id} onClick={() => setFiltroFilial(f.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filtroFilial === f.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{f.nome} <span className="opacity-70">({f.n})</span></button>
          ))}
        </div>
      </div>

      {erro && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{erro}</p>}

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Nome</th><th className="p-3">Login</th><th className="p-3">Perfil</th><th className="p-3">Filial</th><th className="p-3">Último acesso</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && visiveis.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum usuário nesta filial.</td></tr>}
            {visiveis.map((u) => {
              const self = u.id === session?.user.id;
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{u.nome}{self && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}</td>
                  <td className="p-3 text-muted-foreground">{displayLogin(u.email)}</td>
                  <td className="p-3">
                    <select disabled={self} value={u.role ?? ""} onChange={(e) => { setErro(""); run.mutate(() => setRole({ data: { userId: u.id, role: e.target.value as Role } })); }} className="rounded-md border bg-background px-2 py-1">
                      {!u.role && <option value="">Aguardando liberação</option>}
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select value={u.filial ?? ""} onChange={(e) => { setErro(""); run.mutate(() => setFilial({ data: { userId: u.id, filial: e.target.value || null } })); }} className={`rounded-md border bg-background px-2 py-1 ${u.role && exigeFilial(u.role) && !u.filial ? "border-warning" : ""}`}>
                      <option value="">{u.role && exigeFilial(u.role) ? "Selecione…" : "Todas (sem vínculo)"}</option>
                      {FILIAIS_OPCOES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground">{u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString("pt-BR") : "Nunca"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button title="Definir nova senha" onClick={() => { const s = prompt(`Nova senha para ${u.nome} :`); if (s) { setErro(""); run.mutate(() => reset({ data: { userId: u.id, senha: s } })); } }} className="rounded p-2 hover:bg-accent"><KeyRound className="h-4 w-4" /></button>
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

function NovoUsuario({ onClose, onSave }: { onClose: () => void; onSave: (d: { nome: string; senha: string; role: Role; filial: string | null }) => Promise<void> }) {
  const [f, setF] = useState({ nome: "", senha: "", role: "vendedor" as Role, filial: "" });
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const inp = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.nome.trim().length < 2) return setErro("Informe o nome");
    if (f.senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres");
    if (exigeFilial(f.role) && !f.filial) return setErro("Selecione a filial do vendedor/gerente");
    setBusy(true);
    try { await onSave({ ...f, filial: exigeFilial(f.role) ? f.filial : null }); onClose(); } catch (err) { setErro((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <form onSubmit={submit} className="w-full max-h-[90vh] max-w-md space-y-3 overflow-y-auto rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Novo usuário</h2><button type="button" onClick={onClose}><X className="h-5 w-5" /></button></div>
        <input className={inp} placeholder="Nome (usado para entrar)" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <input className={inp} type="text" placeholder="Senha" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
        <div className="space-y-2">
          {ROLES.map((r) => (
            <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary">
              <input type="radio" name="role" checked={f.role === r.value} onChange={() => setF({ ...f, role: r.value })} className="mt-1" />
              <span><span className="block text-sm font-medium">{r.label}</span><span className="text-xs text-muted-foreground">{r.desc}</span></span>
            </label>
          ))}
        </div>
        {exigeFilial(f.role) && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Filial de atuação <span className="text-destructive">*</span></span>
            <select className={inp} value={f.filial} onChange={(e) => setF({ ...f, filial: e.target.value })}>
              <option value="">Selecione a filial…</option>
              {FILIAIS_OPCOES.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            <span className="block text-xs text-muted-foreground">{roleLabel(f.role)} fica vinculado(a) a esta unidade.</span>
          </label>
        )}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <p className="text-xs text-muted-foreground">Perfil escolhido: {roleLabel(f.role)}. Entregue o nome e a senha à pessoa; ela já pode entrar.</p>
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Salvando…" : "Criar usuário"}</button>
      </form>
    </div>
  );
}
