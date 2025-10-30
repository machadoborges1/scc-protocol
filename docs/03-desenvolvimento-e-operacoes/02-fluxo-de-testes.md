# 2. Fluxo de Testes do Protocolo SCC

Este documento fornece uma visão geral da suíte de testes existente para os smart contracts e serviços off-chain do protocolo SCC, bem como recomendações para testes futuros para aumentar a robustez e segurança do sistema.

## 2.1. Testes de Smart Contracts (Foundry)

A suíte de testes de smart contracts é implementada com o framework Foundry, focando em testes unitários e de integração para validar a lógica de negócio e as regras de segurança de cada componente do protocolo.

### 2.1.1. Cobertura de Testes por Contrato

Os testes cobrem os seguintes contratos e funcionalidades:

*   **Contratos de Token (`SCC_USD` e `SCC_GOV`):**
    *   Verificação de implantação com nome e símbolo corretos.
    *   `SCC_USD`: Confirma que apenas contas com `MINTER_ROLE` podem criar novos tokens e que a queima de tokens de outras contas (`burnFrom`) requer aprovação prévia.
    *   `SCC_GOV`: Garante que o suprimento inicial é corretamente enviado para o deployer.
*   **`OracleManager.sol`:**
    *   **Segurança e Acesso:** Apenas endereços autorizados podem consultar preços.
    *   **Validação de Dados:** Reverte transações para preços desatualizados, inválidos (zero ou negativo) ou quando nenhum feed de preço está configurado.
    *   **Administração:** Apenas a governança pode adicionar ou atualizar feeds de preço.
*   **`Vault.sol` e `VaultFactory.sol`:**
    *   **Criação de Vaults:** `VaultFactory` garante que novos `Vaults` são criados com sucesso, a propriedade do NFT é atribuída corretamente e as permissões essenciais (Oráculo, Mint de `SCC_USD`) são delegadas.
    *   **Gerenciamento de Posição (CDP):** Testes para depósito/retirada de colateral e criação/pagamento de dívida em `SCC-USD`.
    *   **Segurança do Vault:** Valida que o usuário não pode retirar colateral ou criar dívida se isso violar o rácio de colateralização mínimo.
    *   **Controle de Acesso:** Apenas o `LiquidationManager` pode invocar funções internas para transferência de colateral durante a liquidação.
*   **`LiquidationManager.sol`:**
    *   **Início do Leilão:** Verifica que um leilão só pode ser iniciado para um `Vault` sub-colateralizado e sem leilão ativo.
    *   **Lógica do Leilão Holandês:** `test_getCurrentPrice_DecaysLinearly` confirma o decaimento linear do preço. Testes de `buy()` cobrem cenários de compra parcial e total, validando a atualização do estado do leilão e do `Vault`.
    *   **Correções de Bugs:** Testes específicos (`test_buy_MultiplePartialPurchases_VaultStateUpdated`, `test_buy_DebtDustHandling`) validam a contabilidade correta e o tratamento de arredondamentos.
*   **`StakingPool.sol` e Governança:**
    *   **Ciclo de Staking:** Testes para depósito (`stake`), retirada (`unstake`) e resgate de recompensas (`getReward`).
    *   **Cálculo de Recompensas:** Valida que as recompensas em `SCC-USD` são calculadas e distribuídas proporcionalmente.
    *   **Governança:** Testes para `StakingPoolGovernance` e `SCC_Governor` garantem a administração dos contratos e o ciclo de vida de uma proposta de governança (proposta -> votação -> fila -> execução).

### 2.1.2. Estrutura de Diretórios de Testes (`contracts/test/`)

O diretório `contracts/test/` contém arquivos de teste `.t.sol` para cada componente principal do contrato, como:

*   `FeeLifecycle.t.sol`
*   `LiquidationManager.t.sol`
*   `OracleManager.t.sol`
*   `SCC_Governor.t.sol`
*   `SCC_Parameters.t.sol`
*   `StakingPool.t.sol`
*   `StakingPoolGovernance.t.sol`
*   `Vault.t.sol`
*   `VaultFactory.t.sol`
*   `VaultSecurity.t.sol`
*   `tokens/` (para testes de tokens como `SCC_USD` e `SCC_GOV`)

## 2.2. Testes de Serviços Off-chain (Jest)

Os serviços off-chain (como o Keeper Bot) são testados usando Jest, com foco em testes de integração para garantir a interação correta com a blockchain.

### 2.2.1. Estrutura de Diretórios de Testes (`offchain/test/`)

O diretório `offchain/test/` contém:

*   **`integration/`:** Contém testes de integração que verificam o comportamento dos serviços off-chain em conjunto com uma blockchain local. Exemplo: `liquidation.test.ts` testa o fluxo completo de liquidação.

## 2.3. Análise de Código e Métricas

*   **Análise Estática:** Ferramentas como Slither são integradas ao processo de CI/CD para detectar padrões de vulnerabilidade conhecidos.
*   **Cobertura de Código:** Uma meta de cobertura de testes acima de 95% é mantida, com relatórios gerados por `forge coverage`.

## 2.4. Recomendações para Próximos Testes

Para aumentar a robustez do protocolo para um nível de produção, são recomendados os seguintes testes, focados em casos extremos, segurança e integração complexa:

1.  **Teste de Reentrância no `Vault.sol`:** Simular um ataque de reentrância para provar a imunidade do contrato.
2.  **Teste de Fluxo de Receita Completo (End-to-End):** Simular todo o ciclo de vida da receita do protocolo, desde a liquidação até a distribuição de recompensas via staking e governança.
3.  **Teste de Limite Exato no `LiquidationManager.sol`:** Forçar um leilão onde a compra de colateral resulta em uma dívida restante *exatamente* igual ao `DEBT_DUST` para garantir o fechamento correto do leilão.
4.  **Teste de Ataque de Governança no `OracleManager.sol`:** Simular uma proposta de governança maliciosa para trocar um feed de preço válido por um falso, documentando o impacto e verificando as defesas do protocolo.
