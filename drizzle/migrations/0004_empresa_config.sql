CREATE TABLE public.empresa_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome text NOT NULL DEFAULT 'Ótica Louise',
  slogan text NOT NULL DEFAULT 'Seu olhar, nossa prioridade',
  cnpj text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  logo_url text,
  cor_primaria text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.empresa_config (id) VALUES (1);
GRANT SELECT ON public.empresa_config TO anon, authenticated;
GRANT UPDATE ON public.empresa_config TO authenticated;
GRANT ALL ON public.empresa_config TO service_role;
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos leem config" ON public.empresa_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin edita config" ON public.empresa_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin envia logo" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marca' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin altera logo" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'marca' AND public.has_role(auth.uid(), 'admin'));