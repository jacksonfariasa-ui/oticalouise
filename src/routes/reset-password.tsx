import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Ótica Louise" },
      { name: "description", content: "Crie uma nova senha para acessar a Ótica Louise." },
      { property: "og:title", content: "Nova senha — Ótica Louise" },
      { property: "og:description", content: "Crie uma nova senha para acessar a Ótica Louise." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("A senha precisa de ao menos 8 caracteres");
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setErro("Link inválido ou expirado. Peça um novo.");
    navigate({ to: "/", replace: true });
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6">
        <h1 className="text-xl font-bold">Criar nova senha</h1>
        <input type="password" autoComplete="new-password" className="w-full rounded-md border bg-background px-3 py-2.5 text-sm" placeholder="Nova senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <button className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Salvar senha</button>
      </form>
    </div>
  );
}
