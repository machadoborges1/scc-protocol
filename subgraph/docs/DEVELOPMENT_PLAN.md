# Plano de Desenvolvimento - Subgraph

**Status:** Em Andamento

Este documento descreve o plano de desenvolvimento em etapas para a implementação do Subgraph do protocolo SCC.

## Milestone 1: Estrutura do Projeto e Indexação de Vaults

**Objetivo:** Ter um subgraph funcional que possa rastrear a criação e o estado básico de todos os Vaults.

-   [x] **Tarefa 1.1:** Inicializar o projeto do Subgraph (`package.json`, `tsconfig.json`).
-   [x] **Tarefa 1.2:** Definir o `schema.graphql` inicial com as entidades `Protocol`, `User`, `Token` e `Vault`.
-   [x] **Tarefa 1.3:** Configurar o `subgraph.yaml` com o data source `VaultFactory` e um `template` para os `Vaults`.
-   [x] **Tarefa 1.4:** Implementar o handler `handleVaultCreated` em `src/vault-factory.ts` para criar as entidades `Vault` e `User`, e instanciar o template dinâmico.
-   [ ] **Tarefa 1.5:** Implementar os handlers do template `Vault` (`handleDepositCollateral`, `handleWithdrawCollateral`, `handleMint`, `handleBurn`) em `src/vault.ts` para atualizar o estado do `Vault`.
-   [ ] **Tarefa 1.6:** Escrever testes unitários para os handlers do Milestone 1.

## Milestone 2: Indexação de Liquidações

**Objetivo:** Rastrear todo o ciclo de vida das liquidações.

-   [ ] **Tarefa 2.1:** Adicionar a entidade `LiquidationAuction` ao `schema.graphql`.
-   [ ] **Tarefa 2.2:** Adicionar o `LiquidationManager` como um data source no `subgraph.yaml`.
-   [ ] **Tarefa 2.3:** Implementar o handler `handleAuctionStarted` para criar a entidade `LiquidationAuction` e ligá-la ao `Vault` correspondente.
-   [ ] **Tarefa 2.4:** Implementar o handler `handleAuctionBought` para atualizar o estado do leilão (comprador, valor pago).
-   [ ] **Tarefa 2.5:** Implementar o handler `handleAuctionClosed` para marcar o leilão como finalizado.
-   [ ] **Tarefa 2.6:** Escrever testes unitários para os handlers de liquidação.

## Milestone 3: Indexação de Staking e Recompensas

**Objetivo:** Fornecer dados sobre staking de SCC-GOV e as recompensas distribuídas.

-   [ ] **Tarefa 3.1:** Adicionar as entidades `StakingPosition` e `RewardEvent` ao `schema.graphql`.
-   [ ] **Tarefa 3.2:** Adicionar o `StakingPool` como um data source no `subgraph.yaml`.
-   [ ] **Tarefa 3.3:** Implementar os handlers `handleStaked` e `handleUnstaked` para criar e atualizar a entidade `StakingPosition` de um usuário.
-   [ ] **Tarefa 3.4:** Implementar o handler `handleRewardPaid` para registrar os eventos de resgate de recompensas.
-   [ ] **Tarefa 3.5:** Escrever testes unitários para os handlers de staking.

## Milestone 4: Indexação de Governança

**Objetivo:** Rastrear o processo de governança on-chain.

-   [ ] **Tarefa 4.1:** Adicionar as entidades `GovernanceProposal` e `Vote` ao `schema.graphql`.
-   [ ] **Tarefa 4.2:** Adicionar o `SCC_Governor` como um data source no `subgraph.yaml`.
-   [ ] **Tarefa 4.3:** Implementar o handler `handleProposalCreated` para criar a entidade `GovernanceProposal`.
-   [ ] **Tarefa 4.4:** Implementar o handler `handleVoteCast` para criar a entidade `Vote` e atualizar os contadores na proposta.
-   [ ] **Tarefa 4.5:** Implementar handlers para os estados finais da proposta (`ProposalCanceled`, `ProposalExecuted`).
-   [ ] **Tarefa 4.6:** Escrever testes unitários para os handlers de governança.

## Milestone 5: Testes de Integração e Deploy

**Objetivo:** Garantir a robustez do Subgraph e prepará-lo para produção.

-   [ ] **Tarefa 5.1:** Configurar um ambiente de teste de integração com `docker-compose` (Anvil + Graph Node).
-   [ ] **Tarefa 5.2:** Criar scripts para realizar transações nos contratos e verificar se os dados são indexados corretamente pelo Subgraph local.
-   [ ] **Tarefa 5.3:** Documentar queries GraphQL de exemplo para os casos de uso mais comuns do frontend.
-   [ ] **Tarefa 5.4:** Preparar o `subgraph.yaml` para o deploy em uma rede de testes pública (ex: Sepolia) e, posteriormente, mainnet.
