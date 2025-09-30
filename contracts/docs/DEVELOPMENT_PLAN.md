# Plano de Desenvolvimento - Contratos SCC

Este documento rastreia o progresso do desenvolvimento dos smart contracts do protocolo SCC. As tarefas serão marcadas com `[x]` quando concluídas.

## Milestone 1: Configuração do Projeto e Contratos Core

**Status:** Concluído

- [x] **Tarefa 1.1:** Inicializar Projeto Foundry no diretório `/contracts`.
- [x] **Tarefa 1.2:** Instalar dependências (OpenZeppelin) via `forge install`.
- [x] **Tarefa 1.3:** Criar o esqueleto do contrato `SCC_USD.sol` (ERC20) em `src/tokens/`.
- [x] **Tarefa 1.4:** Criar o esqueleto do contrato `SCC_GOV.sol` (ERC20) em `src/tokens/`.
- [x] **Tarefa 1.5:** Criar testes iniciais de deploy e configuração para os tokens em `test/tokens/`.

## Milestone 2: Lógica Principal do Vault

**Status:** Concluído

- [x] **Tarefa 2.1:** Criar o esqueleto do contrato `Vault.sol` (ERC721) em `src/`.
- [x] **Tarefa 2.2:** Implementar a lógica de depósito e retirada de colateral.
- [x] **Tarefa 2.3:** Implementar a lógica de `mint` de SCC-USD (criação de dívida).
- [x] **Tarefa 2.4:** Implementar a lógica de `burn` (pagamento de dívida).
- [x] **Tarefa 2.5:** Adicionar testes de integração para as funções do Vault.

## Milestone 3: Fábrica de Vaults e Lógica de Liquidação

**Status:** Concluído

- [x] **Tarefa 3.1:** Criar o contrato `VaultFactory.sol`.
- [x] **Tarefa 3.2:** Implementar a função `createNewVault` na fábrica.
- [x] **Tarefa 3.3:** Criar o contrato `LiquidationManager.sol`.
- [x] **Tarefa 3.4:** Refatorar `LiquidationManager` para usar Leilões Holandeses (Dutch Auctions).
    - [x] *Fase 1: Implementar verificação de saúde e a função `startAuction`.*
    - [x] *Fase 2: Implementar lógica de decaimento de preço em `getCurrentPrice`.*
    - [x] *Fase 3: Implementar a função de compra atômica `buy`, substituindo `bid` e `claim`.*
- [x] **Tarefa 3.5:** Adicionar testes de integração.
    - [x] *Testes da fábrica concluídos.*
    - [x] *Testes da verificação de liquidação concluídos.*
    - [x] *Testes para o novo sistema de Leilão Holandês concluídos.*

## Milestone 4: Governança On-Chain

**Status:** Concluído

- [x] **Tarefa 4.1:** Criar documentação para o Mecanismo de Governança.
- [x] **Tarefa 4.2:** Atualizar `SCC_GOV.sol` para suportar votação (ERC20Votes).
- [x] **Tarefa 4.3:** Criar o contrato `SCC_Governor.sol`.
- [x] **Tarefa 4.4:** Implementar o `TimelockController` e o script de deploy da governança.
- [x] **Tarefa 4.5:** Adicionar testes de integração para o ciclo de vida de uma proposta de governança.

---
*Este documento será atualizado conforme as tarefas são concluídas.*