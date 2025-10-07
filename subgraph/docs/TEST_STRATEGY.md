# Estratégia de Testes - Subgraph

**Status:** Proposto

## 1. Visão Geral

Testar a lógica de um subgraph é crucial para garantir a integridade e a correção dos dados servidos pela API GraphQL. Nossa estratégia de teste se divide em duas categorias principais: Testes Unitários para a lógica de mapeamento e Testes de Integração para o fluxo de ponta a ponta.

## 2. Testes Unitários com `matchstick-as`

Os testes unitários são a primeira linha de defesa e focam em validar a lógica de cada função de `handler` isoladamente.

-   **Ferramenta:** Utilizaremos a biblioteca `matchstick-as`, o padrão da comunidade The Graph para testes de mapeamentos em AssemblyScript.
-   **Localização:** Os arquivos de teste residirão no diretório `subgraph/tests/`.
-   **Comando:** `graph test`

### Fluxo de Trabalho para Testes Unitários

Para cada função de handler (ex: `handleVaultCreated`), o teste seguirá os seguintes passos:

1.  **Arrange (Preparação):**
    -   Criar um evento mock (ex: `newVaultCreatedEvent`) com parâmetros de exemplo.
    -   Usar as funções do `matchstick-as` para simular o estado da "store" antes do evento, se necessário (ex: verificar se uma entidade `User` já existe).

2.  **Act (Ação):**
    -   Chamar a função de handler com o evento mock como argumento (ex: `handleVaultCreated(event)`).

3.  **Assert (Verificação):**
    -   Usar as funções de asserção do `matchstick-as` para verificar o estado da "store" após a execução do handler.
    -   Verificar se uma entidade foi criada (`assert.entityCount("Vault", 1)`).
    -   Verificar se os campos da entidade foram preenchidos corretamente (`assert.fieldEquals("Vault", "0x...", "owner", "0x...")`).
    -   Verificar se uma entidade foi atualizada ou removida.

### Cobertura

-   Cada função de handler no diretório `src/` deve ter seu próprio arquivo de teste correspondente em `tests/`.
-   Devemos testar tanto os "caminhos felizes" quanto os casos de esquina (ex: um evento que cria uma entidade vs. um que atualiza uma já existente).

## 3. Testes de Integração

Os testes de integração validam o sistema completo, desde a emissão do evento na blockchain até a consulta do dado via GraphQL.

-   **Ambiente:** Utilizaremos o ambiente `docker-compose` do projeto, que deve ser estendido para incluir um `graph-node`, `ipfs-node` e `postgres` para o subgraph.
-   **Processo:**
    1.  **Deploy Local:** Iniciar o ambiente Docker. Os contratos são implantados no Anvil. O Subgraph é compilado e implantado no `graph-node` local.
    2.  **Geração de Eventos:** Executar um script (ex: um teste Jest ou um script `ts-node`) que interage com os contratos no Anvil para emitir os eventos que queremos testar (criar um vault, depositar colateral, etc.).
    3.  **Sincronização:** Aguardar um breve período para que o `graph-node` detecte os novos blocos e execute os handlers de mapeamento.
    4.  **Validação:** Enviar uma query GraphQL para o endpoint do `graph-node` local (`http://localhost:8000/subgraphs/name/scc/scc-protocol`).
    5.  **Asserção:** Verificar se a resposta da query GraphQL contém os dados esperados, confirmando que o evento foi processado e armazenado corretamente.

Esta abordagem garante que o `subgraph.yaml`, o `schema.graphql` e os mapeamentos funcionam corretamente em conjunto.
