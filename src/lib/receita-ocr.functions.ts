import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lê a foto de uma receita oftalmológica com IA e devolve esférico, cilíndrico, eixo, adição e DNP de cada olho.
export const lerReceita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imagem: string }) => {
    if (typeof d?.imagem !== "string" || !d.imagem.startsWith("data:image/")) throw new Error("Imagem inválida.");
    if (d.imagem.length > 14_000_000) throw new Error("Imagem muito grande.");
    return d;
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Leitura de receita indisponível.");
    const c = { type: "string" };
    const olho = { type: "object", additionalProperties: false, required: ["esf", "cil", "eixo", "adicao", "dnp"], properties: { esf: c, cil: c, eixo: c, adicao: c, dnp: c } };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: "Esta imagem é uma receita de óculos. Extraia para OD (olho direito) e OE (olho esquerdo) os valores de esférico, cilíndrico, eixo, adição e DNP, exatamente como escritos (ex.: +1,25, -0,50, 90). Use vírgula decimal e sinal + ou - nas dioptrias. Use a receita para longe. Campos ausentes ficam vazios." },
            { type: "input_image", image_url: data.imagem },
          ],
        }],
        text: { format: { type: "json_schema", name: "receita", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["od", "oe"], properties: { od: olho, oe: olho },
        } } },
      }),
    });
    if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde um pouco e tente de novo.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok || !res.body) throw new Error("Não foi possível ler a receita.");
    let txt = "", buf = "";
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const partes = buf.split("\n");
      buf = partes.pop() ?? "";
      for (const l of partes) {
        if (!l.startsWith("data:")) continue;
        try { const ev = JSON.parse(l.slice(5)); if (ev.type === "response.output_text.delta") txt += ev.delta; } catch { /* ignora */ }
      }
    }
    const m = txt.match(/\{[\s\S]*\}/);
    const r = m ? JSON.parse(m[0]) : {};
    const limpar = (o: Record<string, unknown> | undefined) => ({
      esf: String(o?.esf ?? ""), cil: String(o?.cil ?? ""), eixo: String(o?.eixo ?? "").replace(/[°º]/g, ""), adicao: String(o?.adicao ?? ""), dnp: String(o?.dnp ?? ""),
    });
    return { od: limpar(r.od), oe: limpar(r.oe) };
  });
