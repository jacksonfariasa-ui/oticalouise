// Lê arquivos de planilha/texto do navegador e devolve linhas (string[][]), sem bibliotecas externas.

async function unzip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Arquivo compactado inválido.");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    const method = dv.getUint16(p + 10, true);
    const size = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extra = dv.getUint16(p + 30, true);
    const comment = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extra + comment;
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const raw = bytes.slice(start, start + size);
    if (method === 0) files.set(name, raw);
    else if (method === 8) {
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      files.set(name, new Uint8Array(await new Response(stream).arrayBuffer()));
    }
  }
  return files;
}

const xml = (u?: Uint8Array) => new DOMParser().parseFromString(new TextDecoder().decode(u), "application/xml");
const byTag = (el: Document | Element, tag: string) => Array.from(el.getElementsByTagName("*")).filter((e) => e.localName === tag);

function colIndex(ref: string) {
  const letters = ref.replace(/[0-9]/g, "");
  return [...letters].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const f = await unzip(buf);
  const shared = f.has("xl/sharedStrings.xml") ? byTag(xml(f.get("xl/sharedStrings.xml")), "si").map((si) => byTag(si, "t").map((t) => t.textContent ?? "").join("")) : [];
  const sheet = f.get("xl/worksheets/sheet1.xml") ?? [...f.entries()].find(([k]) => k.startsWith("xl/worksheets/sheet"))?.[1];
  if (!sheet) throw new Error("Nenhuma planilha encontrada no arquivo.");
  return byTag(xml(sheet), "row").map((row) => {
    const out: string[] = [];
    byTag(row, "c").forEach((c, i) => {
      const t = c.getAttribute("t");
      const v = byTag(c, "v")[0]?.textContent ?? "";
      const val = t === "s" ? shared[Number(v)] ?? "" : t === "inlineStr" ? byTag(c, "t").map((x) => x.textContent).join("") : v;
      out[c.getAttribute("r") ? colIndex(c.getAttribute("r")!) : i] = val;
    });
    return Array.from(out, (x) => x ?? "");
  });
}

async function readDocx(buf: ArrayBuffer): Promise<string[][]> {
  const doc = xml((await unzip(buf)).get("word/document.xml"));
  const text = (el: Element) => byTag(el, "t").map((t) => t.textContent).join("");
  const rows = byTag(doc, "tr").map((tr) => byTag(tr, "tc").map(text));
  if (rows.length) return rows;
  return splitText(byTag(doc, "p").map(text).join("\n"));
}

function splitText(txt: string): string[][] {
  const lines = txt.split(/\r?\n/).filter((l) => l.trim());
  const sample = lines[0] ?? "";
  const sep = ["\t", ";", "|", ","].find((s) => sample.includes(s)) ?? ";";
  return lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^"|"$/g, "")));
}

function readHtml(txt: string): string[][] {
  const doc = new DOMParser().parseFromString(txt, "text/html");
  return Array.from(doc.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("td,th")).map((c) => c.textContent?.trim() ?? ""));
}

export const ACCEPT = ".xlsx,.csv,.txt,.tsv,.docx,.html,.htm,.xml";

export async function readTableFile(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xls" || ext === "doc") throw new Error("Formato antigo do Office. Salve como .xlsx ou .docx e tente novamente.");
  if (ext === "xlsx") return readXlsx(await file.arrayBuffer());
  if (ext === "docx") return readDocx(await file.arrayBuffer());
  const txt = await file.text();
  if (ext === "html" || ext === "htm" || ext === "xml") return readHtml(txt);
  return splitText(txt);
}
