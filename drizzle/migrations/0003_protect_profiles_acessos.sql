CREATE OR REPLACE FUNCTION public.protect_profile_acessos() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.acessos IS DISTINCT FROM OLD.acessos AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar acessos';
  END IF;
  IF NEW.filial IS DISTINCT FROM OLD.filial AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar a filial';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_profile_acessos BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_acessos();