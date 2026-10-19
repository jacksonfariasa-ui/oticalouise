CREATE TABLE public.dados_salvos (
  chave text PRIMARY KEY,
  dados jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.dados_salvos TO authenticated;
GRANT ALL ON public.dados_salvos TO service_role;
ALTER TABLE public.dados_salvos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe lê dados" ON public.dados_salvos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipe cria dados" ON public.dados_salvos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe edita dados" ON public.dados_salvos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);