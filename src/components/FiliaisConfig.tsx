import { registrarAtividade } from "@/lib/atividades";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { updateFilial, useFiliais, type Filial } from "@/lib/filiais";

type Info = Pick<Filial, "id" | "nome" | "status" | "cnpj" | "endereco" | "cidade" | "telefone" | "email" | "horario" | "gerente">;
const CAMPOS: { k: keyof Info; label: string; wide?: boolean }[] = [
  { k: "nome", label: "Nome" }, { k: "gerente", label: "Gerente" }, { k: "cnpj", label: "CNPJ" },
  { k: "telefone", label: "Telefone" }, { k: "email", label: "E-mail" }, { k: "cidade", label: "Cidade" },
  { k: "endereco", label: "Endereço", wide: true }, { k: "horario", label: "Horário de funcionamento", wide: true },
];
const STATUS: Filial["status"][] = ["Ativa", "Em reforma", "Inativa"];

const filiaisQuery = {
  queryKey: ["filiais_info"],
  queryFn: async () => (await supabase.from("filiais_info").select("*")).data ?? [],
};

/** Applies saved branch details over the built-in branch data. */
export function FiliaisSync() {
  const { data } = useQuery(filiaisQuery);
  useEffect(() => {
    (data ?? []).forEach(({ updated_at: _u, ...r }) => updateFilial(r.id, (f) => ({ ...f, ...r, status: r.status as Filial["status"] })));
  }, [data]);
  return null;
}

export function FiliaisConfig() {
  const qc = useQueryClient();
  const filiais = useFiliais();
  const [sel, setSel] = useState(filiais[0]?.id ?? "");
  const atual = filiais.find((f) => f.id === sel);
  const [f, setF] = useState<Info | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!atual) return;
    const { id, nome, status, cnpj, endereco, cidade, telefone, email, horario, gerente } = atual;
    setF({ id, nome, status, cnpj, endereco, cidade, telefone, email, horario, gerente });
    setMsg("");
  }, [atual]);

  async function salvar() {
    if (!f) return;
    const { error } = await supabase.from("filiais_info").upsert({ ...f, updated_at: new Date().toISOString() });
    if (error) return setMsg("Erro ao salvar: " + error.message);
    registrarAtividade(`Filiais: alterou os dados de ${f.nome}`);
    updateFilial(f.id, (x) => ({ ...x, ...f }));
    await qc.invalidateQueries({ queryKey: ["filiais_info"] });
    setMsg("Filial salva.");
  }

  return (
    <div className="mt-6 border-t pt-5">
      <div className="mb-3 flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h3 className="font-bold">Filiais</h3></div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filiais.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`rounded-full border px-3 py-1 text-sm ${sel === x.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{x.nome}</button>
        ))}
      </div>
      {f && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS.map(({ k, label, wide }) => (
              <label key={k} className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </label>
            ))}
            <label>
              <span className="text-xs font-medium text-muted-foreground">Situação</span>
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Filial["status"] })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                {STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={salvar} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" />Salvar filial</button>
            {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
