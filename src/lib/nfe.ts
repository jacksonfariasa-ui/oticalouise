export type ItemNfe = { codigo: string; nome: string; quantidade: number; valorUnit: number; ean: string };
export type Nfe = { numero: string; fornecedor: string; itens: ItemNfe[] };

const txt = (el: Element | null | undefined, tag: string) => el?.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";

/** Reads a Brazilian NF-e XML and returns its number, supplier and items. */
export function lerNfeXml(xml: string): Nfe {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Arquivo XML inválido.");
  const ide = doc.getElementsByTagName("ide")[0];
  const emit = doc.getElementsByTagName("emit")[0];
  const dets = Array.from(doc.getElementsByTagName("det"));
  if (!dets.length) throw new Error("Nenhum produto encontrado neste XML de nota fiscal.");
  const itens = dets.map((d) => {
    const prod = d.getElementsByTagName("prod")[0];
    const ean = txt(prod, "cEAN");
    return {
      codigo: txt(prod, "cProd"),
      nome: txt(prod, "xProd"),
      quantidade: Number(txt(prod, "qCom")) || 0,
      valorUnit: Number(txt(prod, "vUnCom")) || 0,
      ean: ean === "SEM GTIN" ? "" : ean,
    };
  });
  return { numero: txt(ide, "nNF"), fornecedor: txt(emit, "xFant") || txt(emit, "xNome"), itens };
}
