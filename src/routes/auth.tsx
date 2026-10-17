import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Lock, Mail, User } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/lib/permissions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Ótica Louise" },
      { name: "description", content: "Acesse o sistema de gestão da Ótica Louise com seu e-mail e senha." },
      { property: "og:title", content: "Entrar — Ótica Louise" },
      { property: "og:description", content: "Acesse o sistema de gestão da Ótica Louise com seu e-mail e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(8, "A senha precisa de ao menos 8 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [nome, setNome] = useState("");
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
    if (mode === "esqueci") {
      const ok = z.string().email().safeParse(email.trim());
      if (!ok.success) return setMsg({ t: "erro", m: "E-mail inválido" });
      setBusy(true);
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      return setMsg({ t: "ok", m: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha." });
    }
    const p = schema.safeParse({ email, senha });
    if (!p.success) return setMsg({ t: "erro", m: p.error.issues[0]?.message ?? "Dados inválidos" });
    setBusy(true);
    if (mode === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.senha });
      setBusy(false);
      if (error) return setMsg({ t: "erro", m: "E-mail ou senha incorretos." });
      navigate({ to: "/", replace: true });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: p.data.email, password: p.data.senha,
        options: { emailRedirectTo: window.location.origin, data: { nome: nome.trim() } },
      });
      setBusy(false);
      if (error) return setMsg({ t: "erro", m: error.message });
      if (data.session) navigate({ to: "/", replace: true });
      else setMsg({ t: "ok", m: "Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre." });
    }
  }

  const field = "w-full rounded-md border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Eye className="h-5 w-5" /></div>
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
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Eye className="h-5 w-5" /></div>
            <span className="font-bold">Ótica Louise</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{mode === "entrar" ? "Entrar no sistema" : mode === "criar" ? "Criar conta" : "Recuperar senha"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "entrar" ? "Use o e-mail e a senha fornecidos pelo administrador." : mode === "criar" ? "A primeira conta criada vira o administrador da ótica." : "Enviaremos um link para você criar uma nova senha."}
            </p>
          </div>
          {mode === "criar" && (
            <label className="relative block"><User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input className={field} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} required /></label>
          )}
          <label className="relative block"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input className={field} type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          {mode !== "esqueci" && (
            <label className="relative block"><Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input className={field} type="password" placeholder="Senha" autoComplete={mode === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          )}
          {msg && <p className={msg.t === "erro" ? "text-sm text-destructive" : "text-sm text-primary"}>{msg.m}</p>}
          <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}
          </button>
          <div className="flex justify-between text-sm">
            {mode === "entrar" ? (
              <>
                <button type="button" className="text-muted-foreground hover:underline" onClick={() => { setMode("esqueci"); setMsg(null); }}>Esqueci a senha</button>
                <button type="button" className="text-primary hover:underline" onClick={() => { setMode("criar"); setMsg(null); }}>Criar conta</button>
              </>
            ) : (
              <button type="button" className="text-primary hover:underline" onClick={() => { setMode("entrar"); setMsg(null); }}>Voltar para entrar</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
