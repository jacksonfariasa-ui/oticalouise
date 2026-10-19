CREATE TABLE public.filiais_info (
  id text PRIMARY KEY,
  nome text NOT NULL,
  status text NOT NULL DEFAULT 'Ativa',
  cnpj text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  horario text NOT NULL DEFAULT '',
  gerente text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.filiais_info TO authenticated;
GRANT ALL ON public.filiais_info TO service_role;
ALTER TABLE public.filiais_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe lê filiais" ON public.filiais_info FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin cria filiais" ON public.filiais_info FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edita filiais" ON public.filiais_info FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));