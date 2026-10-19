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
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Esta imagem é uma tabela de preços de lentes oftálmicas. Extraia cada lente. Responda SOMENTE JSON no formato {\"lentes\":[{\"fornecedor\":\"\",\"nome\":\"\",\"material\":\"\",\"indice\":\"\",\"faixa\":\"\",\"custo\":0,\"preco\":0}]}. Use números em reais (ponto decimal). Se houver apenas um preço, coloque em preco e custo 0. Campos ausentes ficam vazios." },
            { type: "image_url", image_url: { url: data.imagem } },
          ],
        }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) throw new Error("Muitas leituras seguidas. Aguarde um pouco e tente de novo.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error("Não foi possível ler a imagem.");
    const j = await res.json();
    const txt: string = j.choices?.[0]?.message?.content ?? "{}";
    const m = txt.match(/\{[\s\S]*\}/);
    const lentes: Record<string, unknown>[] = (m ? JSON.parse(m[0]) : {}).lentes ?? [];
    const cab = ["Fornecedor", "Lente", "Material", "Índice", "Faixa", "Custo", "Preço venda"];
    const ks = ["fornecedor", "nome", "material", "indice", "faixa", "custo", "preco"];
    return { linhas: [cab, ...lentes.map((l) => ks.map((k) => String(l[k] ?? "").replace(".", k === "custo" || k === "preco" ? "," : ".")))] };
  });
