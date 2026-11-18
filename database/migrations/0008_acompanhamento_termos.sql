-- RF17/RF19: registros imutáveis; acesso somente pela API autenticada.
BEGIN;
CREATE TABLE IF NOT EXISTS public."RegistroAcompanhamento" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_discente BIGINT NOT NULL REFERENCES public."Discente"(id_discente),
    id_relatorio BIGINT REFERENCES public."Relatório"(id_relatorio),
    id_autor BIGINT NOT NULL REFERENCES public."Perfil"(id_perfil),
    tipo TEXT NOT NULL CHECK (tipo IN ('ATENDIMENTO', 'CONTRIBUICAO', 'ENCAMINHAMENTO', 'ACOMPANHAMENTO', 'OBSERVACAO')),
    data_atendimento DATE NOT NULL,
    descricao TEXT NOT NULL CHECK (length(btrim(descricao)) BETWEEN 1 AND 20000),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS registro_acompanhamento_discente_idx
    ON public."RegistroAcompanhamento" (id_discente, data_atendimento DESC, id DESC);
CREATE TABLE IF NOT EXISTS public."TermoCienciaRegistro" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_discente BIGINT NOT NULL REFERENCES public."Discente"(id_discente),
    id_autor BIGINT NOT NULL REFERENCES public."Perfil"(id_perfil),
    data_ciencia DATE NOT NULL,
    nome_arquivo TEXT NOT NULL CHECK (length(nome_arquivo) BETWEEN 1 AND 200),
    documento BYTEA NOT NULL CHECK (octet_length(documento) BETWEEN 5 AND 5242880),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS termo_ciencia_discente_idx
    ON public."TermoCienciaRegistro" (id_discente, data_criacao DESC, id DESC);
ALTER TABLE public."RegistroAcompanhamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TermoCienciaRegistro" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."RegistroAcompanhamento", public."TermoCienciaRegistro" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public."RegistroAcompanhamento_id_seq", public."TermoCienciaRegistro_id_seq" FROM PUBLIC, anon, authenticated;
COMMIT;
