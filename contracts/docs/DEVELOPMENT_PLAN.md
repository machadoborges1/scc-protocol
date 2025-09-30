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

**Status:** Em Andamento

- [x] **Tarefa 3.1:** Criar o contrato `VaultFactory.sol`.
- [x] **Tarefa 3.2:** Implementar a função `createNewVault` na fábrica.
- [x] **Tarefa 3.3:** Criar o contrato `LiquidationManager.sol`.
- [ ] **Tarefa 3.4:** Implementar a lógica de `liquidate` no `LiquidationManager`.
    - [x] *Fase 1: Implementar a verificação de saúde do Vault.*
    - [x] *Fase 2: Implementar o início do leilão (criação da struct e lógica inicial).*
    - [x] *Fase 3: Implementar a função de lances (`bid`).*
    - [ ] *Fase 4: Implementar a função de finalização do leilão (`claim`).*
- [ ] **Tarefa 3.5:** Adicionar testes de integração.
    - [x] *Testes da fábrica concluídos.*
    - [x] *Testes da verificação de liquidação concluídos.*
    - [x] *Testes para o sistema de lances concluídos.*

---
*Este documento será atualizado conforme as tarefas são concluídas.*
