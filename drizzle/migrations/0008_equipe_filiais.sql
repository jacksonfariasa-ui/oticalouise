CREATE OR REPLACE FUNCTION public.equipe_filiais()
RETURNS TABLE(nome text, filial text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.nome, p.filial, (SELECT r.role::text FROM public.user_roles r WHERE r.user_id = p.id ORDER BY r.role LIMIT 1)
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gerente')
$$;
REVOKE ALL ON FUNCTION public.equipe_filiais() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.equipe_filiais() TO authenticated;