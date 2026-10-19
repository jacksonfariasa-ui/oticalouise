export type TipoNota = "nfce" | "nfe" | "nfse";
export const TIPOS_NOTA: { value: TipoNota; label: string; desc: string }[] = [
  { value: "nfce", label: "NFC-e (cupom)", desc: "Venda no balcão para consumidor final" },
  { value: "nfe", label: "NF-e (produto)", desc: "Nota completa de venda de produtos" },
  { value: "nfse", label: "NFS-e (serviço)", desc: "Serviços como montagem e exame" },
];
export const STATUS_NOTA: Record<string, string> = {
  rascunho: "Rascunho", processando: "Processando", autorizado: "Autorizada", erro: "Com erro", cancelado: "Cancelada",
};

export type ItemNota = { codigo: string; descricao: string; qtd: number; preco: number; ncm?: string; cfop?: string };
export type ClienteNota = { nome: string; doc: string; email?: string };
export type ConfigFiscal = {
  cnpj: string; razao_social: string; inscricao_estadual: string; inscricao_municipal: string; regime_tributario: string;
  uf: string; codigo_municipio: string; serie_nfe: string; serie_nfce: string; cfop_padrao: string; ncm_padrao: string;
  cst_padrao: string; codigo_servico: string; aliquota_iss: number; csc_id: string; csc_token: string;
};

const so = (s: string) => (s || "").replace(/\D/g, "");
const PAG: Record<string, string> = { Dinheiro: "01", "Cartão de crédito": "03", "Cartão de débito": "04", Crediário: "05", Boleto: "15", Pix: "17" };
export const codigoPagamento = (p: string) => PAG[p] ?? "99";
export const totalNota = (itens: ItemNota[]) => Math.round(itens.reduce((s, i) => s + i.qtd * i.preco, 0) * 100) / 100;

/** Lists what is still missing before a note of this type can be issued. */
export function pendencias(c: Partial<ConfigFiscal> & { token?: string }, tipo: TipoNota): string[] {
  const p: string[] = [];
  if (!c.token) p.push("Chave de acesso do emissor");
  if (so(c.cnpj ?? "").length !== 14) p.push("CNPJ da empresa");
  if (!c.razao_social) p.push("Razão social");
  if (tipo !== "nfse" && !c.inscricao_estadual) p.push("Inscrição estadual");
  if (tipo === "nfce" && (!c.csc_id || !c.csc_token)) p.push("Código CSC da Sefaz");
  if (tipo === "nfse" && (!c.inscricao_municipal || !c.codigo_municipio || !c.codigo_servico)) p.push("Dados municipais de serviço");
  return p;
}

/** Validates the note itself (customer and items). */
export function validarNota(tipo: TipoNota, cliente: ClienteNota, itens: ItemNota[]): string | null {
  if (!itens.length) return "Adicione pelo menos um item.";
  if (itens.some((i) => !i.descricao || i.qtd <= 0 || i.preco <= 0)) return "Todos os itens precisam de descrição, quantidade e valor.";
  const doc = so(cliente.doc);
  if (tipo !== "nfce" && !cliente.nome) return "Informe o nome do cliente.";
  if (tipo !== "nfce" && doc.length !== 11 && doc.length !== 14) return "Informe CPF ou CNPJ válido do cliente.";
  if (tipo === "nfce" && doc && doc.length !== 11 && doc.length !== 14) return "CPF/CNPJ do cliente inválido.";
  return null;
}

/** Builds the request body sent to the issuer service. */
export function montarPayload(tipo: TipoNota, c: ConfigFiscal, cliente: ClienteNota, itens: ItemNota[], pagamento: string, agora = new Date()) {
  const doc = so(cliente.doc);
  const pessoa = doc.length === 14 ? { cnpj: doc } : doc.length === 11 ? { cpf: doc } : {};
  const total = totalNota(itens);
  if (tipo === "nfse") {
    return {
      data_emissao: agora.toISOString(),
      prestador: { cnpj: so(c.cnpj), inscricao_municipal: c.inscricao_municipal, codigo_municipio: c.codigo_municipio },
      tomador: { ...pessoa, razao_social: cliente.nome, email: cliente.email || undefined },
      servico: {
        aliquota: Number(c.aliquota_iss) || 0, iss_retido: false, item_lista_servico: c.codigo_servico, valor_servicos: total,
        discriminacao: itens.map((i) => `${i.qtd}x ${i.descricao}`).join("; "),
      },
    };
  }
  const nfe = tipo === "nfe";
  const pre = nfe ? "_destinatario" : "";
  return {
    natureza_operacao: "Venda de mercadoria",
    data_emissao: agora.toISOString(),
    tipo_documento: 1, finalidade_emissao: 1, presenca_comprador: 1, consumidor_final: 1,
    serie: nfe ? c.serie_nfe : c.serie_nfce,
    cnpj_emitente: so(c.cnpj),
    ...(cliente.nome ? { [`nome${pre}`]: cliente.nome } : {}),
    ...(pessoa.cnpj ? { [`cnpj${pre}`]: pessoa.cnpj } : {}),
    ...(pessoa.cpf ? { [`cpf${pre}`]: pessoa.cpf } : {}),
    ...(nfe ? { indicador_inscricao_estadual_destinatario: 9, email_destinatario: cliente.email || undefined } : {}),
    modalidade_frete: 9,
    valor_produtos: total, valor_total: total,
    items: itens.map((i, n) => ({
      numero_item: n + 1, codigo_produto: i.codigo || String(n + 1), descricao: i.descricao,
      codigo_ncm: so(i.ncm || c.ncm_padrao), cfop: so(i.cfop || c.cfop_padrao), unidade_comercial: "UN", unidade_tributavel: "UN",
      quantidade_comercial: i.qtd, quantidade_tributavel: i.qtd, valor_unitario_comercial: i.preco, valor_unitario_tributavel: i.preco,
      valor_bruto: Math.round(i.qtd * i.preco * 100) / 100, icms_origem: 0, icms_situacao_tributaria: c.cst_padrao,
      pis_situacao_tributaria: "07", cofins_situacao_tributaria: "07",
    })),
    formas_pagamento: [{ forma_pagamento: codigoPagamento(pagamento), valor_pagamento: total }],
  };
}

/** Maps the issuer's status text to ours. */
export function statusDoEmissor(s: string | undefined): string {
  if (!s) return "erro";
  if (s === "autorizado") return "autorizado";
  if (s === "cancelado") return "cancelado";
  if (s.startsWith("processando")) return "processando";
  return "erro";
}
