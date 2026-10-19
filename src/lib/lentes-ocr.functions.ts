import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lê a foto de uma tabela de lentes com IA e devolve linhas (primeira = títulos).
export const lerImagemLentes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imagem: string }) => {
    if (typeof d?.imagem !== "string" || !d.imagem.startsWith("data:image/")) throw new Error("Imagem inválida.");
    if (d.imagem.length > 14_000_000) throw new Error("Imagem muito grande.");
    return d;
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Leitura de imagens indisponível.");
    const campo = { type: "string" };
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
            { type: "input_text", text: "Esta imagem é uma tabela de preços de lentes oftálmicas. Extraia cada lente como JSON. Preços em reais como número (ponto decimal). Se houver apenas um preço, coloque em preco e custo 0. Campos ausentes ficam vazios." },
            { type: "input_image", image_url: data.imagem },
          ],
        }],
        text: { format: { type: "json_schema", name: "lentes", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["lentes"],
          properties: { lentes: { type: "array", items: {
            type: "object", additionalProperties: false,
            required: ["fornecedor", "nome", "material", "indice", "faixa", "custo", "preco"],
            properties: { fornecedor: campo, nome: campo, material: campo, indice: campo, faixa: campo, custo: { type: "number" }, preco: { type: "number" } },
          } } },
        } } },
      }),
    });
    if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde um pouco e tente de novo.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok || !res.body) throw new Error("Não foi possível ler a imagem.");
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
    const lentes: Record<string, unknown>[] = (m ? JSON.parse(m[0]) : {}).lentes ?? [];
    const cab = ["Fornecedor", "Lente", "Material", "Índice", "Faixa", "Custo", "Preço venda"];
    const ks = ["fornecedor", "nome", "material", "indice", "faixa", "custo", "preco"];
    return { linhas: [cab, ...lentes.map((l) => ks.map((k) => String(l[k] ?? "").replace(".", k === "custo" || k === "preco" ? "," : ".")))] };
  });
