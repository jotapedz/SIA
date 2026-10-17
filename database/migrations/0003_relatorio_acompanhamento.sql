-- RF07/RF08: complementa os relatorios existentes sem alterar seus identificadores.
BEGIN;

ALTER TABLE public."Relatório"
    ADD COLUMN IF NOT EXISTS tipo_relatorio VARCHAR(40),
    ADD COLUMN IF NOT EXISTS atividade_disciplina TEXT CHECK (length(atividade_disciplina) <= 5000),
    ADD COLUMN IF NOT EXISTS acompanhamento_continuado TEXT CHECK (length(acompanhamento_continuado) <= 20000),
    ADD COLUMN IF NOT EXISTS observacao TEXT CHECK (length(observacao) <= 5000);

-- Registros anteriores permanecem sem classificacao; nao reclassificar dados legados.
CREATE INDEX IF NOT EXISTS relatorio_discente_abertura_idx
    ON public."Relatório" (id_discente, data_abertura DESC, id_relatorio DESC)
    WHERE data_exclusao IS NULL;

-- Os agentes acessam os dados pelo FastAPI; nao liberar acesso direto pelo frontend.
ALTER TABLE public."Relatório" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Relatório" FROM PUBLIC, anon, authenticated;

COMMIT;
