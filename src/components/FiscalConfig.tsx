import { useEffect, useState } from "react";
import { FileCheck2, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { registrarAtividade } from "@/lib/atividades";
import { pendencias, TIPOS_NOTA } from "@/lib/nota-fiscal";

type Cfg = Record<string, string | number | null>;
type Campo = { k: string; label: string; ph?: string; tipo?: string; dica?: string };
const GRUPOS: { titulo: string; desc: string; campos: Campo[] }[] = [
  { titulo: "Emissor de notas", desc: "Chave de acesso do serviço contratado (Focus NFe).", campos: [
    { k: "token", label: "Chave de acesso (token)", ph: "Cole aqui o token do painel do emissor", tipo: "password" },
    { k: "certificado_validade", label: "Validade do certificado A1", tipo: "date", dica: "O certificado é enviado direto no painel do emissor." },
  ] },
  { titulo: "Dados fiscais da empresa", desc: "Como aparecem no cartão CNPJ.", campos: [
    { k: "razao_social", label: "Razão social", ph: "Ótica Louise Comércio de Artigos Ópticos Ltda" },
    { k: "cnpj", label: "CNPJ", ph: "00.000.000/0001-00" },
    { k: "inscricao_estadual", label: "Inscrição estadual", ph: "24.000000-0" },
    { k: "inscricao_municipal", label: "Inscrição municipal", ph: "000000" },
    { k: "uf", label: "Estado (UF)", ph: "RR" },
    { k: "municipio", label: "Município", ph: "Boa Vista" },
    { k: "codigo_municipio", label: "Código IBGE do município", ph: "1400100" },
  ] },
  { titulo: "Cupom NFC-e", desc: "Código de segurança gerado no site da Sefaz.", campos: [
    { k: "csc_id", label: "ID do CSC", ph: "000001" },
    { k: "csc_token", label: "Código CSC", tipo: "password", ph: "Código fornecido pela Sefaz" },
    { k: "serie_nfce", label: "Série NFC-e", ph: "1" },
  ] },
  { titulo: "Nota de produto NF-e", desc: "Valores padrão usados nos produtos sem código próprio.", campos: [
    { k: "serie_nfe", label: "Série NF-e", ph: "1" },
    { k: "cfop_padrao", label: "CFOP padrão", ph: "5102", dica: "5102 = venda dentro do estado" },
    { k: "ncm_padrao", label: "NCM padrão", ph: "90049090", dica: "90049090 = óculos; lentes: 90015000" },
    { k: "cst_padrao", label: "CSOSN / CST do ICMS", ph: "102" },
  ] },
  { titulo: "Nota de serviço NFS-e", desc: "Confirme com o contador o código do serviço na sua prefeitura.", campos: [
    { k: "codigo_servico", label: "Código do serviço (lista LC 116)", ph: "14.01" },
    { k: "aliquota_iss", label: "Alíquota do ISS (%)", tipo: "number", ph: "5" },
  ] },
];

export function FiscalConfig() {
  const [f, setF] = useState<Cfg>({});
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { supabase.from("fiscal_config").select("*").eq("id", 1).maybeSingle().then(({ data }) => data && setF(data as Cfg)); }, []);
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  async function salvar() {
    setSalvando(true); setMsg("");
    const { id: _id, ...rest } = f;
    const dados = { ...rest, aliquota_iss: Number(f["aliquota_iss"]) || 0, certificado_validade: f["certificado_validade"] || null, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("fiscal_config").update(dados as never).eq("id", 1);
    setSalvando(false);
    if (error) return setMsg("Erro ao salvar: " + error.message);
    registrarAtividade("Fiscal: alterou a configuração de notas fiscais");
    setMsg("Configuração fiscal salva.");
  }

  const venc = f["certificado_validade"] ? Math.ceil((new Date(String(f["certificado_validade"]) + "T12:00:00").getTime() - Date.now()) / 864e5) : null;

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-1 flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold">Notas fiscais</h2></div>
      <p className="mb-4 text-sm text-muted-foreground">Dados usados para emitir cupom, nota de produto e nota de serviço.</p>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Ambiente</div>
          <div className="mt-2 flex gap-1 rounded-md bg-muted p-1 text-sm">
            {[["homologacao", "Teste"], ["producao", "Produção"]].map(([v, l]) => (
              <button key={v} onClick={() => set("ambiente", v ?? "")} className={`flex-1 rounded px-2 py-1 font-medium ${f["ambiente"] === v ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{l}</button>
            ))}
          </div>
        </div>
        {TIPOS_NOTA.map((t) => {
          const p = pendencias(f as never, t.value);
          return (
            <div key={t.value} className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {p.length ? <TriangleAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-primary" />}{t.label}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{p.length ? "Falta: " + p.join(", ") : "Pronta para emitir"}</div>
            </div>
          );
        })}
      </div>
      {venc !== null && venc <= 30 && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {venc < 0 ? "O certificado digital venceu. Renove para continuar emitindo notas." : `O certificado digital vence em ${venc} dia(s).`}
        </div>
      )}

      <div className="space-y-5">
        {GRUPOS.map((g) => (
          <fieldset key={g.titulo} className="border-t pt-4">
            <legend className="pr-2 text-sm font-semibold">{g.titulo}</legend>
            <p className="mb-3 text-xs text-muted-foreground">{g.desc}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.titulo === "Dados fiscais da empresa" && (
                <label>
                  <span className="text-xs font-medium text-muted-foreground">Regime tributário</span>
                  <select value={String(f["regime_tributario"] ?? "1")} onChange={(e) => set("regime_tributario", e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm">
                    <option value="1">Simples Nacional</option><option value="2">Simples Nacional – excesso</option><option value="3">Regime normal</option>
                  </select>
                </label>
              )}
              {g.campos.map((c) => (
                <label key={c.k}>
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  <input type={c.tipo ?? "text"} value={String(f[c.k] ?? "")} placeholder={c.ph} autoComplete="off" onChange={(e) => set(c.k, e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  {c.dica && <span className="mt-1 block text-[11px] text-muted-foreground">{c.dica}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button disabled={salvando} onClick={salvar} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" />{salvando ? "Salvando…" : "Salvar configuração fiscal"}</button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </section>
  );
}
