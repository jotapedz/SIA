-- RF03/RF04: complementa a tabela existente, preservando IDs, vínculos e registros.
BEGIN;

ALTER TABLE public."Discente"
    ADD COLUMN IF NOT EXISTS nome_social TEXT CHECK (length(nome_social) <= 150),
    ADD COLUMN IF NOT EXISTS curso TEXT CHECK (length(curso) <= 150),
    ADD COLUMN IF NOT EXISTS turno TEXT CHECK (length(turno) <= 30),
    ADD COLUMN IF NOT EXISTS email_institucional TEXT CHECK (length(email_institucional) <= 254),
    ADD COLUMN IF NOT EXISTS telefone TEXT CHECK (length(telefone) <= 25),
    ADD COLUMN IF NOT EXISTS data_nascimento DATE,
    ADD COLUMN IF NOT EXISTS contato_familiar_nome TEXT CHECK (length(contato_familiar_nome) <= 150),
    ADD COLUMN IF NOT EXISTS contato_familiar_parentesco TEXT CHECK (length(contato_familiar_parentesco) <= 60),
    ADD COLUMN IF NOT EXISTS contato_familiar_telefone TEXT CHECK (length(contato_familiar_telefone) <= 25),
    ADD COLUMN IF NOT EXISTS contato_familiar_email TEXT CHECK (length(contato_familiar_email) <= 254),
    ADD COLUMN IF NOT EXISTS contato_familiar_observacao TEXT CHECK (length(contato_familiar_observacao) <= 500);

-- Não remover duplicidades automaticamente: interromper sem perder dados.
-- O ALTER TABLE acima mantém o bloqueio de escrita até o COMMIT.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public."Discente"
        GROUP BY btrim(matricula)
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Existem matrículas duplicadas em Discente. Revise os registros antes de aplicar a migração.';
    END IF;
END;
$$;

-- Inclui cadastros excluídos: não reutilizar matrículas silenciosamente.
CREATE UNIQUE INDEX IF NOT EXISTS discente_matricula_key
    ON public."Discente" (btrim(matricula));

CREATE INDEX IF NOT EXISTS discente_nome_ativo_idx
    ON public."Discente" (lower(nome), id_discente)
    WHERE data_exclusao IS NULL;

-- Dados acadêmicos e de contato ficam acessíveis somente pelo backend autorizado.
-- A conexão do backend deve usar o usuário de banco configurado em DATABASE_URL.
ALTER TABLE public."Discente" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Discente" FROM PUBLIC, anon, authenticated;

COMMIT;
