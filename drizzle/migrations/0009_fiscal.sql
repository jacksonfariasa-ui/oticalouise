CREATE TABLE public.fiscal_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ambiente text NOT NULL DEFAULT 'homologacao',
  provedor text NOT NULL DEFAULT 'focusnfe',
  token text NOT NULL DEFAULT '',
  razao_social text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  inscricao_estadual text NOT NULL DEFAULT '',
  inscricao_municipal text NOT NULL DEFAULT '',
  regime_tributario text NOT NULL DEFAULT '1',
  uf text NOT NULL DEFAULT 'RR',
  municipio text NOT NULL DEFAULT '',
  codigo_municipio text NOT NULL DEFAULT '',
  csc_id text NOT NULL DEFAULT '',
  csc_token text NOT NULL DEFAULT '',
  serie_nfe text NOT NULL DEFAULT '1',
  serie_nfce text NOT NULL DEFAULT '1',
  cfop_padrao text NOT NULL DEFAULT '5102',
  ncm_padrao text NOT NULL DEFAULT '90049090',
  cst_padrao text NOT NULL DEFAULT '102',
  codigo_servico text NOT NULL DEFAULT '',
  aliquota_iss numeric NOT NULL DEFAULT 0,
  certificado_validade date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.fiscal_config TO authenticated;
GRANT ALL ON public.fiscal_config TO service_role;
ALTER TABLE public.fiscal_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin le fiscal" ON public.fiscal_config FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin cria fiscal" ON public.fiscal_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin altera fiscal" ON public.fiscal_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.fiscal_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE,
  tipo text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  ambiente text NOT NULL DEFAULT 'homologacao',
  numero text NOT NULL DEFAULT '',
  serie text NOT NULL DEFAULT '',
  chave text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL DEFAULT '',
  cliente_doc text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  mensagem text NOT NULL DEFAULT '',
  url_pdf text NOT NULL DEFAULT '',
  url_xml text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notas_fiscais TO authenticated;
GRANT ALL ON public.notas_fiscais TO service_role;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipe le notas" ON public.notas_fiscais FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipe cria notas" ON public.notas_fiscais FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());