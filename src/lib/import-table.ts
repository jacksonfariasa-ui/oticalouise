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

async function readPptx(buf: ArrayBuffer): Promise<string[][]> {
  const f = await unzip(buf);
  const slides = [...f.keys()].filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const text = (el: Element) => byTag(el, "t").map((t) => t.textContent).join(" ").trim();
  const tables: string[][] = [];
  const lines: string[] = [];
  let header: string | null = null;
  for (const s of slides) {
    const doc = xml(f.get(s));
    const trs = byTag(doc, "tr");
    if (trs.length) {
      trs.forEach((tr, i) => {
        const row = byTag(tr, "tc").map(text);
        const key = row.join("|").toLowerCase();
        if (i === 0) { if (header === key) return; if (header === null) header = key; }
        tables.push(row);
      });
    } else byTag(doc, "p").forEach((p) => { const t = text(p); if (t) lines.push(t); });
  }
  return tables.length ? tables : splitText(lines.join("\n"));
}

async function readPdf(buf: ArrayBuffer): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const out: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const items = (await page.getTextContent()).items as { str: string; transform: number[]; width: number }[];
    const rows = new Map<number, { x: number; w: number; s: string }[]>();
    for (const it of items) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      (rows.get(y) ?? rows.set(y, []).get(y)!).push({ x: it.transform[4], w: it.width, s: it.str.trim() });
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, cells]) => {
      cells.sort((a, b) => a.x - b.x);
      let line = "", end = -1;
      for (const c of cells) {
        line += end < 0 ? c.s : c.x - end > 8 ? "\t" + c.s : " " + c.s;
        end = c.x + c.w;
      }
      out.push(line);
    });
  }
  const lines = out.filter((l) => l.trim());
  return lines.map((l) => l.split("\t").map((c) => c.trim()));
}

export const ACCEPT = ".xlsx,.csv,.txt,.tsv,.docx,.pptx,.pdf,.html,.htm,.xml";

export async function readTableFile(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "xls" || ext === "doc" || ext === "ppt") throw new Error("Formato antigo do Office. Salve como .xlsx, .docx ou .pptx e tente novamente.");
  if (ext === "xlsx") return readXlsx(await file.arrayBuffer());
  if (ext === "docx") return readDocx(await file.arrayBuffer());
  if (ext === "pptx") return readPptx(await file.arrayBuffer());
  if (ext === "pdf") return readPdf(await file.arrayBuffer());
  const txt = await file.text();
  if (ext === "html" || ext === "htm" || ext === "xml") return readHtml(txt);
  return splitText(txt);
}
