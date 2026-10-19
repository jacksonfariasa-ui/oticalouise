import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, User } from "lucide-react";
import { useEmpresa } from "@/lib/empresa";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/lib/permissions";
import { loginEmail } from "@/lib/username";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ótica Louise" },
      { name: "description", content: "Acesse o sistema de gestão da Ótica Louise com seu nome e senha." },
      { property: "og:title", content: "Entrar — Ótica Louise" },
      { property: "og:description", content: "Acesse o sistema de gestão da Ótica Louise com seu nome e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});


function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<{ t: "erro" | "ok"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/", replace: true }); });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email.trim() || !senha) return setMsg({ t: "erro", m: "Informe o nome e a senha." });
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail(email), password: senha });
    setBusy(false);
    if (error) return setMsg({ t: "erro", m: "Nome ou senha incorretos." });
    navigate({ to: "/", replace: true });
  }

  const field = "w-full rounded-md border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-sidebar-border"><img src={useEmpresa().logo} alt="Logo Ótica Louise" className="h-full w-full rounded-full object-cover" /></div>
          <span className="text-lg font-bold">Ótica Louise</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Cada pessoa da equipe vê só o que precisa.</h2>
          <ul className="mt-8 space-y-4">
            {ROLES.map((r) => (
              <li key={r.value} className="rounded-lg border border-sidebar-border p-4">
                <div className="font-semibold">{r.label}</div>
                <div className="text-sm opacity-70">{r.desc}</div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-50">Gestão para óticas</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full"><img src={useEmpresa().logo} alt="Logo Ótica Louise" className="h-full w-full rounded-full object-cover" /></div>
            <span className="font-bold">Ótica Louise</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Entrar no sistema</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use o nome e a senha fornecidos pelo administrador.
            </p>
          </div>
          <label className="relative block"><User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input className={field} placeholder="Nome" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="relative block"><Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input className={field} type="password" placeholder="Senha" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          {msg && <p className={msg.t === "erro" ? "text-sm text-destructive" : "text-sm text-primary"}>{msg.m}</p>}
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? "Aguarde…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Acesso liberado pelo administrador. Esqueceu a senha? Peça uma nova a ele.</p>
        </form>
      </div>
    </div>
  );
}
