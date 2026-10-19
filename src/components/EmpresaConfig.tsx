import { registrarAtividade } from "@/lib/atividades";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ImageUp, RotateCcw, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EMPRESA_PADRAO, reduzirImagem, useEmpresa, type Empresa } from "@/lib/empresa";
import { FiliaisConfig } from "@/components/FiliaisConfig";
import logoPadrao from "@/assets/otica-louise.jpg.asset.json";

const CAMPOS: { k: keyof Empresa; label: string }[] = [
  { k: "nome", label: "Nome da empresa" }, { k: "slogan", label: "Slogan" }, { k: "cnpj", label: "CNPJ" },
  { k: "telefone", label: "Telefone" }, { k: "email", label: "E-mail" }, { k: "endereco", label: "Endereço" },
];
const CORES = ["#c2185b", "#1d4ed8", "#0f766e", "#7c3aed", "#ea580c", "#334155"];

export function EmpresaConfig() {
  const qc = useQueryClient();
  const atual = useEmpresa();
  const [f, setF] = useState<Empresa>(EMPRESA_PADRAO);
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const { logo: _l, ...rest } = atual;
    setF(rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual.nome, atual.logo_url, atual.cor_primaria, atual.slogan, atual.cnpj, atual.telefone, atual.email, atual.endereco]);

  async function salvar() {
    setSalvando(true); setMsg("");
    const { error } = await supabase.from("empresa_config").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    setSalvando(false);
    if (error) return setMsg("Erro ao salvar: " + error.message);
    registrarAtividade("Empresa: alterou as informações da empresa");
    await qc.invalidateQueries({ queryKey: ["empresa"] });
    setMsg("Informações salvas.");
  }

  async function trocarLogo(file?: File) {
    if (!file) return;
    try { setF({ ...f, logo_url: await reduzirImagem(file) }); } catch (e) { setMsg((e as Error).message); }
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold">Empresa e aparência</h2></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPOS.map(({ k, label }) => (
            <label key={k} className={k === "endereco" ? "sm:col-span-2" : ""}>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <input value={(f[k] as string) ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </label>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Logo</span>
            <div className="mt-1 flex items-center gap-3">
              <img src={f.logo_url || logoPadrao.url} alt="Logo" className="h-16 w-16 rounded-full border object-cover" />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                <ImageUp className="h-4 w-4" />Trocar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => trocarLogo(e.target.files?.[0])} />
              </label>
              {f.logo_url && <button title="Logo original" onClick={() => setF({ ...f, logo_url: null })} className="rounded-md border p-2 hover:bg-accent"><RotateCcw className="h-4 w-4" /></button>}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Cor principal do sistema</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {CORES.map((c) => (
                <button key={c} aria-label={c} onClick={() => setF({ ...f, cor_primaria: c })} style={{ background: c }}
                  className={`h-8 w-8 rounded-full border-2 ${f.cor_primaria === c ? "border-foreground" : "border-transparent"}`} />
              ))}
              <input type="color" value={f.cor_primaria || "#c2185b"} onChange={(e) => setF({ ...f, cor_primaria: e.target.value })} className="h-8 w-10 cursor-pointer rounded border" />
              {f.cor_primaria && <button title="Cor original" onClick={() => setF({ ...f, cor_primaria: null })} className="rounded-md border p-2 hover:bg-accent"><RotateCcw className="h-4 w-4" /></button>}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button disabled={salvando} onClick={salvar} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{salvando ? "Salvando…" : "Salvar"}</button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <FiliaisConfig />
    </section>
  );
}
