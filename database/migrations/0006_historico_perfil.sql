-- histórico sem copiar os dados dos formulários
BEGIN;
CREATE INDEX IF NOT EXISTS historico_sia_entidade_idx
    ON public."HistoricoAcesso" (lower(entidade), id_registro, data_evento DESC, id_historico DESC);
ALTER TABLE public."HistoricoAcesso" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."HistoricoAcesso" FROM PUBLIC, anon, authenticated;

-- sincroniza o e-mail confirmado no auth
CREATE OR REPLACE FUNCTION public.sia_sincronizar_email_perfil()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    UPDATE public."Perfil" SET email = lower(NEW.email), data_atualizacao = clock_timestamp()
    WHERE auth_user_id = NEW.id AND email IS DISTINCT FROM lower(NEW.email);
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sia_sincronizar_email_perfil() FROM PUBLIC;
DROP TRIGGER IF EXISTS sia_email_perfil ON auth.users;
CREATE TRIGGER sia_email_perfil AFTER UPDATE OF email ON auth.users
FOR EACH ROW WHEN (NEW.email IS NOT NULL AND OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sia_sincronizar_email_perfil();
COMMIT;
