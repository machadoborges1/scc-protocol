# Arquitetura do Keeper Bot Off-chain

**Status:** Em Desenvolvimento

## 1. Introdução

Este documento descreve a arquitetura do Keeper Bot, um serviço off-chain essencial para a manutenção e solvência do protocolo SCC. A principal responsabilidade deste bot é monitorar a saúde de todos os `Vaults` e iniciar leilões de liquidação para aqueles que se tornarem sub-colateralizados, garantindo que a stablecoin SCC-USD permaneça sempre super-colateralizada.

## 2. Visão Geral da Arquitetura

O Keeper Bot será uma aplicação Node.js escrita em TypeScript, utilizando uma arquitetura modular para separar as responsabilidades e facilitar a manutenção e os testes. O bot operará em um loop principal, executando sua lógica de monitoramento e liquidação em intervalos de tempo definidos.

As tecnologias principais incluem:
-   **Runtime:** Node.js
-   **Linguagem:** TypeScript
-   **Interação com Blockchain:** `viem` (para RPC, ABIs, simulação, etc.)
-   **Logging:** `pino` (para logs estruturados e performáticos)
-   **Configuração:** `dotenv` (para gerenciar variáveis de ambiente)

## 3. Componentes Principais

A lógica do bot será dividida nos seguintes módulos:

### 3.1. Engine (Motor Principal)

-   **Responsabilidade:** Orquestrar o fluxo de trabalho do bot.
-   **Implementação:** Será o ponto de entrada da aplicação (`src/index.ts`). Conterá o loop principal (ex: `setInterval`) que, a cada ciclo, acionará os outros componentes na ordem correta. Também será responsável por um desligamento gracioso (`graceful shutdown`), garantindo que operações em andamento não sejam interrompidas abruptamente.

### 3.2. Blockchain Connector

-   **Responsabilidade:** Abstrair toda a comunicação com o nó Ethereum.
-   **Implementação:** Criará e gerenciará o cliente `viem`. Será responsável por:
    -   Manter a conexão com o RPC (lido de variáveis de ambiente).
    -   Implementar um mecanismo de retry com backoff para chamadas RPC que falharem.
    -   Gerenciar o `nonce` da carteira do Keeper para evitar erros de transação.
    -   Abstrair o envio de transações, incluindo a simulação (`simulateContract`) antes do envio real.
    -   Carregar e fornecer as ABIs dos contratos para os outros serviços.

### 3.3. Logger

-   **Responsabilidade:** Fornecer um sistema de logging estruturado.
-   **Implementação:** Uma instância configurada do `pino` que será injetada nos outros componentes. Os logs terão diferentes níveis (info, warn, error) e formato JSON para fácil integração com sistemas de monitoramento em produção.

### 3.4. Vault Monitor

-   **Responsabilidade:** Descobrir, rastrear e avaliar a saúde de todos os `Vaults`.
-   **Implementação:**
    1.  Usará o `Blockchain Connector` para buscar eventos `VaultCreated` do `VaultFactory` e descobrir todos os `Vaults` existentes.
    2.  Periodicamente, usará `viem.multicall` para buscar o estado (colateral e dívida) de todos os `Vaults` de forma eficiente em uma única chamada RPC.
    3.  Para cada `Vault`, calculará seu índice de colateralização (CR), buscando o preço do ativo no `OracleManager`.
    4.  Manterá uma lista de `Vaults` que estão abaixo do `MIN_COLLATERALIZATION_RATIO`, prontos para liquidação.

### 3.5. Liquidation Agent

-   **Responsabilidade:** Executar a lógica de liquidação.
-   **Implementação:**
    1.  Receberá a lista de `Vaults` não saudáveis do `Vault Monitor`.
    2.  Para cada `Vault`, usará o `Blockchain Connector` para primeiro **simular** a chamada à função `startAuction` no `LiquidationManager`.
    3.  Se a simulação for bem-sucedida, ele construirá e enviará a transação real, assinando-a com a chave privada do Keeper.
    4.  Registrará (via `Logger`) o sucesso ou a falha de cada tentativa de liquidação.

## 4. Fluxo de Dados (Ciclo de Execução)

A cada `N` segundos, o **Engine** iniciará o seguinte fluxo:

1.  **`Vault Monitor`**: "Quais são todos os `Vaults` e qual o status de cada um?"
    -   Busca os `Vaults` via eventos ou cache.
    -   Busca o estado (colateral/dívida) de todos os `Vaults` via `multicall`.
    -   Busca os preços dos colaterais no `OracleManager`.
    -   Calcula o CR de cada `Vault`.
    -   Retorna uma lista de `Vaults` que precisam ser liquidados.
2.  **`Liquidation Agent`**: "Recebi uma lista de `Vaults` para liquidar."
    -   Para cada `Vault` na lista:
        -   Simula a transação `startAuction`.
        -   Se a simulação passar, envia a transação real.
        -   Loga o resultado (hash da transação ou erro).
3.  **`Engine`**: "Ciclo concluído." Aguarda o próximo intervalo.

## 5. Gerenciamento de Configuração e Chaves

-   **Configuração:** Parâmetros como `RPC_URL`, intervalo do loop e endereços de contratos serão gerenciados através de um arquivo `.env`.
-   **Chaves Privadas:** Para desenvolvimento, a `PRIVATE_KEY` do Keeper será lida do `.env`. Em produção, este mecanismo **deve** ser substituído por um sistema seguro como **AWS Secrets Manager** ou **HashiCorp Vault**.

## 6. Estratégia de Testes

-   **Testes Unitários:** Cada componente (`Vault Monitor`, `Liquidation Agent`, etc.) terá testes unitários para sua lógica interna, usando mocks para as dependências.
-   **Testes de Integração:** Será criada uma suíte de testes que rodará o bot contra uma instância local do Anvil para validar o fluxo completo de ponta a ponta em um ambiente controlado.
