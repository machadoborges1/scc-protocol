# 1. Ambiente de Desenvolvimento

Este documento detalha a configuração do ambiente de desenvolvimento para o Protocolo SCC, utilizando `pnpm workspaces` para gerenciar o monorepo e `Docker Compose` para orquestrar um ambiente local consistente e isolado. O objetivo é fornecer um guia completo para configurar, iniciar e interagir com todos os componentes do protocolo em um ambiente de desenvolvimento.

## 1.1. Pré-requisitos

Antes de iniciar, certifique-se de ter as seguintes ferramentas instaladas:

1.  **Git:** Para controle de versão.
2.  **Foundry:** Para desenvolvimento e teste de smart contracts (inclui `forge`, `anvil`, `cast`).
3.  **pnpm:** Para gerenciamento de dependências dos pacotes JavaScript/TypeScript.
4.  **Docker & Docker Compose:** Para orquestrar e rodar o ambiente de desenvolvimento local.

## 1.2. Estrutura do Ambiente Local (Docker Compose)

O ambiente de desenvolvimento é orquestrado via `docker-compose.yml` e consiste nos seguintes serviços:

*   **`anvil`:** Um nó de blockchain local extremamente rápido (parte do Foundry), simulando a rede Ethereum para testes e depuração. Acessível via RPC em `http://localhost:8545`.
*   **`keeper`:** O container Docker que executa o serviço off-chain (bot liquidador). Ele monitora a blockchain e interage com os smart contracts, conectando-se ao `anvil` via `http://anvil:8545`.
*   **`postgres`:** Banco de dados para o Subgraph.
*   **`ipfs`:** Nó IPFS para hospedar metadados do Subgraph.
*   **`graph-node`:** O indexador que sincroniza com a blockchain e expõe a API GraphQL.
*   **`prometheus`:** Para coleta de métricas dos serviços.

## 1.3. Comandos Essenciais

Todos os comandos devem ser executados a partir da raiz do projeto (`/home/humberto/Projects/scc-protocol`).

### 1.3.1. Gerenciamento do Ambiente Docker

*   **Iniciar todo o ambiente (em background):**
    ```bash
    docker compose up -d
    ```
*   **Parar todo o ambiente:**
    ```bash
    docker compose down
    ```
*   **Parar e remover todos os dados (para um reinício limpo):**
    ```bash
    docker compose down -v
    ```
*   **Ver os logs de um serviço (ex: `keeper`):**
    ```bash
    docker compose logs -f keeper
    ```

### 1.3.2. Gerenciamento de Dependências (pnpm)

*   **Instalar todas as dependências do monorepo:**
    ```bash
    pnpm install
    ```
*   **Adicionar uma dependência a um pacote específico (ex: `ethers` ao `offchain`):**
    ```bash
    pnpm --filter @scc/offchain add ethers
    ```

### 1.3.3. Testes e Verificação

*   **Verificar e Testar o Ambiente (integração completa):**
    ```bash
    pnpm test:integration
    ```
    Este comando aguarda a inicialização dos serviços, implanta os contratos na rede Anvil, prepara e implanta o subgraph, e executa os testes de integração do subgraph. Um sucesso indica que todo o ambiente está configurado e funcionando.
*   **Testar apenas os contratos:**
    ```bash
    pnpm contracts:test
    ```
*   **Testar apenas os mapeamentos do subgraph (unitários):**
    ```bash
    pnpm test:subgraph
    ```

### 1.3.4. Acessando os Serviços

Com o ambiente no ar, você pode acessar os principais serviços:

*   **GraphQL (Subgraph):** `http://localhost:8000/subgraphs/name/scc/scc-protocol`
*   **Blockchain RPC (Anvil):** `http://localhost:8545`
*   **Prometheus (Métricas):** `http://localhost:9090`

## 1.4. Script de Configuração de Exemplo (`configurar_protocolo.sh`)

O script `configurar_protocolo.sh` demonstra um fluxo de configuração e interação com o protocolo em um ambiente local. Ele realiza as seguintes etapas:

1.  **Lê Endereços do Deploy:** Extrai os endereços dos contratos `VaultFactory` e `WETH` (MockERC20) do arquivo de artefato de deploy.
2.  **Cria Novo Vault:** Utiliza `cast send` para chamar a função `createNewVault()` no `VaultFactory`, criando um novo `Vault` para o usuário.
3.  **Obtém Endereço do Novo Vault:** Extrai o endereço do `Vault` recém-criado a partir dos logs da transação.
4.  **Minta WETH:** Minta uma quantidade de WETH para o endereço do proprietário do `Vault`.
5.  **Aprova WETH:** Aprova o `Vault` para gastar uma quantidade de WETH como colateral.
6.  **Deposita Colateral:** Chama `depositCollateral()` no `Vault` para depositar WETH.
7.  **Gera Dívida:** Chama `mint()` no `Vault` para gerar `SCC-USD` como dívida.
8.  **Verifica Dados do Vault:** Consulta o `Vault` para exibir a quantidade de colateral e dívida.

Este script é uma ferramenta útil para rapidamente configurar um cenário de teste e verificar a funcionalidade básica do protocolo após o deploy local.
