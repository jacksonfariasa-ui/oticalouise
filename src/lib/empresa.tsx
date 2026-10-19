import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoPadrao from "@/assets/otica-louise.jpg.asset.json";

export type Empresa = {
  nome: string; slogan: string; cnpj: string; telefone: string; email: string; endereco: string;
  logo_url: string | null; cor_primaria: string | null;
};

export const EMPRESA_PADRAO: Empresa = {
  nome: "Ótica Louise", slogan: "Seu olhar, nossa prioridade", cnpj: "", telefone: "", email: "", endereco: "",
  logo_url: null, cor_primaria: null,
};

export const empresaQuery = {
  queryKey: ["empresa"],
  queryFn: async (): Promise<Empresa> => {
    const { data } = await supabase.from("empresa_config").select("nome, slogan, cnpj, telefone, email, endereco, logo_url, cor_primaria").eq("id", 1).maybeSingle();
    return data ?? EMPRESA_PADRAO;
  },
  staleTime: 60_000,
};

export function useEmpresa() {
  const { data } = useQuery(empresaQuery);
  const e = data ?? EMPRESA_PADRAO;
  return { ...e, logo: e.logo_url || logoPadrao.url };
}

const VARS = ["--primary", "--ring", "--chart-1", "--sidebar", "--sidebar-accent", "--sidebar-primary", "--accent", "--secondary"];

/** Applies the admin-chosen main color to the whole interface. */
export function ThemeFromEmpresa() {
  const { cor_primaria } = useEmpresa();
  useEffect(() => {
    const s = document.documentElement.style;
    if (!cor_primaria || !/^#[0-9a-f]{6}$/i.test(cor_primaria)) { VARS.forEach((v) => s.removeProperty(v)); return; }
    const c = cor_primaria;
    s.setProperty("--primary", c);
    s.setProperty("--ring", c);
    s.setProperty("--chart-1", c);
    s.setProperty("--sidebar", `color-mix(in oklch, ${c} 45%, black)`);
    s.setProperty("--sidebar-accent", `color-mix(in oklch, ${c} 60%, black)`);
    s.setProperty("--sidebar-primary", `color-mix(in oklch, ${c} 35%, white)`);
    s.setProperty("--accent", `color-mix(in oklch, ${c} 12%, white)`);
    s.setProperty("--secondary", `color-mix(in oklch, ${c} 8%, white)`);
  }, [cor_primaria]);
  return null;
}

/** Shrinks an image file to a square-ish PNG data URL (max 256px). */
export function reduzirImagem(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      resolve(cv.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = URL.createObjectURL(file);
  });
}
