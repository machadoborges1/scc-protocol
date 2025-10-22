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

## Milestone 9: Refatoração do Controle de Acesso e Correção dos Testes

**Status:** Concluído

- [x] **Tarefa 9.1:** Documentar a arquitetura de controle de acesso híbrida e o fluxo de autorização refinado.
    - [x] *Sub-tarefa:* Criar `ACCESS_CONTROL_ARCHITECTURE.md`.
    - [x] *Sub-tarefa:* Atualizar `ORACLE_MANAGER.md`, `VAULT_MECHANISM.md`, e `SYSTEM_ARCHITECTURE_AND_FLOW.md`.
- [x] **Tarefa 9.2:** Refatorar `OracleManager.sol` para usar `AccessControl` (RBAC) em vez de `Ownable`.
    - [x] *Sub-tarefa:* Introduzir `AUTHORIZER_ROLE` para delegar a capacidade de autorização de forma segura.
- [x] **Tarefa 9.3:** Atualizar o script de deploy (`Deploy.s.sol`) para o novo fluxo de RBAC.
    - [x] *Sub-tarefa:* Conceder `AUTHORIZER_ROLE` para a `VaultFactory`.
    - [x] *Sub-tarefa:* Transferir `DEFAULT_ADMIN_ROLE` para o `Timelock`.
- [x] **Tarefa 9.4:** Corrigir a suíte de testes para alinhar com a nova arquitetura.
    - [x] *Sub-tarefa:* Corrigir falha de compilação relacionada à versão da OpenZeppelin (usar `_grantRole`).
    - [x] *Sub-tarefa:* Corrigir teste da `VaultFactory` (`test_CreateNewVault`) ajustando as permissões de RBAC no `setUp`.
- [x] **Tarefa 9.5:** Executar todos os testes e garantir que 100% da suíte passe.

## Milestone 10: Correções de Vulnerabilidades e Melhorias de Design

**Status:** Concluído

- [x] **Tarefa 10.1:** Corrigir vulnerabilidade de gerenciador de liquidação no `Vault.sol`.
    - [x] *Sub-tarefa:* Remover a função `setLiquidationManager`.
    - [x] *Sub-tarefa:* Tornar o endereço do `LiquidationManager` imutável (`immutable`) e definido no construtor.
    - [x] *Sub-tarefa:* Atualizar a `VaultFactory.sol` para injetar o `LiquidationManager` na criação do `Vault`.
    - [x] *Sub-tarefa:* Atualizar todos os testes e scripts de deploy para refletir a nova arquitetura.
- [x] **Tarefa 10.2:** Corrigir vulnerabilidade de `burn` no `SCC_USD.sol`.
- [x] **Tarefa 10.3:** Corrigir o problema de fundos presos no `LiquidationManager.sol`.
- [x] **Tarefa 10.4:** Melhorar a flexibilidade do `StakingPool.sol` com duração de recompensa dinâmica.
- [x] **Tarefa 10.5:** Executar todos os testes e garantir que 100% da suíte passe.

## Milestone 11: Correção de Bug de Re-liquidação e Testes

**Status:** Concluído

- [x] **Tarefa 11.1:** Implementar funções `reduceCollateral` e `reduceDebt` em `Vault.sol`.
- [x] **Tarefa 11.2:** Chamar `vault.reduceCollateral` e `vault.reduceDebt` em `LiquidationManager.buy()`.
- [x] **Tarefa 11.3:** Adicionar testes unitários para `Vault.reduceCollateral` e `Vault.reduceDebt`.
- [x] **Tarefa 11.4:** Adicionar testes de integração para o fluxo de liquidação completa, verificando a atualização do estado do `Vault` e a não re-liquidação.
- [x] **Tarefa 11.5:** Executar todos os testes e garantir que 100% da suíte passe.

## Milestone 12: Depuração e Correção de Bugs de Liquidação

**Status:** Concluído

- [x] **Tarefa 12.1:** Investigar e corrigir falhas de compilação na suíte de testes `LiquidationManager.t.sol`.
    - [x] *Sub-tarefa:* Corrigir acesso incorreto a membros de `struct` nos testes.
    - [x] *Sub-tarefa:* Adicionar a função `isVaultLiquidatable` para auxiliar os testes.
- [x] **Tarefa 12.2:** Adicionar logs detalhados à função `buy` para rastrear o fluxo de execução e estado.
- [x] **Tarefa 12.3:** Identificar e corrigir o bug de contabilidade no `LiquidationManager.sol` que causava inconsistência no balanço do `Vault` após o retorno de colateral.
- [x] **Tarefa 12.4:** Refatorar os testes frágeis (`test_buy_DebtDustHandling` e outros) para validar o comportamento correto do contrato, considerando a precisão da matemática de inteiros.
- [x] **Tarefa 12.5:** Executar a suíte de testes completa e garantir que 100% dos testes passem.

## Milestone 13: Aumento da Cobertura de Testes de Segurança e Integração

**Status:** Em Andamento

- [x] **Tarefa 13.1:** Implementar teste de reentrância no `Vault.sol`.
    - [x] *Sub-tarefa:* Criar o arquivo `test/VaultSecurity.t.sol`.
    - [x] *Sub-tarefa:* Desenvolver um token ERC20 malicioso que tenta uma chamada reentrante durante a queima de dívida (`burn`).
    - [x] *Sub-tarefa:* Validar que a proteção `onlyOwner` do `Vault` previne com sucesso o ataque.
- [ ] **Tarefa 13.2:** Implementar teste de ciclo de vida de taxas (End-to-End).
    - *Sub-tarefa:* Criar um teste que simula a liquidação, coleta de taxas, transferência via governança para o `StakingPool` e o resgate de recompensas por um staker.
- [ ] **Tarefa 13.3:** Implementar testes de limite para `LiquidationManager`.
    - *Sub-tarefa:* Criar um teste para o caso de a dívida restante ser *exatamente* igual ao `DEBT_DUST`.
    - *Sub-tarefa:* Criar um teste para o caso de o preço do leilão decair a zero durante uma transação `buy`.
- [ ] **Tarefa 13.4:** Implementar teste de ataque de governança no `OracleManager`.
    - *Sub-tarefa:* Simular uma proposta maliciosa que troca um feed de preço válido por um oráculo falso para testar as defesas do sistema.
- [ ] **Tarefa 13.5:** Atualizar `docs/TESTING_OVERVIEW.md` conforme os novos testes forem concluídos.