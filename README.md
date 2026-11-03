# SIA — Sistema de Inclusão e Acessibilidade

O **SIA — Sistema de Inclusão e Acessibilidade** é uma plataforma destinada aos Agentes de Acessibilidade responsáveis pelo acompanhamento acadêmico de estudantes com demandas de acessibilidade.

O sistema tem como objetivo centralizar, organizar e proteger as informações necessárias ao acompanhamento dos estudantes, facilitando o registro de demandas, atendimentos, orientações, adaptações e propostas da solução.

> O SIA não tem como finalidade armazenar prontuários médicos, diagnósticos, laudos ou históricos clínicos.

---
## Universidade Federal do Ceará

## Equipe

* Nicole Rabelo
* Thayná Albano
* Maria Sofia Peixoto
* Mayra Grazielly
* João Pedro Lisboa
* Liz Maciel Lopes

---

## Situação do projeto

O projeto encontra-se em fase de levantamento de requisitos, definição da arquitetura e modelagem do banco de dados.

---

## Objetivo

Desenvolver uma ferramenta que permita aos Agentes de Acessibilidade:

* Cadastrar estudantes que necessitam de acompanhamento;
* Registrar demandas de acessibilidade;
* Documentar atendimentos e reuniões;
* Identificar necessidades e adaptações;
* Elaborar relatórios de acompanhamento;
* Registrar orientações e propostas de solução;
* Consultar o histórico de cada estudante;
* Manter os dados atualizados;
* Controlar o acesso às informações;
* Auditar as operações realizadas no sistema.

---

## Contexto do sistema

Atualmente, as informações relacionadas às demandas de acessibilidade podem ficar distribuídas entre diferentes documentos, registros e meios de comunicação.

O SIA busca centralizar essas informações em uma única plataforma, proporcionando aos Agentes de Acessibilidade uma visão organizada do acompanhamento de cada estudante.

Para cada discente, poderão ser registradas informações acadêmicas e operacionais relacionadas às suas necessidades de acessibilidade. Os atendimentos realizados ficarão disponíveis em um histórico, permitindo acompanhar a evolução das demandas e as medidas que já foram adotadas.



---

## Usuários do sistema

O acesso ao SIA será destinado aos profissionais autorizados pela instituição.

### Agente de Acessibilidade

Poderá:

* Consultar estudantes;
* Cadastrar estudantes;
* Atualizar informações dos estudantes;
* Registrar demandas de acessibilidade;
* Registrar atendimentos e contribuições;
* Elaborar relatórios;
* Registrar encaminhamentos;
* Consultar o histórico de acompanhamento;
* Visualizar e atualizar o próprio perfil.

### Coordenação de Acessibilidade

Poderá possuir as funcionalidades do Agente de Acessibilidade e permissões administrativas, como:

* Cadastrar usuários;
* Editar usuários;
* Ativar ou desativar usuários;
* Consultar registros de auditoria;
* Gerenciar categorias de acessibilidade;
* Acompanhar as demandas registradas no sistema.

As permissões definitivas de cada perfil ainda deverão ser validadas com a instituição.

### Discentes

Os discentes serão cadastrados para fins de acompanhamento, mas não possuirão acesso direto ao sistema nesta versão.

### Professores

Professores poderão receber orientações produzidas pelos Agentes de Acessibilidade, mas não possuirão perfil de acesso ou cadastro próprio no sistema.

---

## Escopo

### Funcionalidades incluídas

* Autenticação de usuários;
* Recuperação de senha;
* Navegação pelo menu principal;
* Tela inicial;
* Cadastro de usuários;
* Consulta e edição de usuários;
* Ativação e desativação de usuários;
* Visualização do próprio perfil;
* Alteração de e-mail e senha;
* Cadastro de discentes;
* Consulta e edição de discentes;
* Ativação e desativação de discentes;
* Cadastro de demandas e relatórios;
* Consulta, edição e cancelamento de relatórios;
* Registro de atendimentos;
* Registro de encaminhamentos;
* Registro de acompanhamento;
* Registro de Termo de Ciência;
* Consulta do histórico do estudante;
* Classificação das demandas de acessibilidade;
* Auditoria das operações realizadas.


---

## Requisitos funcionais

| Identificador | Descrição                                                                                                                                                                                                                                                   | Prioridade | Status |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------: | ------ |
| **RF01**      | **O Agente de Acessibilidade** deve realizar login **por meio do preenchimento de suas credenciais**, **para acessar as funcionalidades do sistema**.                                                                                                       |       Alta |   Done     |
| **RF02**      | **O Agente de Acessibilidade** deve recuperar sua senha **por meio do fluxo de recuperação de senha**, **para restabelecer seu acesso ao sistema**.                                                                                                         |       Alta |   Done     |
| **RF03**      | **O Agente de Acessibilidade** deve acessar a tela inicial **após realizar o login**, **para visualizar as funcionalidades disponíveis**.                                                                                                                   |       Alta |   Done     |
| **RF04**      | **O Agente de Acessibilidade** deve cadastrar discentes **por meio de um formulário de cadastro**, **para registrar os estudantes no sistema e possibilitar seu acompanhamento**.                                                                            |       Alta |  Done      |
| **RF05**      | **O Agente de Acessibilidade** deve visualizar as informações de um discente **por meio da consulta ao seu cadastro**, **para obter informações sobre o discente**.                                                                                          |      Média |  Done      |
| **RF06**      | **O Agente de Acessibilidade** deve editar as informações de um discente **por meio da funcionalidade de edição**, **para manter seus dados atualizados**.                                                                                                   |      Média |  Done      |
| **RF07**      | **O Agente de Acessibilidade** deve visualizar os relatórios de acompanhamento cadastrados **por meio da listagem de relatórios**, **para consultar os registros associados aos discentes**.                                                                 |       Alta |   Done     |
| **RF08**      | **O Agente de Acessibilidade** deve adicionar relatórios de acompanhamento **por meio de um formulário de registro**, **para documentar informações relacionadas ao acompanhamento dos discentes**.                                                        |       Alta |   Done     |
| **RF09**      | **O Agente de Acessibilidade** deve editar relatórios de acompanhamento **por meio da funcionalidade de edição**, **para corrigir ou atualizar informações registradas**.                                                                                    |      Média |   Done     |
| **RF10**      | **O Agente de Acessibilidade** deve cancelar ou desativar relatórios **por meio da funcionalidade de gerenciamento dos registros**, **para impedir que relatórios inválidos ou não aplicáveis permaneçam ativos**.                                           |      Média |   Done     |
| **RF11**      | **O Agente de Acessibilidade** deve visualizar os usuários cadastrados **por meio da listagem de usuários**, **para consultar os usuários registrados no sistema**.                                                                                           |      Baixa |   Done     |
| **RF12**      | **O Agente de Acessibilidade** deve cadastrar usuários **por meio de um formulário de cadastro**, **para conceder acesso ao sistema a novos usuários**.                                                                                                      |       Alta |   Done     |
| **RF13**      | **O Agente de Acessibilidade** deve editar as informações dos usuários **por meio da funcionalidade de edição**, **para manter seus dados atualizados**.                                                                                                     |       Alta |   Implementado (validação local)     |
| **RF14**      | **O Agente de Acessibilidade** deve visualizar seu próprio perfil **por meio da área de perfil**, **para consultar seus dados cadastrados e informações de acesso**.                                                                                          |       Alta |   Implementado (validação local)     |
| **RF15**      | **O Agente de Acessibilidade** deve alterar seu e-mail **por meio da área de gerenciamento do perfil**, **para manter seu endereço de e-mail atualizado**.                                                                                                   |      Baixa |    Implementado (validação local)    |
| **RF16**      | **O Agente de Acessibilidade** deve alterar sua senha **por meio da área de gerenciamento do perfil**, **para manter a segurança de suas credenciais de acesso**.                                                                                            |      Média |    Implementado (validação local)    |
| **RF17**      | **O Agente de Acessibilidade** deve registrar atendimentos e contribuições **por meio de um formulário de registro**, **para documentar as ações realizadas no acompanhamento dos discentes**.                                                               |      Média |        |
| **RF18**      | **O Agente de Acessibilidade** deve consultar o histórico de acompanhamento de um discente **por meio da área de histórico**, **para acompanhar os registros realizados durante seu atendimento**.                                                           |       Alta |        |
| **RF19**      | **O Agente de Acessibilidade** deve registrar o Termo de Ciência **por meio da funcionalidade de registro do documento**, **para documentar a ciência do discente**.                                                                                         |       Alta |        |
| **RF20**      | **O Agente de Acessibilidade** deve classificar as demandas dos discentes **por meio da seleção de categorias de acessibilidade**, **para organizar e identificar suas necessidades de acessibilidade**.                                                     |      Baixa |        |
| **RF21**      | **O sistema** deve registrar as operações realizadas pelo **Agente de Acessibilidade** **por meio de um histórico de auditoria**, **para possibilitar o rastreamento das ações executadas**.                                                                  |      Média |        |
| **RF22**      | **O Agente de Acessibilidade** deve filtrar as listagens de discentes, relatórios e usuários **por meio de critérios de busca e filtragem**, **para localizar registros específicos com maior facilidade**.                                                   |      Baixa |        |
---

## Funcionalidades principais

### Gerenciamento de usuários

O sistema deverá permitir:

* Cadastrar usuários;
* Informar nome, e-mail, telefone e tipo de perfil;
* Consultar usuários;
* Editar usuários;
* Ativar e desativar usuários;
* Alterar e-mail;
* Alterar senha;
* Visualizar o próprio perfil.

Os perfis inicialmente considerados são:

* `AGENTE_ACESSIBILIDADE`
* `COORDENACAO_ACESSIBILIDADE`

### Gerenciamento de discentes

O sistema deverá permitir:

* Cadastrar discentes;
* Consultar os dados cadastrados;
* Editar informações;
* Ativar ou desativar o cadastro;
* Consultar demandas;
* Consultar atendimentos;
* Consultar o histórico de acompanhamento;
* Verificar a situação do Termo de Ciência.

Os dados deverão ser limitados às informações acadêmicas e operacionais necessárias ao acompanhamento.

### Demandas e relatórios

No contexto do SIA, o relatório representa o registro de uma demanda de acessibilidade e seu acompanhamento. Ele não representa um relatório médico.

Um relatório poderá conter:

* Descrição objetiva da demanda;
* Contexto acadêmico;
* Orientações necessárias;
* Propostas de solução;
* Ações ou adaptações recomendadas;
* Status da demanda;
* Data de abertura;
* Data de encerramento;
* Usuário responsável pelo registro.

Os possíveis estados iniciais são:

* `ABERTO`
* `EM_ATENDIMENTO`
* `ENCAMINHADO`
* `CONCLUIDO`
* `CANCELADO`

### Atendimentos e contribuições

As interações relacionadas a uma demanda serão registradas como contribuições.

Uma contribuição poderá representar:

* Atendimento;
* Encaminhamento;
* Acompanhamento;
* Observação operacional.

Tipos inicialmente considerados:

* `ATENDIMENTO`
* `ENCAMINHAMENTO`
* `ACOMPANHAMENTO`
* `OBSERVACAO`

Cada contribuição deverá registrar o usuário responsável e a data de criação.

### Termo de Ciência

O sistema deverá permitir registrar o Termo de Ciência relacionado ao acompanhamento do estudante.

Os possíveis estados iniciais são:

* `VIGENTE`
* `SUBSTITUIDO`
* `ANULADO`

O conteúdo definitivo do termo, sua fundamentação e sua forma de aceite ainda deverão ser validados pela instituição.

### Histórico de acesso

O sistema deverá registrar operações relevantes, como:

* Criação;
* Alteração;
* Ativação;
* Desativação;
* Cancelamento;
* Mudança de status.

---

## Categorias de acessibilidade

As demandas poderão ser classificadas por categorias. Essa classificação facilitará a organização das informações sem exigir o armazenamento de diagnósticos médicos.

### Tipos de demanda

* Avaliação;
* Sala de aula;
* Material didático;
* Comunicação;
* Tecnologia assistiva;
* Acessibilidade física;
* Acessibilidade digital;
* Organização acadêmica;
* Outro.

### Necessidades

* Ambiente com menor estímulo sensorial;
* Tempo adicional para avaliação;
* Material em formato acessível;
* Tecnologia assistiva;
* Apoio para comunicação;
* Adaptação de atividade;
* Outro.

### Ações e adaptações

* Sala alternativa;
* Tempo adicional;
* Material adaptado;
* Recurso tecnológico;
* Atendimento individualizado;
* Encaminhamento à secretaria;
* Encaminhamento ao Agente de Acessibilidade.

As categorias deverão ser configuráveis para evitar alterações estruturais no banco sempre que surgir uma nova classificação.

---

## Filtros sugeridos

### Discentes

* Nome;
* Matrícula;
* Status acadêmico;
* Existência de demanda em aberto;
* Situação do Termo de Ciência.

### Relatórios e demandas

* Discente;
* Status;
* Período de abertura;
* Usuário responsável;
* Tipo de demanda;
* Necessidade;
* Ação ou adaptação.

### Usuários

* Nome;
* E-mail;
* Tipo de perfil;
* Status ativo ou inativo.

### Histórico

* Usuário responsável;
* Entidade;
* Tipo de operação;
* Período;
* Identificador do registro.

---

## Modelo de dados

O modelo de dados do SIA é composto pelas seguintes entidades principais:

| Entidade                  | Responsabilidade                                              |
| ------------------------- | ------------------------------------------------------------- |
| `Perfil`                  | Armazena os usuários autorizados e seus níveis de acesso.     |
| `Discente`                | Armazena os dados acadêmicos necessários ao acompanhamento.   |
| `Relatorio`               | Representa uma demanda de acessibilidade.                     |
| `CategoriaAcessibilidade` | Armazena as classificações de demandas, necessidades e ações. |
| `RelatorioCategoria`      | Relaciona relatórios às categorias de acessibilidade.         |
| `Contribuicao`            | Registra atendimentos, encaminhamentos e acompanhamentos.     |
| `TermoCiencia`            | Registra a ciência do estudante sobre o acompanhamento.       |
| `HistoricoAcesso`         | Registra as operações realizadas no sistema.                  |



## Fluxo básico de utilização

1. O usuário autorizado realiza login;
2. O usuário acessa a tela inicial;
3. Um discente é cadastrado ou localizado;
4. O Termo de Ciência é registrado, quando aplicável;
5. Uma demanda de acessibilidade é cadastrada;
6. A demanda recebe categorias de necessidade e adaptação;
7. Atendimentos e encaminhamentos são registrados;
8. O status da demanda é atualizado durante o acompanhamento;
9. A demanda é concluída ou cancelada;
10. As operações permanecem registradas no histórico de auditoria.

---

## Privacidade e proteção de dados

O desenvolvimento do SIA deverá observar os seguintes princípios:

* Minimização da coleta de dados;
* Utilização das informações para finalidade acadêmica específica;
* Restrição de acesso;
* Rastreabilidade das operações;
* Segurança no armazenamento e na transmissão;
* Não discriminação;
* Transparência;
* Definição de prazo de retenção;
* Descarte ou anonimização quando aplicável.

Informações de saúde somente poderão ser tratadas quando forem indispensáveis e houver autorização e fundamentação institucional adequadas.

---

## Tecnologias

A stack tecnológica ainda será definida pela equipe.

| Camada             | Tecnologia                     |
| ------------------ | ------------------------------ |
| Front-end          | React                          |
| Back-end           | Python FastAPI                 |
| Banco de dados     | Supabase Postgres              |
| Prototipação       | Figma                          |
| Controle de versão | Github                         |


## Estrutura  do projeto

```text
sia/
├── frontend/
├── backend/
├── database/
├── docs/
│   ├── requisitos/
│   ├── diagramas/
│   └── prototipos/
├── tests/
└── README.md
```


---

## Telas e fluxos disponíveis

As telas de discentes e dos seis tipos de relatório seguem os componentes visuais existentes: Cadastro, Acompanhamento, Ações de sucesso, Recursos de acessibilidade, Barreiras e Observações. O relatório de Cadastro utiliza três etapas e mantém as escolhas ao avançar ou voltar. O salvamento ocorre apenas ao selecionar Adicionar ou confirmar Salvar.

Os detalhes de discentes e relatórios possuem um modal de histórico com data, operação e usuário. O histórico do discente mostra somente operações do próprio cadastro; as operações dos relatórios aparecem exclusivamente no histórico do respectivo relatório. Os registros usam a tabela existente `HistoricoAcesso`, com as colunas `id_historico`, `id_perfil`, `entidade`, `id_registro`, `acao` e `data_evento`. Nesta etapa, os campos JSON de dados anteriores e novos não recebem cópias dos formulários. Operações anteriores à ativação só aparecem se já estiverem registradas nessa tabela.

As edições de relatório geram uma única operação, Alteração de relatório, acompanhada do nome atual do relatório na interface. Não há detalhamento por campo ou seção. Operações antigas de edição também são exibidas com essa descrição genérica, sem modificar ou excluir os registros do banco. Adição e cancelamento mantêm suas descrições próprias. O título exibido acompanha o cadastro atual do relatório, não é uma cópia do título na data do evento.

A edição do discente solicita confirmação antes de enviar as alterações. Cancelar a confirmação retorna ao formulário mantendo o preenchimento. Cada campo efetivamente alterado gera uma linha específica no histórico, como Edição de nome completo ou Edição de status. O contato familiar distingue adição, remoção e edição de seus campos. A coluna `campos_afetados` guarda apenas os identificadores dos campos, sem seus valores. Registros antigos com a descrição genérica Edição de discente permanecem assim, pois não continham essa identificação.

A ação Excluir discente preenche `data_exclusao`, preservando os registros no banco e retirando o discente e seus relatórios das consultas. Para apenas desativar um discente, utilize o status no formulário de edição. A ação Excluir relatório mantém o cancelamento previsto no RF10; o relatório permanece disponível para consulta e não pode ser editado.

Exportar relatório abre a impressão do navegador, que permite escolher Salvar como PDF. A versão para impressão contém os dados do relatório e o nome do discente, sem os menus e botões da aplicação.

RF13–RF16 foram complementados com edição de nome, perfil e status dos usuários, consulta do próprio perfil e alteração de e-mail e senha. Clicar no nome do usuário no cabeçalho abre o modal Perfil, com nome, tipo de acesso, e-mail e os botões Redefinir e-mail e Redefinir senha. Esses botões abrem telas separadas com o formulário centralizado. Não há uma página de detalhes do próprio perfil. O endereço antigo `/perfil` abre o modal sobre a lista de discentes.

O e-mail é alterado pelo titular pelo Supabase Auth; a confirmação segue a configuração do projeto. A redefinição de senha valida tamanho, confirmação e a rejeição `same_password` do Supabase, exibindo uma mensagem específica quando a senha informada é a atual. Essa comparação é feita no serviço de autenticação. O próprio usuário não pode desativar seu acesso.

O cadastro administrativo de usuários mantém o comportamento original: utiliza `email_confirm: True` e não exige confirmação da caixa de entrada. A troca pelo titular é um fluxo separado. O texto atual da tela orienta a confirmação somente no novo endereço e pressupõe `Secure email change` desativado no Supabase. O serviço diferencia erros de endereço recusado, envio não autorizado, limite de envio, sessão inválida e tempo de resposta excedido.

O envio das mensagens pode usar SMTP personalizado, configurado no painel do Supabase, sem alterar os comandos de execução ou o código. Credenciais SMTP e senhas de app não devem ser versionadas. Essa configuração, a opção `Secure email change` e as URLs permitidas precisam ser conferidas em cada ambiente; não são aplicadas pela migração SQL.

A exclusão de usuários está disponível nos cartões da listagem, mediante confirmação. A operação preenche `Perfil.data_exclusao`, altera o status para `INATIVO` e define `is_active = false`. O perfil é mantido no banco com o mesmo identificador e nome, preservando a autoria de relatórios e históricos e os cadastros feitos por ele. A conta no Supabase Auth também é mantida; mesmo que ainda exista uma sessão de autenticação, o backend recusa o acesso ao SIA para perfis excluídos. Nenhum registro associado é apagado ou transferido para outro usuário.

Não é permitido excluir o próprio usuário. Uma alteração concorrente no cadastro exige recarregar a listagem antes de excluir. A exclusão é registrada em `HistoricoAcesso` com a entidade `Perfil`, na mesma transação. Essa funcionalidade utiliza colunas já usadas pelo projeto e não exige uma nova migração. O e-mail permanece reservado ao perfil existente; excluir não permite criar outra conta com o mesmo endereço. Para apenas suspender um acesso e mantê-lo na listagem, utilize Editar → Status → Inativo.

Os históricos cobrem as operações de cadastro, edição, cancelamento de relatórios e exclusão lógica de discentes. Consultas de discentes e relatórios não geram eventos; as consultas registradas anteriormente também ficam ocultas na listagem, sem apagar os registros do banco. Isso atende às telas enviadas e a parte de RF18/RF21; não representa a conclusão de contribuições, atendimentos ou Termo de Ciência.

### Atualização do Supabase

Antes de executar este código contra o banco compartilhado, aplique as migrações em ordem até `database/migrations/0006_historico_perfil.sql`, executando apenas as que ainda não foram aplicadas. A migração 0006 usa a tabela `HistoricoAcesso` existente, adiciona um índice para consulta, restringe seu acesso direto e cria um gatilho para sincronizar `Perfil.email` quando `auth.users.email` mudar após a confirmação. Não cria outra tabela de histórico, não apaga registros e não copia senhas para `Perfil`.

Para fotos, aplique também `database/migrations/0007_discente_foto.sql`. Ela adiciona somente `Discente.foto_path`, texto opcional, sem alterar os cadastros existentes. Configure no Storage um bucket privado com ID `Fotos Discentes`; o backend recusa enviar ou assinar imagens se ele estiver público. Não são necessárias políticas de acesso direto para o frontend: as operações passam pelo backend e suas permissões de acesso ao SIA. Informe a chave administrativa em `SUPABASE_SECRET_KEY` somente no backend. O ID pode ser alterado por `SUPABASE_STUDENT_PHOTOS_BUCKET` no ambiente do backend.

O cadastro e a edição permitem foto opcional JPG/PNG de até 2 MB e 16 megapixels. A prévia é circular e os botões permitem remover ou desfazer antes de salvar. O backend valida o conteúdo com Pillow, corrige a orientação e gera JPEG de até 768 pixels, sem os metadados originais. O envio ocorre apenas no salvamento; cancelar o formulário não envia arquivos. A foto aparece ao lado do nome e status somente com os detalhes expandidos. Recolher e expandir mantém a imagem carregada; a primeira abertura depende da conexão com o armazenamento.

O endpoint autenticado `GET /v1/discentes/{id}/foto` disponibiliza um link válido por cinco minutos após verificar o discente e o bucket privado. A interface renova esse link enquanto o componente estiver aberto. Adição, substituição e remoção geram eventos de histórico do discente, sem copiar imagens para a auditoria. A foto anterior só é removida após confirmar o salvamento; falhas de limpeza ou confirmação de commit podem deixar arquivos privados sem referência, para revisão posterior pela equipe. A exclusão lógica do discente mantém o arquivo privado e impede novas consultas pelo endpoint.

Após atualizar esta versão, execute novamente `pip install -r requirements.txt` no ambiente do backend, que agora inclui `Pillow==13.0.0`, e reinicie o servidor. A interface foi conferida com dados fictícios e o Storage foi testado com respostas simuladas; o envio e a leitura no bucket real precisam ser validados no ambiente configurado.

O backend continua acessando o banco por `DATABASE_URL`. A migração deve ser executada com uma conexão administrativa que possa criar o gatilho em `auth.users`. Mantenha o endereço do frontend terminado em `/perfil` na lista de URLs de redirecionamento permitidas no Supabase Auth, além dos endereços já usados pela recuperação de senha. Após a confirmação de e-mail, esse endereço abre o modal Perfil.

As migrações não foram executadas automaticamente no Supabase. A validação local não substitui a conferência do gatilho e das confirmações de e-mail no projeto configurado.

### Verificações locais

```powershell
cd frontend
npm run build
npm test
cd ../backend
../.venv/Scripts/python.exe -m unittest discover -s tests -v
```

Os testes do backend usam dependências simuladas e não gravam no Supabase. Para conferir as telas com dados fictícios, inicie o frontend e abra `/tests/preview.html?path=/discentes/1`. A prévia permite navegar pelas telas, bloqueia as gravações e não faz parte da compilação de produção. Para retornar ao sistema real, abra novamente `/`.

## Execução do projeto

O login utiliza React, Supabase Auth, FastAPI e Supabase Postgres. O frontend autentica o usuário no Supabase e envia o token de acesso ao FastAPI para validar o perfil autorizado.

### Pré-requisito

* Node.js `16.20.2`;
* npm, instalado junto com o Node.js.
* Python `3.11`;
* Um projeto Supabase com autenticação por e-mail habilitada.

No Windows, instale o Python 3.11 pelo site oficial e marque a opção para adicionar o Python ao `PATH`. O comando `py -3.11 --version` deve funcionar antes de configurar o backend.

```bash
# Instale e inicie o front-end
cd frontend
npm install
npm run dev
```

O Vite informará no terminal o endereço local para acessar a aplicação durante o desenvolvimento.


### Execução do backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Variáveis de ambiente

Os arquivos `frontend/.env` e `backend/.env` são locais e estão no `.gitignore`. Não publique senhas do banco ou chaves secretas do Supabase nesses arquivos nem em outros arquivos versionados.

O arquivo `frontend/.env` contém a configuração local do Supabase e não é versionado. Use `frontend/.env.example` como referência:

```env
VITE_SUPABASE_URL=https://jkodhibwdjwcfiicbjyk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
VITE_API_BASE_URL=http://localhost:8000
```
Para o backend, crie `backend/.env` a partir de `backend/.env.example`. Use a URL do **Session pooler** em **Connect** no Supabase quando sua rede não tiver IPv6:

```env
SUPABASE_URL=https://jkodhibwdjwcfiicbjyk.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
DATABASE_URL=postgresql+asyncpg://postgres:sua_senha@host:porta/postgres
```

### Perfil disponível para testes

Com o backend e o frontend em execução, acesse `http://localhost:5173` e utilize a conta temporária:

| Campo | Valor |
| ----- | ----- |
| E-mail | `teste.sia@example.org` |
| Senha temporária | `Sia!XQjz14X8jaZr16l6qgI7a` |
| Perfil | `AGENTE_ACESSIBILIDADE` |
| Situação | Ativo, com e-mail confirmado no Supabase Auth |

Após o login, é possível testar a listagem, a busca, os filtros e o cadastro de discentes, com ou sem contato familiar. Ao repetir uma matrícula, o sistema deve informar que ela já está cadastrada.

> Conta exclusiva para desenvolvimento e testes com dados fictícios. As credenciais acima estão publicadas neste repositório: não utilize essa conta em produção nem em um ambiente com dados reais. Troque a senha ou desative o perfil ao encerrar os testes.

O endereço `example.org` é fictício e não recebe mensagens. Para testar a recuperação de senha, utilize outra conta com uma caixa de e-mail acessível. A senha de login acima não é a senha de conexão com o banco de dados.



