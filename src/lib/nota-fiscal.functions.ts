import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { montarPayload, pendencias, statusDoEmissor, totalNota, validarNota, type ClienteNota, type ConfigFiscal, type ItemNota, type TipoNota } from "@/lib/nota-fiscal";

type Emitir = { tipo: TipoNota; cliente: ClienteNota; itens: ItemNota[]; pagamento: string; origem?: string };

async function carregar() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("fiscal_config").select("*").eq("id", 1).maybeSingle();
  if (!data) throw new Error("Configuração fiscal não encontrada.");
  const base = data.ambiente === "producao" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
  const auth = "Basic " + btoa(`${data.token}:`);
  return { db: supabaseAdmin, cfg: data, base, auth };
}

function extrair(base: string, r: Record<string, unknown>) {
  const url = (p: unknown) => (typeof p === "string" && p ? (p.startsWith("http") ? p : base + p) : "");
  const erros = Array.isArray(r["erros"]) ? (r["erros"] as { mensagem?: string }[]).map((e) => e.mensagem).join("; ") : "";
  return {
    status: statusDoEmissor(r["status"] as string),
    numero: String(r["numero"] ?? r["numero_rps"] ?? ""),
    serie: String(r["serie"] ?? ""),
    chave: String(r["chave_nfe"] ?? r["codigo_verificacao"] ?? ""),
    url_pdf: url(r["caminho_danfe"] ?? r["url_danfse"] ?? r["url"]),
    url_xml: url(r["caminho_xml_nota_fiscal"] ?? r["caminho_xml_cancelamento"]),
    mensagem: String(r["mensagem_sefaz"] ?? r["mensagem"] ?? erros ?? ""),
  };
}

export const emitirNota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Emitir) => {
    if (!["nfce", "nfe", "nfse"].includes(d?.tipo)) throw new Error("Tipo de nota inválido.");
    const erro = validarNota(d.tipo, d.cliente, d.itens ?? []);
    if (erro) throw new Error(erro);
    return d;
  })
  .handler(async ({ data, context }) => {
    const { db, cfg, base, auth } = await carregar();
    const falta = pendencias(cfg, data.tipo);
    if (falta.length) throw new Error("Configuração fiscal incompleta: " + falta.join(", ") + ".");
    const ref = `${data.tipo}-${Date.now()}`;
    const payload = montarPayload(data.tipo, cfg as unknown as ConfigFiscal, data.cliente, data.itens, data.pagamento);
    const linha = {
      ref, tipo: data.tipo, ambiente: cfg.ambiente, status: "processando", cliente_nome: data.cliente.nome, cliente_doc: data.cliente.doc,
      valor: totalNota(data.itens), dados: { ...data } as never, created_by: context.userId,
    };
    const { error } = await db.from("notas_fiscais").insert(linha);
    if (error) throw new Error(error.message);
    let res: Record<string, unknown> = {};
    try {
      const r = await fetch(`${base}/v2/${data.tipo}?ref=${ref}`, { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      res = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok && !res["status"]) res["status"] = "erro";
    } catch {
      res = { status: "erro", mensagem: "Não foi possível falar com o emissor." };
    }
    const upd = extrair(base, res);
    await db.from("notas_fiscais").update(upd).eq("ref", ref);
    return { ref, ...upd };
  });

export const consultarNota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ref: string }) => d)
  .handler(async ({ data }) => {
    const { db, base, auth } = await carregar();
    const { data: n } = await db.from("notas_fiscais").select("tipo").eq("ref", data.ref).maybeSingle();
    if (!n) throw new Error("Nota não encontrada.");
    const r = await fetch(`${base}/v2/${n.tipo}/${data.ref}?completa=0`, { headers: { Authorization: auth } });
    const upd = extrair(base, (await r.json().catch(() => ({}))) as Record<string, unknown>);
    await db.from("notas_fiscais").update(upd).eq("ref", data.ref);
    return upd;
  });

export const cancelarNota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ref: string; justificativa: string }) => {
    if ((d?.justificativa ?? "").trim().length < 15) throw new Error("A justificativa precisa ter pelo menos 15 letras.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: pode } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: ger } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "gerente" });
    if (!pode && !ger) throw new Error("Só administradores e gerentes podem cancelar notas.");
    const { db, base, auth } = await carregar();
    const { data: n } = await db.from("notas_fiscais").select("tipo").eq("ref", data.ref).maybeSingle();
    if (!n) throw new Error("Nota não encontrada.");
    const r = await fetch(`${base}/v2/${n.tipo}/${data.ref}`, { method: "DELETE", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ justificativa: data.justificativa }) });
    const upd = extrair(base, (await r.json().catch(() => ({}))) as Record<string, unknown>);
    if (upd.status === "cancelado") await db.from("notas_fiscais").update({ status: "cancelado", mensagem: upd.mensagem }).eq("ref", data.ref);
    else throw new Error(upd.mensagem || "O emissor não aceitou o cancelamento.");
    return upd;
  });
