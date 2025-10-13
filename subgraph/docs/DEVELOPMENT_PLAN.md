# Plano de Desenvolvimento - Subgraph

**Status:** Em Andamento

Este documento descreve o plano de desenvolvimento em etapas para a implementação do Subgraph do protocolo SCC.

## Milestone 1: Estrutura do Projeto e Indexação de Vaults

**Objetivo:** Ter um subgraph funcional que possa rastrear a criação e o estado básico de todos os Vaults.

-   [x] **Tarefa 1.1:** Inicializar o projeto do Subgraph (`package.json`, `tsconfig.json`).
-   [x] **Tarefa 1.2:** Definir o `schema.graphql` inicial com as entidades `Protocol`, `User`, `Token` e `Vault`.
-   [x] **Tarefa 1.3:** Configurar o `subgraph.yaml` com o data source `VaultFactory` e um `template` para os `Vaults`.
-   [x] **Tarefa 1.4:** Implementar o handler `handleVaultCreated` em `src/vault-factory.ts` para criar as entidades `Vault` e `User`, e instanciar o template dinâmico.
-   [x] **Tarefa 1.5:** Implementar os handlers do template `Vault` (`handleDepositCollateral`, `handleWithdrawCollateral`, `handleMint`, `handleBurn`) em `src/vault.ts` para atualizar o estado do `Vault`.
-   [x] **Tarefa 1.6:** Escrever testes unitários para os handlers do Milestone 1.

## Milestone 2: Indexação de Liquidações

**Objetivo:** Rastrear todo o ciclo de vida das liquidações.

-   [x] **Tarefa 2.1:** Adicionar a entidade `LiquidationAuction` ao `schema.graphql`.
-   [x] **Tarefa 2.2:** Adicionar o `LiquidationManager` como um data source no `subgraph.yaml`.
-   [x] **Tarefa 2.3:** Implementar o handler `handleAuctionStarted` para criar a entidade `LiquidationAuction` e ligá-la ao `Vault` correspondente.
-   [x] **Tarefa 2.4:** Implementar o handler `handleAuctionBought` para atualizar o estado do leilão (comprador, valor pago).
-   [x] **Tarefa 2.5:** Implementar o handler `handleAuctionClosed` para marcar o leilão como finalizado.
-   [x] **Tarefa 2.6:** Escrever testes unitários para os handlers de liquidação.

## Milestone 3: Indexação de Staking e Recompensas

**Objetivo:** Fornecer dados sobre staking de SCC-GOV e as recompensas distribuídas.

-   [x] **Tarefa 3.1:** Adicionar as entidades `StakingPosition` e `RewardEvent` ao `schema.graphql`.
-   [x] **Tarefa 3.2:** Adicionar o `StakingPool` como um data source no `subgraph.yaml`.
-   [x] **Tarefa 3.3:** Implementar os handlers `handleStaked` e `handleUnstaked` para criar e atualizar a entidade `StakingPosition` de um usuário.
-   [x] **Tarefa 3.4:** Implementar o handler `handleRewardPaid` para registrar os eventos de resgate de recompensas.
- [x] **Tarefa 3.5:** Escrever testes unitários para os handlers de staking.

## Milestone 4: Indexação de Governança

**Objetivo:** Rastrear o processo de governança on-chain.

- [x] **Tarefa 4.1:** Adicionar as entidades `GovernanceProposal` e `Vote` ao `schema.graphql`.
- [x] **Tarefa 4.2:** Adicionar o `SCC_Governor` como um data source no `subgraph.yaml`.
- [x] **Tarefa 4.3:** Implementar o handler `handleProposalCreated` para criar a entidade `GovernanceProposal`.
- [x] **Tarefa 4.4:** Implementar o handler `handleVoteCast` para criar a entidade `Vote` e atualizar os contadores na proposta.
- [x] **Tarefa 4.5:** Implementar handlers para os estados finais da proposta (`ProposalCanceled`, `ProposalExecuted`).
- [x] **Tarefa 4.6:** Escrever testes unitários para os handlers de governança.

## Milestone 5: Testes de Integração e Deploy

**Objetivo:** Garantir a robustez do Subgraph e prepará-lo para produção.

-   [x] **Tarefa 5.1:** Configurar o ambiente de teste de integração local.
    -   [x] Adicionar os serviços `graph-node`, `ipfs` e `postgres` ao `docker-compose.yml` principal do projeto.
    -   [x] Garantir que os serviços se comuniquem corretamente com a rede Anvil.
-   [x] **Tarefa 5.2:** Automatizar a configuração de endereços do `subgraph.yaml`.
    -   [x] Criar um arquivo `subgraph.template.yaml` que use placeholders para endereços de contrato e bloco de deploy.
    -   [x] Criar um script (e.g., `prepare-subgraph.js`) que leia os artefatos de deploy do Hardhat/Foundry (`run-latest.json`) e gere o `subgraph.yaml` final.
    -   [x] Adicionar um comando `npm run prepare:subgraph` no `package.json` para executar o script.
-   [x] **Tarefa 5.3:** Implementar os testes de integração.
    -   [x] Configurar um runner de testes (e.g., Jest) para orquestrar os testes.
    -   [x] Escrever scripts de teste que:
        1.  Deployem os contratos na rede Anvil.
        2.  Executem o script `prepare:subgraph`.
        3.  Deployem o subgraph no `graph-node` local.
        4.  Realizem transações on-chain (e.g., criar um vault, depositar colateral).
        5.  Façam queries na API GraphQL do `graph-node` para validar se os dados foram indexados corretamente.
-   [x] **Tarefa 5.4:** Documentar o fluxo de trabalho de teste e deploy local.
-   [ ] **Tarefa 5.5:** Preparar para o deploy em Testnet (e.g., Sepolia).
-   [ ] **Tarefa 5.6:** Deploy em Mainnet.
