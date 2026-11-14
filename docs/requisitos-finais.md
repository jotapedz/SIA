# RF17–RF22 — entrega SIA-09

Base: `origin/main` em `99241eb`. Nenhuma migração é aplicada automaticamente.

## Cobertura

- **RF17:** tela do discente → Atendimentos e contribuições. Tipo, data da ação,
  descrição e vínculo opcional a um relatório do mesmo discente. Autor obtido da
  sessão, nunca do formulário. Registros preservados, sem edição ou exclusão.
- **RF18:** histórico do discente reúne suas operações e as dos relatórios
  vinculados, incluindo registros de atendimento/contribuição. Paginação única.
- **RF19:** PDF do Termo de Ciência existente, até 5 MB, com data da ciência,
  autor e data de registro. Novos registros não sobrescrevem os anteriores.
  Download autenticado, sem URL pública, com auditoria. Não gera texto oficial,
  não assina documentos e não verifica validade jurídica de assinaturas.
- **RF20:** já coberto pela seleção de categorias no relatório de Cadastro.
  Mantida a validação de categorias e de detalhes obrigatórios existente.
- **RF21:** mantida auditoria de alterações de discentes, usuários e relatórios;
  adicionada auditoria de atendimentos, contribuições e registro/download de termos.
  Conteúdo dos documentos e descrições não são copiados para a auditoria.
- **RF22:** mantidos filtros de discentes/usuários; relatórios passam a ter busca
  por título/descrição, tipo, status e intervalo de abertura, com paginação e limpeza.

RF13–RF16 permanecem implementados pela entrega anterior, sem declarar validação
funcional nesta entrega.

## Implantação

1. Confirmar aplicação das migrações anteriores, inclusive `0006` e `0007`.
2. Fazer backup e aplicar `database/migrations/0008_acompanhamento_termos.sql`
   com o responsável pelo banco. Ela cria tabelas novas; não altera registros existentes.
3. Publicar backend e frontend juntos. Sem a migração, os novos endpoints não funcionam.

PDFs são guardados em `BYTEA`, acessíveis somente pela conexão de serviço do
backend. Isso evita configurar um bucket público, mas aumenta o tamanho do banco
e dos backups. A API verifica extensão, assinatura inicial e tamanho; não faz
antivírus nem validação estrutural completa de PDF. O download é um anexo, não uma
pré-visualização embutida. Configurar limite de corpo de requisição no proxy
(por exemplo 8 MB para acomodar base64) e a política institucional de retenção.

## Roteiro de validação manual (não executado)

1. Registrar atendimento e contribuição, com/sem relatório; conferir autor e datas.
2. Tentar data futura, texto vazio, relatório cancelado e relatório de outro discente.
3. Anexar PDF, baixar e comparar com o original; registrar novo termo e conferir
   que o anterior foi preservado. Rejeitar arquivos inválidos e acima de 5 MB.
4. Conferir histórico unificado e paginação; verificar que não há eventos duplicados.
5. Combinar e limpar filtros de relatórios; testar intervalo invertido e resultado vazio.
6. Confirmar que endpoints recusam sessão ausente e perfil não autorizado.
7. Revalidar RF13–RF16 e os fluxos existentes de cadastro/edição/cancelamento.

Testes preparados em `backend/tests/test_acompanhamento.py`, não executados.
