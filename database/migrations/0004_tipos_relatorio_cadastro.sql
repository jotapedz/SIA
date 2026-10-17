-- Complementa os tipos de relatorio e permite varias categorias em cada Cadastro.
BEGIN;

ALTER TABLE public."Relatório"
    ADD COLUMN IF NOT EXISTS estrategia_adotada TEXT CHECK (length(estrategia_adotada) <= 20000),
    ADD COLUMN IF NOT EXISTS resultado_observado TEXT CHECK (length(resultado_observado) <= 20000);

ALTER TABLE public."CategoriaAcessibilidade"
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(80),
    ADD COLUMN IF NOT EXISTS subgrupo VARCHAR(40),
    ADD COLUMN IF NOT EXISTS ordem INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS permite_detalhe BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS categoria_acessibilidade_codigo_key
    ON public."CategoriaAcessibilidade" (codigo);

-- id_relatorio e uma referencia ao relatorio, nao uma identidade independente.
-- Os valores e vinculos ja armazenados nao sao alterados.
ALTER TABLE public."RelatorioCategoria"
    ALTER COLUMN id_relatorio DROP IDENTITY IF EXISTS;
ALTER TABLE public."RelatorioCategoria"
    DROP CONSTRAINT IF EXISTS "RelatorioCategoria_pkey";
ALTER TABLE public."RelatorioCategoria"
    ADD CONSTRAINT "RelatorioCategoria_pkey" PRIMARY KEY (id_relatorio, id_categoria);

-- Catalogo inicial do Figma, configuravel pela tabela sem recriar o formulario.
-- Os subgrupos separam as demandas educacionais e os tipos de barreira.
INSERT INTO public."CategoriaAcessibilidade"
    (codigo, grupo, subgrupo, nome, ordem, permite_detalhe, ativo)
SELECT codigo,
    (CASE WHEN subgrupo = 'ACOMODACOES_RECURSOS' THEN 'ACAO_ADAPTACAO' ELSE 'TIPO_DEMANDA' END)::public.enum_grupos_ca,
    subgrupo, nome, ordem, permite_detalhe, TRUE
FROM (VALUES
    ('CAD_DEMANDA_COMUNICACAO', 'DEMANDAS_EDUCACIONAIS', 'Comunicação', 1, FALSE),
    ('CAD_DEMANDA_MOBILIDADE', 'DEMANDAS_EDUCACIONAIS', 'Mobilidade', 2, FALSE),
    ('CAD_DEMANDA_MATERIAIS', 'DEMANDAS_EDUCACIONAIS', 'Acesso a materiais', 3, FALSE),
    ('CAD_DEMANDA_LEITURA', 'DEMANDAS_EDUCACIONAIS', 'Leitura/escrita', 4, FALSE),
    ('CAD_DEMANDA_AVALIACAO', 'DEMANDAS_EDUCACIONAIS', 'Avaliação', 5, FALSE),
    ('CAD_DEMANDA_ORGANIZACAO', 'DEMANDAS_EDUCACIONAIS', 'Organização e planejamento', 6, FALSE),
    ('CAD_DEMANDA_INTERACAO', 'DEMANDAS_EDUCACIONAIS', 'Interação/socialização', 7, FALSE),
    ('CAD_DEMANDA_PARTICIPACAO', 'DEMANDAS_EDUCACIONAIS', 'Participação em atividades', 8, FALSE),
    ('CAD_DEMANDA_TECNOLOGIA', 'DEMANDAS_EDUCACIONAIS', 'Tecnologia assistiva', 9, FALSE),
    ('CAD_DEMANDA_OUTRO', 'DEMANDAS_EDUCACIONAIS', 'Outro', 10, TRUE),
    ('CAD_FISICA_ACESSO', 'BARREIRAS_FISICAS', 'Acesso aos espaços', 1, FALSE),
    ('CAD_FISICA_DESLOCAMENTO', 'BARREIRAS_FISICAS', 'Deslocamento', 2, FALSE),
    ('CAD_FISICA_MOBILIARIO', 'BARREIRAS_FISICAS', 'Mobiliário', 3, FALSE),
    ('CAD_FISICA_OUTRO', 'BARREIRAS_FISICAS', 'Outro', 4, TRUE),
    ('CAD_COMUNICACAO_ORAL', 'BARREIRAS_COMUNICACIONAIS', 'Comunicação oral', 1, FALSE),
    ('CAD_COMUNICACAO_ESCRITA', 'BARREIRAS_COMUNICACIONAIS', 'Escrita', 2, FALSE),
    ('CAD_COMUNICACAO_INFORMACAO', 'BARREIRAS_COMUNICACIONAIS', 'Acesso à informação', 3, FALSE),
    ('CAD_COMUNICACAO_INTERPRETACAO', 'BARREIRAS_COMUNICACIONAIS', 'Interpretação/compreensão', 4, FALSE),
    ('CAD_COMUNICACAO_OUTRO', 'BARREIRAS_COMUNICACIONAIS', 'Outro', 5, TRUE),
    ('CAD_PEDAGOGICA_COMPREENSAO', 'BARREIRAS_PEDAGOGICAS', 'Compreensão das atividades', 1, FALSE),
    ('CAD_PEDAGOGICA_RITMO', 'BARREIRAS_PEDAGOGICAS', 'Ritmo de aprendizagem', 2, FALSE),
    ('CAD_PEDAGOGICA_AVALIACAO', 'BARREIRAS_PEDAGOGICAS', 'Forma de avaliação', 3, FALSE),
    ('CAD_PEDAGOGICA_MATERIAIS', 'BARREIRAS_PEDAGOGICAS', 'Materiais didáticos', 4, FALSE),
    ('CAD_PEDAGOGICA_METODOLOGIA', 'BARREIRAS_PEDAGOGICAS', 'Metodologia', 5, FALSE),
    ('CAD_PEDAGOGICA_OUTRO', 'BARREIRAS_PEDAGOGICAS', 'Outro', 6, TRUE),
    ('CAD_ATITUDINAL_COLEGAS', 'BARREIRAS_ATITUDINAIS', 'Interação com colegas', 1, FALSE),
    ('CAD_ATITUDINAL_PROFESSOR', 'BARREIRAS_ATITUDINAIS', 'Interação com professor', 2, FALSE),
    ('CAD_ATITUDINAL_PARTICIPACAO', 'BARREIRAS_ATITUDINAIS', 'Participação social', 3, FALSE),
    ('CAD_ATITUDINAL_OUTRO', 'BARREIRAS_ATITUDINAIS', 'Outro', 4, TRUE),
    ('CAD_RECURSO_MATERIAL_ADAPTADO', 'ACOMODACOES_RECURSOS', 'Material adaptado', 1, FALSE),
    ('CAD_RECURSO_TEMPO', 'ACOMODACOES_RECURSOS', 'Tempo adicional', 2, FALSE),
    ('CAD_RECURSO_AVALIACAO', 'ACOMODACOES_RECURSOS', 'Adaptação de avaliação', 3, FALSE),
    ('CAD_RECURSO_TECNOLOGIA', 'ACOMODACOES_RECURSOS', 'Tecnologia assistiva', 4, FALSE),
    ('CAD_RECURSO_MATERIAL_ACESSIVEL', 'ACOMODACOES_RECURSOS', 'Material em formato acessível', 5, FALSE),
    ('CAD_RECURSO_COMUNICACAO', 'ACOMODACOES_RECURSOS', 'Apoio para comunicação', 6, FALSE),
    ('CAD_RECURSO_MOBILIDADE', 'ACOMODACOES_RECURSOS', 'Apoio para mobilidade', 7, FALSE),
    ('CAD_RECURSO_INTERPRETE', 'ACOMODACOES_RECURSOS', 'Intérprete', 8, FALSE),
    ('CAD_RECURSO_PROFISSIONAL', 'ACOMODACOES_RECURSOS', 'Profissional de apoio', 9, FALSE),
    ('CAD_RECURSO_VISUAL', 'ACOMODACOES_RECURSOS', 'Recursos visuais', 10, FALSE),
    ('CAD_RECURSO_AUDITIVO', 'ACOMODACOES_RECURSOS', 'Recursos auditivos', 11, FALSE),
    ('CAD_RECURSO_ORGANIZACAO', 'ACOMODACOES_RECURSOS', 'Organização diferenciada da atividade', 12, FALSE),
    ('CAD_RECURSO_OUTRO', 'ACOMODACOES_RECURSOS', 'Outro', 13, TRUE)
) AS itens(codigo, subgrupo, nome, ordem, permite_detalhe)
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE public."CategoriaAcessibilidade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RelatorioCategoria" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."CategoriaAcessibilidade", public."RelatorioCategoria" FROM PUBLIC, anon, authenticated;

COMMIT;
