import { registrarAtividade } from "@/lib/atividades";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, KeyRound, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { displayLogin } from "@/lib/username";
import { createUser, deleteUser, listUsers, resetUserPassword, setUserAcessos, setUserFilial, setUserRole } from "@/lib/users.functions";
import { ROLES, canAccess, grantableSlugs, roleLabel, type Role } from "@/lib/permissions";
import { NAV } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { FILIAIS_OPCOES, exigeFilial } from "@/lib/filiais";
import { EmpresaConfig } from "@/components/EmpresaConfig";

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
  const saveAcessos = useServerFn(setUserAcessos);
  const [filtroFilial, setFiltroFilial] = useState("todas");
  const { data: users = [], isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: () => list() });
  const [acessoDe, setAcessoDe] = useState<(typeof users)[number] | null>(null);
  const [open, setOpen] = useState(false);
  const [erro, setErro] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["usuarios"] });
  const run = useMutation({ mutationFn: (f: () => Promise<unknown>) => f(), onSuccess: () => { registrarAtividade("Usuários: alterou usuários ou permissões"); return refresh(); }, onError: (e: Error) => setErro(e.message) });

  const porFilial = FILIAIS_OPCOES.map((f) => ({ ...f, n: users.filter((u) => u.filial === f.id).length }));
  const semFilial = users.filter((u) => u.role && exigeFilial(u.role) && !u.filial).length;
  const visiveis = users.filter((u) => filtroFilial === "todas" || (filtroFilial === "sem" ? !u.filial : u.filial === filtroFilial));
  const counts = ROLES.map((r) => ({ ...r, n: users.filter((u) => u.role === r.value).length }));

  return (
    <div className="space-y-6">
      <EmpresaConfig />
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

      <RegistroEquipe users={visiveis} selfId={session?.user.id} />

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
                      {u.role !== "admin" && <button title="Escolher acessos" onClick={() => { setErro(""); setAcessoDe(u); }} className="rounded p-2 text-primary hover:bg-accent"><ShieldCheck className="h-4 w-4" /></button>}
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

      {acessoDe && acessoDe.role && (
        <Acessos nome={acessoDe.nome} role={acessoDe.role as Role} atual={acessoDe.acessos ?? null} onClose={() => setAcessoDe(null)}
          onSave={async (acessos) => { await saveAcessos({ data: { userId: acessoDe.id, acessos } }); refresh(); }} />
      )}
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

function Acessos({ nome, role, atual, onClose, onSave }: { nome: string; role: Role; atual: string[] | null; onClose: () => void; onSave: (a: string[] | null) => Promise<void> }) {
  const todos = grantableSlugs(NAV);
  const padrao = todos.filter((s) => canAccess(role, s));
  const [sel, setSel] = useState<Set<string>>(new Set(atual ?? padrao));
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState("");
  const toggle = (s: string) => setSel((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const grupo = (slugs: string[], on: boolean) => setSel((p) => { const n = new Set(p); slugs.forEach((s) => (on ? n.add(s) : n.delete(s))); return n; });
  async function salvar(valor: string[] | null) {
    setBusy(true); setErro("");
    try { await onSave(valor); onClose(); } catch (e) { setErro((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b p-5">
          <div><h2 className="text-lg font-bold">Acessos de {nome}</h2><p className="text-sm text-muted-foreground">Perfil {roleLabel(role)} · {atual ? "acessos personalizados" : "usando o padrão do perfil"}</p></div>
          <button aria-label="Fechar" onClick={onClose} className="rounded p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-wrap gap-2 border-b px-5 py-3 text-xs">
          <button onClick={() => setSel(new Set(todos))} className="rounded-full border px-3 py-1 hover:bg-accent">Marcar tudo</button>
          <button onClick={() => setSel(new Set())} className="rounded-full border px-3 py-1 hover:bg-accent">Desmarcar tudo</button>
          <button onClick={() => setSel(new Set(padrao))} className="rounded-full border px-3 py-1 hover:bg-accent">Padrão do perfil</button>
          <span className="ml-auto self-center text-muted-foreground">{sel.size} de {todos.length} áreas</span>
        </div>
        <div className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {NAV.filter((n) => n.slug && n.slug !== "administracao").map((n) => {
            const itens = n.children ? n.children : [{ label: n.label, slug: n.slug }];
            const Icon = n.icon;
            const all = itens.every((c) => sel.has(c.slug));
            return (
              <div key={n.label} className="rounded-lg border p-3">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={all} onChange={(e) => (n.children ? grupo(itens.map((c) => c.slug), e.target.checked) : toggle(n.slug))} className="h-4 w-4 accent-primary" />
                  <Icon className="h-4 w-4 text-primary" />{n.label}
                </label>
                {n.children && (
                  <div className="mt-2 space-y-1 pl-6">
                    {n.children.map((c) => (
                      <label key={c.slug} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={sel.has(c.slug)} onChange={() => toggle(c.slug)} className="h-4 w-4 accent-primary" />{c.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {erro && <p className="px-5 text-sm text-destructive">{erro}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t p-4">
          {atual && <button disabled={busy} onClick={() => salvar(null)} className="mr-auto rounded-md border px-4 py-2 text-sm">Voltar ao padrão do perfil</button>}
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
          <button disabled={busy} onClick={() => salvar([...sel])} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{busy ? "Salvando…" : "Salvar acessos"}</button>
        </div>
      </div>
    </div>
  );
}

type Membro = { id: string; nome: string; email: string; role: string | null; filial: string | null; created_at: string; ultimo_acesso: string | null };
const TOM_PERFIL: Record<string, string> = {
  admin: "bg-primary/10 text-primary", gerente: "bg-success/10 text-success",
  vendedor: "bg-warning/15 text-warning", tecnico: "bg-muted text-muted-foreground",
};
const iniciais = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
const dataBR = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

function RegistroEquipe({ users, selfId }: { users: Membro[]; selfId?: string }) {
  const [busca, setBusca] = useState("");
  const q = busca.trim().toLowerCase();
  const lista = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((u) => !q || u.nome.toLowerCase().includes(q) || roleLabel(u.role as Role).toLowerCase().includes(q));
  const novo = (d: string) => Date.now() - new Date(d).getTime() < 7 * 864e5;
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" />Registro da equipe</h2>
          <p className="text-xs text-muted-foreground">Todo usuário cadastrado aparece aqui automaticamente, do mais recente ao mais antigo.</p>
        </div>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou perfil" aria-label="Buscar na equipe"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-64" />
      </div>
      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Nenhum membro encontrado. Use “Novo usuário” para cadastrar a equipe.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((u) => {
            const filial = FILIAIS_OPCOES.find((f) => f.id === u.filial)?.nome;
            return (
              <article key={u.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{iniciais(u.nome)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{u.nome}</h3>
                      {u.id === selfId && <span className="text-xs text-muted-foreground">(você)</span>}
                      {novo(u.created_at) && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">Novo</span>}
                    </div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${u.role ? TOM_PERFIL[u.role] ?? "" : "bg-destructive/10 text-destructive"}`}>
                      {u.role ? roleLabel(u.role as Role) : "Aguardando liberação"}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div><dt className="text-muted-foreground">Login</dt><dd className="truncate font-medium">{displayLogin(u.email)}</dd></div>
                  <div><dt className="text-muted-foreground">Filial</dt><dd className="truncate font-medium">{filial ?? "Todas"}</dd></div>
                  <div><dt className="text-muted-foreground">Cadastrado em</dt><dd className="font-medium">{dataBR(u.created_at)}</dd></div>
                  <div><dt className="text-muted-foreground">Último acesso</dt><dd className="font-medium">{u.ultimo_acesso ? dataBR(u.ultimo_acesso) : "Nunca entrou"}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
