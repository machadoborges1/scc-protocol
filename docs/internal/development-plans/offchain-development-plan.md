# Plano de Desenvolvimento - Off-chain Keeper Bot (Revisado)

Este documento rastreia o progresso do desenvolvimento dos serviços off-chain do protocolo SCC, começando pelo bot de liquidação (Keeper).

## Milestone 1: Configuração do Projeto TypeScript e Ferramentas de Qualidade

**Status:** Concluído

-   [x] **Tarefa 1.1:** Adicionar dependências de desenvolvimento.
-   [x] **Tarefa 1.2:** Adicionar dependências de produção.
-   [x] **Tarefa 1.3:** Criar e configurar o arquivo `tsconfig.json`.
-   [x] **Tarefa 1.4:** Adicionar scripts ao `package.json`.
-   [x] **Tarefa 1.5:** Configurar linter (ESLint) e formatter (Prettier).

## Milestone 2: Estrutura Principal e Conectividade

**Status:** Concluído

-   [x] **Tarefa 2.1:** Criar a estrutura de diretórios `src` e o arquivo principal `index.ts`.
-   [x] **Tarefa 2.2:** Implementar a lógica de conexão com um nó Ethereum (`rpc` e `contracts`).
-   [x] **Tarefa 2.3:** Implementar um orquestrador principal em `index.ts`.
-   [x] **Tarefa 2.4:** Adicionar um sistema de logging estruturado (`pino`).
-   [x] **Tarefa 2.5:** Implementar tratamento de erros com **backoff exponencial** para chamadas RPC.
-   [x] **Tarefa 2.6:** Adicionar lógica para desligamento gracioso (`SIGINT`/`SIGTERM`).
-   [x] **Tarefa 2.7:** Documentação de Código (JSDoc/TSDoc).
-   [x] **Tarefa 2.8:** Criar `offchain/docs/ARCHITECTURE.md`.

## Milestone 3: Monitoramento Eficiente de Vaults (Produtor/Consumidor)

**Status:** Concluído

-   [x] **Tarefa 3.1:** Implementar `vaultDiscovery.ts` para encontrar vaults via eventos `VaultCreated`.
-   [x] **Tarefa 3.2:** Implementar `vaultMonitor.ts` para ler o estado dos Vaults e calcular o CR.
-   [x] **Tarefa 3.3:** Implementar um sistema de fila (em memória ou externo) para comunicação entre `vaultDiscovery` e `vaultMonitor`.
-   [x] **Tarefa 3.4:** Implementar um cache local (em `vaultMonitor`) para estados de Vaults e preços para otimizar chamadas RPC.
-   [x] **Tarefa 3.5:** **(Avançado)** Fazer com que `vaultDiscovery` escute eventos de alteração de estado (ex: `CollateralDeposited`) para reprioritizar vaults na fila.
-   [x] **Tarefa 3.6:** Implementar a remoção de vaults inativos da lista de monitoramento (escutar por eventos como `AuctionClosed`).

## Milestone 4: Módulo de Estratégia de Liquidação (`LiquidationStrategy`)

**Status:** Concluído

-   [x] **Tarefa 4.1:** Criar o serviço `liquidationStrategy.ts`.
-   [x] **Tarefa 4.2:** Implementar a lógica para receber candidatos à liquidação do `vaultMonitor`.
-   [x] **Tarefa 4.3:** Implementar a **análise de lucratividade**, comparando o benefício da liquidação com o custo de gás estimado.
-   [x] **Tarefa 4.4:** Adicionar verificação para não liquidar `Vaults` que já possuam um leilão ativo (realizado no smart contract).
-   [x] **Tarefa 4.5:** Implementar um mecanismo de throttling ou fila para limitar o número de liquidações simultâneas enviadas ao `TransactionManager`.

## Milestone 5: Módulo de Execução de Transação (`TransactionManager`)

**Status:** Concluído

-   [x] **Tarefa 5.1:** Criar o serviço `transactionManager.ts`.
-   [x] **Tarefa 5.2:** Implementar uma interface para receber ordens de execução do `LiquidationStrategy`.
-   [x] **Tarefa 5.3:** Implementar **gerenciamento de nonce explícito** para a carteira do keeper.
-   [x] **Tarefa 5.5:** Implementar a simulação da transação (`viem` realiza por padrão).
-   [x] **Tarefa 5.4:** Implementar uma **estratégia de preço de gás dinâmica** (EIP-1559 com `maxFee perGas` e `maxPriorityFeePerGas` ajustáveis).
-   [x] **Tarefa 5.6:** Implementar o monitoramento de transações enviadas e a lógica para **substituir transações presas (stuck)** com um preço de gás maior.
-   [x] **Tarefa 5.7:** Adicionar tratamento de erros robusto e logs detalhados para cada etapa da execução.

## Milestone 6: Testes, Observabilidade e Deploy

**Status:** Concluído

-   [x] **Tarefa 6.1:** Escrever testes unitários para as funções críticas (ex: cálculo de CR, análise de lucratividade).
-   [x] **Tarefa 6.2:** Escrever e corrigir teste de integração para o fluxo completo em blockchain local (Anvil).
-   [x] **Tarefa 6.7:** Implementar arquitetura de teste de integração resiliente com Anvil e Jest.
-   [x] **Tarefa 6.3:** Configurar um endpoint de métricas (Prometheus) no `index.ts`.
-   [x] **Tarefa 6.4:** Definir e expor métricas chave para cada módulo.
-   [x] **Tarefa 6.5:** Integrar com um sistema de alerta (ex: PagerDuty, Telegram).
-   [x] **Tarefa 6.6:** Documentar o processo de deploy do bot via Docker.

## Milestone 7: Developer Experience (DX)

**Status:** Concluído

-   [x] **Tarefa 7.1:** Automatizar a configuração do ambiente de desenvolvimento local, criando um script (`prepare:env`) que gera o arquivo `.env` a partir dos artefatos de deploy, eliminando a necessidade de atualização manual de endereços.