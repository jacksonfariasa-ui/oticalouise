CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  nascimento text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe lê clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipe cria clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Equipe edita clientes" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin/gerente exclui clientes" ON public.clientes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gerente'));

CREATE TABLE public.cliente_vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero text NOT NULL,
  tipo text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.cliente_vendas(cliente_id);
GRANT SELECT, INSERT ON public.cliente_vendas TO authenticated;
GRANT ALL ON public.cliente_vendas TO service_role;
ALTER TABLE public.cliente_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe lê vendas" ON public.cliente_vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipe registra vendas" ON public.cliente_vendas FOR INSERT TO authenticated WITH CHECK (true);