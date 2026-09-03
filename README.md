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
* Kesia Rocha
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

Quando for necessária uma articulação com professores ou outros setores da instituição, o Agente de Acessibilidade poderá registrar as orientações e os encaminhamentos realizados. Entretanto, professores, turmas e disciplinas não serão cadastrados como entidades do sistema nesta versão.

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

| Identificador | Descrição                                                                                         | Prioridade | Dependência                  |
| ------------- | ------------------------------------------------------------------------------------------------- | ---------: | ---------------------------- |
| RF01          | O sistema deve permitir a navegação por meio de um menu.                                          |       Alta | RF04                         |
| RF02          | O sistema deve permitir que usuários autorizados realizem login.                                  |       Alta | RF13                         |
| RF03          | O sistema deve permitir a recuperação de senha.                                                   |       Alta | RF02                         |
| RF04          | O sistema deve permitir o acesso à tela inicial.                                                  |       Alta | RF13                         |
| RF05          | O sistema deve permitir o cadastro de discentes.                                                  |       Alta | RF04                         |
| RF06          | O sistema deve permitir a visualização das informações de um discente.                            |      Média | RF05                         |
| RF07          | O sistema deve permitir a edição das informações de um discente.                                  |      Média | RF05                         |
| RF08          | O sistema deve permitir a visualização de relatórios.                                             |      Média | RF09                         |
| RF09          | O sistema deve permitir adicionar relatórios.                                                     |       Alta | RF04                         |
| RF10          | O sistema deve permitir editar relatórios.                                                        |      Média | RF09                         |
| RF11          | O sistema deve permitir cancelar ou desativar relatórios.                                         |      Média | RF09                         |
| RF12          | O sistema deve permitir visualizar os usuários cadastrados.                                       |      Média | RF13                         |
| RF13          | O sistema deve permitir o cadastro de usuários.                                                   |       Alta | —                            |
| RF14          | O sistema deve permitir editar as informações dos usuários.                                       |      Média | RF13                         |
| RF15          | O sistema deve permitir que o usuário visualize o próprio perfil.                                 |      Média | RF04                         |
| RF16          | O sistema deve permitir a alteração do e-mail.                                                    |      Baixa | RF14                         |
| RF17          | O sistema deve permitir a alteração da senha.                                                     |      Baixa | RF14                         |
| RF18          | O sistema deve permitir o registro de atendimentos e contribuições.                               |       Alta | RF05                         |
| RF19          | O sistema deve permitir a consulta do histórico de acompanhamento do discente.                    |       Alta | RF05, RF18                   |
| RF20          | O sistema deve permitir o registro do Termo de Ciência.                                           |       Alta | RF05                         |
| RF21          | O sistema deve permitir a classificação das demandas por categorias de acessibilidade.            |      Média | RF09                         |
| RF22          | O sistema deve manter um histórico auditável das operações realizadas.                            |       Alta | RF05, RF07, RF10, RF11, RF14 |
| RF23          | O sistema deve permitir a aplicação de filtros nas listagens de discentes, relatórios e usuários. |      Média | RF06, RF08, RF12             |

---

## Regras de negócio

### RN01 — Auditoria

Os dados do sistema deverão ser auditáveis. Deve ser possível identificar:

* O usuário responsável pela operação;
* A data e o horário da operação;
* A entidade alterada;
* O registro afetado;
* O tipo de operação realizada;
* A origem e a autoria das informações.

### RN02 — Minimização de dados sensíveis

O sistema não deverá coletar informações clínicas que não sejam necessárias ao acompanhamento acadêmico.

Não deverão ser armazenados:

* Diagnósticos;
* Histórico médico;
* Descrições detalhadas de sintomas;
* Laudos médicos genéricos;
* Informações pessoais excessivas;
* Relatos clínicos extensos.

O sistema deverá registrar somente as informações necessárias para compreender a demanda acadêmica e definir ações de acessibilidade.

### RN03 — Exclusão lógica

Usuários e discentes não deverão ser excluídos definitivamente do banco de dados.

Os registros deverão ser:

* Editados;
* Ativados;
* Desativados;
* Arquivados, quando aplicável.

O cancelamento ou a desativação deverá preservar o histórico necessário para auditoria.

### RN04 — Acessibilidade da plataforma

A interface deverá ser acessível para pessoas com diferentes necessidades, deficiências ou limitações temporárias.

### RN05 — Controle de acesso

Somente usuários autorizados poderão consultar informações relacionadas aos estudantes e seus acompanhamentos.

### RN06 — Finalidade acadêmica

As informações armazenadas deverão ser utilizadas exclusivamente para o acompanhamento das demandas de inclusão e acessibilidade acadêmica.

### RN07 — Termo de Ciência

O Termo de Ciência deverá registrar:

* O estudante relacionado;
* O usuário responsável pelo registro;
* A versão do termo;
* A data de ciência;
* A forma de aceite;
* O status do termo.

### RN08 — Histórico de alterações

Alterações relevantes deverão gerar registros no histórico de auditoria. As informações anteriores não deverão ser substituídas sem que seja possível identificar a modificação realizada.

---

## Requisitos não funcionais

| Identificador | Descrição                                                                                                             | Categoria                  | Prioridade |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------: |
| RNF01         | Somente Agentes e membros autorizados da Coordenação de Acessibilidade poderão acessar as informações dos estudantes. | Segurança                  |       Alta |
| RNF02         | A interface deverá possuir hierarquia visual intuitiva e navegação prática.                                           | Usabilidade                |       Alta |
| RNF03         | Imagens, ícones e elementos visuais deverão possuir descrições e alternativas acessíveis.                             | Usabilidade/Acessibilidade |       Alta |
| RNF04         | O sistema deverá permanecer disponível durante o horário de funcionamento definido pela instituição.                  | Disponibilidade            |       Alta |
| RNF05         | O código deverá ser modularizado, organizado e documentado.                                                           | Manutenibilidade           |       Alta |
| RNF06         | As principais interações deverão apresentar tempo de resposta de até dois segundos em condições normais de operação.  | Desempenho                 |       Alta |
| RNF07         | O sistema deverá funcionar nos principais navegadores, incluindo Chrome, Edge e Firefox.                              | Portabilidade              |      Média |
| RNF08         | O sistema deverá proteger senhas utilizando funções seguras de hash.                                                  | Segurança                  |       Alta |
| RNF09         | O sistema deverá proteger as informações durante o armazenamento e a transmissão.                                     | Segurança                  |       Alta |
| RNF10         | O sistema deverá seguir os princípios de minimização, finalidade e controle de acesso previstos na LGPD.              | Privacidade                |       Alta |
| RNF11         | O sistema deverá apresentar mensagens de erro compreensíveis e não deverá revelar informações internas ou sensíveis.  | Segurança/Usabilidade      |      Média |
| RNF12         | A interface deverá possibilitar a navegação por teclado e oferecer compatibilidade com tecnologias assistivas.        | Acessibilidade             |       Alta |

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
| Front-end          | ______________________________ |
| Back-end           | ______________________________ |
| Banco de dados     | ______________________________ |
| Autenticação       | ______________________________ |
| Hospedagem         | ______________________________ |
| Prototipação       | ______________________________ |
| Controle de versão | ______________________________ |


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

A estrutura poderá ser modificada depois que a stack tecnológica for definida.

---

## Execução do projeto

As instruções de instalação e execução serão adicionadas após a definição das tecnologias utilizadas.

```bash
# Comandos de instalação:
______________________________________________

# Configuração das variáveis de ambiente:
______________________________________________

# Execução do back-end:
______________________________________________

# Execução do front-end:
______________________________________________

# Execução dos testes:
______________________________________________
```

---

## Licença

A licença e as regras de utilização do projeto ainda serão definidas pela equipe e pela instituição responsável.
