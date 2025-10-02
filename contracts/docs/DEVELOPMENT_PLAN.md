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

## Milestone 5: Staking Pool e Compartilhamento de Receita

**Status:** Concluído

- [x] **Tarefa 5.1:** Documentação do Mecanismo de Staking.
    - Criar `contracts/docs/STAKING_MECHANISM.md` detalhando a lógica de stake, unstake e distribuição de recompensas.
- [x] **Tarefa 5.2:** Implementação do Contrato `StakingPool.sol`.
    - Criar e implementar o contrato `src/StakingPool.sol` com as funcionalidades de stake, unstake, depósito de recompensas e resgate de recompensas.
- [x] **Tarefa 5.3:** Adicionar Testes Abrangentes para a Lógica de Recompensas.
    - Escrever testes unitários e de integração para todas as funcionalidades de cálculo, depósito e resgate de recompensas do `StakingPool`.
- [x] **Tarefa 5.4:** Integração com Governança.
    - Configurar o `StakingPool` para ser de propriedade do `TimelockController` e permitir a gestão de parâmetros via governança.

## Milestone 6: Oracle Manager

**Status:** Concluído

- [x] **Tarefa 6.1:** Documentação do Oracle Manager.
    - Criar `contracts/docs/ORACLE_MANAGER.md` detalhando a arquitetura, fontes de dados (Chainlink), e mecanismos de fallback.
- [x] **Tarefa 6.2:** Esqueleto do Contrato `OracleManager.sol`.
    - Criar o arquivo `src/OracleManager.sol` com interfaces básicas e variáveis de estado.
- [x] **Tarefa 6.3:** Integração com Chainlink Price Feeds.
    - Implementar funções para buscar preços de ativos de colateral usando oráculos Chainlink.
- [x] **Tarefa 6.4:** Gerenciamento de Feeds de Preço.
    - Implementar funções para adicionar, remover e atualizar endereços de feeds de preço (ex: `setPriceFeed`).
- [x] **Tarefa 6.5:** Controle de Acesso.
    - Garantir que apenas contratos autorizados (ex: `Vault`, `LiquidationManager`) possam consultar preços.
- [x] **Tarefa 6.6:** Adicionar Testes Abrangentes.
    - Escrever testes unitários e de integração para todas as funcionalidades do `OracleManager`, incluindo a busca de preços e o gerenciamento de feeds.
- [x] **Tarefa 6.7:** Integração com Governança.
    - Configurar o `OracleManager` para ser de propriedade do `TimelockController` e permitir a gestão de parâmetros via governança.

---
*Este documento será atualizado conforme as tarefas são concluídas.*

## Milestone 7: Integração Final do Oracle e Refatoração

**Status:** Concluído

- [x] **Tarefa 7.1:** Refatorar `Vault.sol` e `LiquidationManager.sol` para usar `OracleManager` em vez de `MockOracle`.
- [x] **Tarefa 7.2:** Atualizar construtores e a `VaultFactory.sol` para injetar a dependência do `OracleManager`.
- [x] **Tarefa 7.3:** Atualizar os conjuntos de testes (`Vault.t.sol`, `LiquidationManager.t.sol`, `VaultFactory.t.sol`) para refletir a nova arquitetura com `OracleManager`.
- [x] **Tarefa 7.4:** Executar todos os testes e garantir que 100% da suíte passe.

## Milestone 8: Infraestrutura de Deploy

**Status:** Concluído

- [x] **Tarefa 8.1:** Criar o arquivo de script `Deploy.s.sol` no diretório `script/`.
- [x] **Tarefa 8.2:** Implementar a lógica de deploy para os contratos core (Tokens, Oracle, Factory, LiquidationManager).
- [x] **Tarefa 8.3:** Implementar a lógica de deploy para os contratos de Governança e Staking.
- [x] **Tarefa 8.4:** Testar o script de deploy em um ambiente local (Anvil) e garantir que todos os contratos são implantados e configurados corretamente.