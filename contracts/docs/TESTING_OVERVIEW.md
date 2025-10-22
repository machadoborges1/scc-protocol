# Visão Geral dos Testes do Sistema SCC

Este documento fornece um resumo da suíte de testes existente para os smart contracts do protocolo SCC e oferece recomendações para testes futuros para aumentar a robustez e segurança do sistema.

---

### **Cobertura de Testes por Contrato**

A suíte de testes atual, implementada com o framework Foundry, foca em testes unitários e de integração para validar a lógica de negócio e as regras de segurança de cada componente do protocolo.

#### **1. Contratos de Token (`SCC_USD` e `SCC_GOV`)**
*   **Funcionalidade Básica:** Verificam se os tokens são implantados com o nome e o símbolo corretos.
*   **Controle de Acesso e Suprimento:**
    *   `SCC_USD`: Confirma que apenas contas com `MINTER_ROLE` podem criar (mint) novos tokens. Valida também que a queima de tokens de outras contas (`burnFrom`) requer aprovação prévia, prevenindo a destruição não autorizada de fundos.
    *   `SCC_GOV`: Garante que todo o suprimento inicial do token de governança é corretamente enviado para a carteira do deployer no momento da implantação.

#### **2. `OracleManager.sol`**
*   **Segurança e Acesso:** Os testes garantem que apenas endereços previamente autorizados pela governança possam consultar os preços dos ativos, protegendo o sistema contra o uso de oráculos não sancionados.
*   **Validação de Dados do Oráculo:** Verificam se o sistema reverte transações de forma segura e previsível quando o oráculo apresenta dados problemáticos, incluindo:
    *   Nenhum feed de preço configurado para o ativo.
    *   Preço desatualizado (Stale Price).
    *   Preço inválido (zero ou negativo).
*   **Administração pela Governança:** Confirmam que apenas a conta de governança pode executar funções administrativas, como adicionar ou atualizar feeds de preço.

#### **3. `Vault.sol` e `VaultFactory.sol`**
*   **Criação de Vaults:** O teste para a `VaultFactory` garante que novos `Vaults` são criados com sucesso, a propriedade do NFT do Vault é atribuída ao usuário correto e as permissões essenciais (para consultar o Oráculo e para mintar `SCC_USD`) são delegadas automaticamente ao novo `Vault`.
*   **Gerenciamento de Posição (CDP):** Os testes do `Vault` cobrem os fluxos de negócio principais de um usuário:
    *   Depósito e retirada de colateral.
    *   Criação (`mint`) e pagamento (`burn`) de dívida em `SCC-USD`.
*   **Segurança do Vault:** Validam a lógica de negócio mais crítica: um usuário não pode retirar colateral ou criar nova dívida se isso fizer com que seu rácio de colateralização caia abaixo do mínimo exigido pelo protocolo.
*   **Controle de Acesso para Liquidação:** Garantem que apenas o contrato `LiquidationManager` possa invocar as funções de uso interno para transferir colateral durante uma liquidação.

#### **4. `LiquidationManager.sol`**
*   **Início do Leilão:** Verificam que um leilão de liquidação só pode ser iniciado para um `Vault` que está genuinamente sub-colateralizado e que não possui um leilão já em andamento.
*   **Lógica do Leilão Holandês:**
    *   `test_getCurrentPrice_DecaysLinearly`: Confirma que o preço do colateral no leilão decai linearmente com o tempo, conforme a especificação.
    *   **Fluxos de Compra (`buy`):** Testam múltiplos cenários de compra de colateral, incluindo compras parciais e totais. As asserções validam que o estado do leilão (colateral restante, dívida a ser coberta) e do `Vault` liquidado são atualizados corretamente após cada compra.
*   **Correções de Bugs:** Os testes que foram corrigidos durante a depuração (`test_buy_MultiplePartialPurchases_VaultStateUpdated` e `test_buy_DebtDustHandling`) agora validam que a contabilidade do `Vault` é corretamente ajustada após a liquidação e que o sistema lida de forma previsível com os arredondamentos da matemática de inteiros.

#### **5. `StakingPool.sol` e Governança**
*   **Ciclo de Staking:** Os testes cobrem as três ações principais do usuário: depósito (`stake`), retirada (`unstake`) e resgate de recompensas (`getReward`).
*   **Cálculo de Recompensas:** Validam que as recompensas em `SCC-USD` são calculadas e distribuídas de forma justa e proporcional para um ou múltiplos stakers, mesmo quando as recompensas são adicionadas em diferentes momentos.
*   **Governança do Pool e do Protocolo:** Os testes para `StakingPoolGovernance` e `SCC_Governor` garantem que a administração dos contratos (como a transferência de propriedade para o `Timelock`) e o ciclo de vida de uma proposta de governança (proposta -> votação -> fila -> execução) funcionam conforme o esperado.

---

### **Recomendações para Próximos Testes**

Para aumentar a robustez do protocolo para um nível de produção, recomendo a implementação dos seguintes testes, focados em casos extremos, segurança e integração complexa:

1.  **Teste de Reentrância no `Vault.sol`:**
    *   **Cenário:** Criar um token de colateral falso que, ao ser transferido durante um `depositCollateral`, tenta fazer uma chamada reentrante para sacar o mesmo colateral ou mintar dívida antes que o estado seja totalmente atualizado.
    *   **Objetivo:** Provar que o contrato é imune a ataques de reentrância, um dos vetores de ataque mais comuns em DeFi.

2.  **Teste de Fluxo de Receita Completo (End-to-End):**
    *   **Cenário:** Um único teste que simula todo o ciclo de vida da receita do protocolo:
        1.  Um `Vault` é liquidado, gerando taxas que são acumuladas no `LiquidationManager`.
        2.  Uma proposta de governança é criada, aprovada e executada para transferir essas taxas para o `StakingPool`.
        3.  A função `notifyRewardAmount` do `StakingPool` é chamada com os fundos da taxa.
        4.  Um staker, que pode ser um usuário qualquer, resgata sua parte proporcional das taxas recém-distribuídas.
    *   **Objetivo:** Validar a integração perfeita e o fluxo de valor completo do protocolo, conectando liquidação, governança e staking.

3.  **Teste de Limite Exato no `LiquidationManager.sol`:**
    *   **Cenário:** Forçar um leilão onde a compra de colateral resulta em uma dívida restante *exatamente* igual ao `DEBT_DUST`.
    *   **Objetivo:** Garantir que a condição de limite (`<=`) na lógica de fechamento do leilão funciona como esperado, fechando o leilão.

4.  **Teste de Ataque de Governança no `OracleManager.sol`:**
    *   **Cenário:** Simular uma proposta de governança maliciosa que troca um feed de preço válido (ex: WETH/USD) por um oráculo falso que reporta um preço zero ou extremamente inflacionado.
    *   **Objetivo:** Documentar e entender o impacto de uma tomada de controle da governança, e verificar se as defesas (como o `Timelock`, que introduz um atraso na execução) dão à comunidade tempo para reagir.
