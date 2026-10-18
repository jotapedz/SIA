-- RF09/RF10/RF11/RF12. Sem apagar registros ou alterar usuarios existentes.
BEGIN;

ALTER TABLE public."Relatório"
    ADD COLUMN IF NOT EXISTS data_cancelamento TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS id_cancelado_por BIGINT REFERENCES public."Perfil" (id_perfil);

-- Evita duas contas de aplicacao para o mesmo e-mail, inclusive com caixa diferente.
-- Interrompe sem escolher ou remover registros se houver duplicidades legadas.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public."Perfil"
        GROUP BY lower(btrim(email)) HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existem e-mails duplicados em Perfil. Revise os registros antes de aplicar a migracao.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS perfil_email_normalizado_key
    ON public."Perfil" (lower(btrim(email)));

CREATE INDEX IF NOT EXISTS perfil_nome_visivel_idx
    ON public."Perfil" (lower(nome), id_perfil)
    WHERE data_exclusao IS NULL;

ALTER TABLE public."Perfil" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Perfil" FROM PUBLIC, anon, authenticated;

COMMIT;
