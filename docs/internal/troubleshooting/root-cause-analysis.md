## Root Cause Analysis Report: Resolving the `ERC20InsufficientBalance` Anomaly

### 1. Problem Statement

An auction liquidation transaction was sporadically failing with an `ERC20InsufficientBalance` error. The error was difficult to reproduce, as the automated Foundry test suite, including the tests for the `buy` function, was passing completely. The goal was to identify the root cause of this failure and ensure that the liquidation operation could be executed reliably.

### 2. Debugging Process

The investigation followed a multifaceted approach, alternating between the automated Foundry test environment and a manual test environment with `anvil` and `cast`.

#### 2.1. Phase 1: Verification in the Foundry Test Environment

*   **Initial Hypothesis:** The `ERC20InsufficientBalance` error could be masking an `ERC20InsufficientAllowance` error, or a problem with the execution context (`msg.sender`) within the tests.
*   **Action:** We modified the tests in `test/LiquidationManager.t.sol`, adding logs via `console.log` to inspect the buyer's balance (`balanceOf`) and allowance (`allowance`) immediately before the `buy` function call.
*   **Result:** Surprisingly, all tests, including those for partial and full liquidation, **passed successfully**. The logs confirmed that the buyer's balance was sufficient and the allowance was being set correctly to the exact required value.
*   **Partial Conclusion:** The error was not in the execution paths covered by the automated test suite. The cause had to be a difference between the Foundry test environment and the manual execution environment.

#### 2.2. Phase 2: Attempt at Manual Reproduction with `anvil` and `cast`

*   **Objective:** Reproduce the error in a controlled environment, outside of the Foundry test runner.
*   **Action:**
    1.  We started an `anvil` instance.
    2.  We ran the original deployment script (`script/Deploy.s.sol`).
    3.  We tried to interact with the deployed contracts using `cast`.
*   **Result:** We encountered an unexpected and persistent environment problem. Write calls (`cast send`) to the contracts worked, but read calls (`cast call`) failed with the `contract does not have any code` error.
*   **Analysis:** This behavior indicated that the `Deploy.s.sol` deployment script, being very complex (deploying, configuring, and creating a complete test ecosystem), was leaving the `anvil` network state in an inconsistent condition.

#### 2.3. Phase 3: Isolating the Problem with a Simplified Deployment

*   **Hypothesis:** The complexity of the deployment script was the cause of the environment's instability.
*   **Action:**
    1.  We created a new script, `script/SimpleDeploy.s.sol`, which contained only the minimum code to deploy the essential contracts, without any extra configuration.
    2.  We ran this script on a clean `anvil` instance.
*   **Result:** **Success.** The resulting environment was stable. All `cast send` and `cast call` calls to the newly deployed contracts worked as expected. The "no code" problem disappeared.

### 3. Identification of the Root Cause

With a stable manual environment, we were finally able to reproduce the original error:

1.  We started an auction for a vault.
2.  We calculated the cost for the buyer.
3.  We sent the buyer's `approve` transaction to the `LiquidationManager`.
4.  We sent the buyer's `buy` transaction.
5.  **The `buy` transaction failed with the `ERC20InsufficientBalance` error.**

A análise da mensagem de erro foi clara: `ERC20InsufficientBalance(buyer_address, 0, 2000e18)`. O saldo do comprador era `0`.

**A causa raiz foi a ausência de uma etapa de inicialização de saldo no teste manual.** O script `SimpleDeploy.s.sol` apenas implantou os contratos; ele não cunhou (`mint`) nenhum token `SCC_USD` para a conta do comprador. Em contraste, a função `setUp` nos testes do Foundry *fazia* essa cunhagem, e por isso os testes passavam.

### 4. Resolução

A solução foi adicionar a etapa que faltava no nosso fluxo de teste manual:

1.  Usando `cast send`, chamamos a função `mint` no contrato `SCC_USD` para creditar 50,000 tokens na conta do comprador.
2.  Com o saldo agora positivo, executamos novamente a sequência de `approve` e `buy`.
3.  **A transação `buy` foi concluída com sucesso.**