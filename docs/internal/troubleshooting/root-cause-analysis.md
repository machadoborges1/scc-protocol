## Relatório de Análise de Causa Raiz: Resolvendo a Anomalia `ERC20InsufficientBalance`

### 1. Declaração do Problema

Uma transação de liquidação de leilão falhava esporadicamente com um erro `ERC20InsufficientBalance`. O erro era difícil de reproduzir, pois a suíte de testes automatizados do Foundry, incluindo os testes para a função de compra (`buy`), estava passando completamente. O objetivo era identificar a causa raiz dessa falha e garantir que a operação de liquidação pudesse ser executada de forma confiável.

### 2. Processo de Depuração

A investigação seguiu uma abordagem multifacetada, alternando entre o ambiente de teste automatizado do Foundry e um ambiente de teste manual com `anvil` e `cast`.

#### 2.1. Fase 1: Verificação no Ambiente de Teste do Foundry

*   **Hipótese Inicial:** O erro `ERC20InsufficientBalance` poderia estar mascarando um erro de `ERC20InsufficientAllowance`, ou um problema com o contexto de execução (`msg.sender`) dentro dos testes.
*   **Ação:** Modificamos os testes em `test/LiquidationManager.t.sol`, adicionando logs via `console.log` para inspecionar o saldo (`balanceOf`) e a permissão (`allowance`) do comprador imediatamente antes da chamada da função `buy`.
*   **Resultado:** Surpreendentemente, todos os testes, incluindo os de liquidação parcial e completa, **passaram com sucesso**. Os logs confirmaram que o saldo do comprador era suficiente e a permissão estava sendo definida corretamente para o valor exato necessário.
*   **Conclusão Parcial:** O erro não estava nos caminhos de execução cobertos pela suíte de testes automatizados. A causa deveria estar em uma diferença entre o ambiente de teste do Foundry e o ambiente de execução manual.

#### 2.2. Fase 2: Tentativa de Reprodução Manual com `anvil` e `cast`

*   **Objetivo:** Reproduzir o erro em um ambiente controlado, fora do executor de testes do Foundry.
*   **Ação:**
    1.  Iniciamos uma instância `anvil`.
    2.  Executamos o script de implantação original (`script/Deploy.s.sol`).
    3.  Tentamos interagir com os contratos implantados usando `cast`.
*   **Resultado:** Encontramos um problema de ambiente inesperado e persistente. Chamadas de escrita (`cast send`) para os contratos funcionavam, mas chamadas de leitura (`cast call`) falhavam com o erro `contract does not have any code`.
*   **Análise:** Este comportamento indicou que o script de implantação `Deploy.s.sol`, por ser muito complexo (implantando, configurando e criando um ecossistema de teste completo), estava deixando o estado da rede `anvil` em uma condição inconsistente.

#### 2.3. Fase 3: Isolando o Problema com uma Implantação Simplificada

*   **Hipótese:** A complexidade do script de implantação era a causa da instabilidade do ambiente.
*   **Ação:**
    1.  Criamos um novo script, `script/SimpleDeploy.s.sol`, que continha apenas o código mínimo para implantar os contratos essenciais, sem nenhuma configuração extra.
    2.  Executamos este script em uma instância limpa do `anvil`.
*   **Resultado:** **Sucesso.** O ambiente resultante era estável. Todas as chamadas `cast send` e `cast call` para os contratos recém-implantados funcionaram como esperado. O problema de "no code" desapareceu.

### 3. Identificação da Causa Raiz

Com um ambiente manual estável, finalmente conseguimos reproduzir o erro original:

1.  Iniciamos um leilão para um cofre.
2.  Calculamos o custo para o comprador (`buyer`).
3.  Enviamos a transação `approve` do comprador para o `LiquidationManager`.
4.  Enviamos a transação `buy` do comprador.
5.  **A transação `buy` falhou com o erro `ERC20InsufficientBalance`.**

A análise da mensagem de erro foi clara: `ERC20InsufficientBalance(buyer_address, 0, 2000e18)`. O saldo do comprador era `0`.

**A causa raiz foi a ausência de uma etapa de inicialização de saldo no teste manual.** O script `SimpleDeploy.s.sol` apenas implantou os contratos; ele não cunhou (`mint`) nenhum token `SCC_USD` para a conta do comprador. Em contraste, a função `setUp` nos testes do Foundry *fazia* essa cunhagem, e por isso os testes passavam.

### 4. Resolução

A solução foi adicionar a etapa que faltava no nosso fluxo de teste manual:

1.  Usando `cast send`, chamamos a função `mint` no contrato `SCC_USD` para creditar 50,000 tokens na conta do comprador.
2.  Com o saldo agora positivo, executamos novamente a sequência de `approve` e `buy`.
3.  **A transação `buy` foi concluída com sucesso.**

