# SIA — Sistema de Inclusão e Acessibilidade

O **SIA — Sistema de Inclusão e Acessibilidade** é uma plataforma destinada aos Agentes de Acessibilidade responsáveis pelo acompanhamento acadêmico de estudantes com demandas de acessibilidade.

O sistema tem como objetivo centralizar, organizar e proteger as informações necessárias ao acompanhamento dos estudantes, facilitando o registro de demandas, atendimentos, orientações, adaptações e propostas de solução.

> O SIA não tem como finalidade armazenar prontuários médicos, diagnósticos, laudos ou históricos clínicos.

---
## Universidade Federal do Ceará

## Equipe

* Nicole Rabelo
* Thayná Albano
* Maria Sofia Peixoto
* Mayra Grazielly
* João Pedro Lisboa

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

| Identificador | Descrição                                                                                                                                                                                                          | Prioridade | Status |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------: | ------ |
| **RF01**      | **O Agente de Acessibilidade** deve realizar login **por meio do preenchimento de suas credenciais**, **para acessar as funcionalidades do sistema**.                                                              |       Alta |        |
| **RF02**      | **O Agente de Acessibilidade** deve recuperar sua senha **por meio do fluxo de recuperação de senha**, **para restabelecer seu acesso ao sistema**.                                                                |       Alta |        |
| **RF03**      | **O Agente de Acessibilidade** deve acessar a tela inicial **após realizar o login**, **para visualizar as funcionalidades disponíveis**.                                                                          |       Alta |        |
| **RF04**      | **O Agente de Acessibilidade** deve cadastrar discentes **por meio de um formulário de cadastro**, **para registrar os discentes no sistema**.                                                                     |       Alta |        |
| **RF05**      | **O Agente de Acessibilidade** deve visualizar as informações de um discente **por meio da consulta ao seu cadastro**, **para obter informações sobre o discente**.                                                |      Média |        |
| **RF06**      | **O Agente de Acessibilidade** deve editar as informações de um discente **por meio da funcionalidade de edição**, **para manter seus dados atualizados**.                                                         |      Média |        |
| **RF07**      | **O Agente de Acessibilidade** deve visualizar os relatórios **por meio da listagem e consulta dos registros**, **para acompanhar as informações relacionadas aos discentes**.                                     |      Média |        |
| **RF08**      | **O Agente de Acessibilidade** deve adicionar relatórios **por meio de um formulário de registro**, **para documentar informações relacionadas ao acompanhamento dos discentes**.                                  |       Alta |        |
| **RF09**      | **O Agente de Acessibilidade** deve editar relatórios **por meio da funcionalidade de edição**, **para corrigir ou atualizar informações registradas**.                                                            |      Média |        |
| **RF10**      | **O Agente de Acessibilidade** deve cancelar ou desativar relatórios **por meio da funcionalidade de gerenciamento dos registros**, **para impedir que relatórios inválidos ou não aplicáveis permaneçam ativos**. |      Média |        |
| **RF11**      | **O Agente de Acessibilidade** deve visualizar os usuários cadastrados **por meio da listagem de usuários**, **para consultar os usuários registrados no sistema**.                                                |      Média |        |
| **RF12**      | **O Agente de Acessibilidade** deve cadastrar usuários **por meio de um formulário de cadastro**, **para conceder acesso ao sistema a novos usuários**.                                                            |       Alta |        |
| **RF13**      | **O Agente de Acessibilidade** deve editar as informações dos usuários **por meio da funcionalidade de edição**, **para manter seus dados atualizados**.                                                           |      Média |        |
| **RF14**      | **O Agente de Acessibilidade** deve visualizar seu próprio perfil **por meio da área de perfil**, **para consultar seus dados cadastrados e informações de acesso**.                                               |      Média |        |
| **RF15**      | **O Agente de Acessibilidade** deve alterar seu e-mail **por meio da área de gerenciamento do perfil**, **para manter seu endereço de e-mail atualizado**.                                                         |      Baixa |        |
| **RF16**      | **O Agente de Acessibilidade** deve alterar sua senha **por meio da área de gerenciamento do perfil**, **para manter a segurança de suas credenciais de acesso**.                                                  |      Baixa |        |
| **RF17**      | **O Agente de Acessibilidade** deve registrar atendimentos e contribuições **por meio de um formulário de registro**, **para documentar as ações realizadas no acompanhamento dos discentes**.                     |       Alta |        |
| **RF18**      | **O Agente de Acessibilidade** deve consultar o histórico de acompanhamento de um discente **por meio da área de histórico**, **para acompanhar os registros realizados durante seu atendimento**.                 |       Alta |        |
| **RF19**      | **O Agente de Acessibilidade** deve registrar o Termo de Ciência **por meio da funcionalidade de registro do documento**, **para documentar a ciência do discente**.                                               |       Alta |        |
| **RF20**      | **O Agente de Acessibilidade** deve classificar as demandas dos discentes **por meio da seleção de categorias de acessibilidade**, **para organizar e identificar suas necessidades de acessibilidade**.           |      Média |        |
| **RF21**      | **O sistema** deve registrar as operações realizadas pelo **Agente de Acessibilidade** **por meio de um histórico de auditoria**, **para possibilitar o rastreamento das ações executadas**.                       |       Alta |        |
| **RF22**      | **O Agente de Acessibilidade** deve filtrar as listagens de discentes, relatórios e usuários **por meio de critérios de busca e filtragem**, **para localizar registros específicos com maior facilidade**.        |      Média |        |

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
* Consulta de informações protegidas;
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

### Relacionamentos principais

* Um perfil pode criar vários relatórios;
* Um perfil pode registrar várias contribuições;
* Um perfil pode registrar vários Termos de Ciência;
* Um perfil pode possuir vários registros no histórico;
* Um discente pode possuir vários relatórios;
* Um discente pode possuir vários Termos de Ciência;
* Um relatório pode possuir várias contribuições;
* Um relatório pode possuir várias categorias;
* Uma categoria pode estar relacionada a vários relatórios.


---

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

## Execução do projeto

Atualmente, a interface de login está disponível no diretório `frontend/`. Ela utiliza React com Vite e simula a autenticação localmente até a integração com FastAPI e Supabase Auth.

### Pré-requisito

* Node.js `16.20.2`;
* npm, instalado junto com o Node.js.

```bash
# Acesse o front-end
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Gere o build de producao
npm run build
```

O Vite informará no terminal o endereço local para acessar a aplicação durante o desenvolvimento.

### Credenciais de demonstração

Enquanto a integração com o back-end não estiver disponível, o login é apenas uma simulação no navegador. Use as credenciais abaixo para acessar a tela temporária `IN PROGRESS`:

| Campo | Valor |
| ----- | ----- |
| E-mail | `teste@sia.ufc.br` |
| Senha | `teste@123` |

Qualquer outra combinação de credenciais apresentará a mensagem de erro da tela de login. Essas credenciais não são reais e serão removidas quando o Supabase Auth for integrado.


