# Mecanismo de Liquidação v2 - Leilão Holandês

**Status:** Implementado
**Contrato Afetado:** `LiquidationManager.sol`

## 1. Resumo da Mudança

Este documento descreve a transição do mecanismo de liquidação de um **Leilão Inglês** para um **Leilão Holandês**. A mudança foi motivada pela análise de protocolos de referência como o MakerDAO, visando maior eficiência de capital, menor custo de gás para os participantes e um processo de liquidação mais rápido e determinístico.

## 2. O Modelo Antigo (Leilão Inglês)

- **Fluxo:** Múltiplos participantes davam lances (`bid`) crescentes durante um período fixo (`AUCTION_DURATION`).
- **Problemas:**
    - **Ineficiência de Gás:** Exigia múltiplas transações na blockchain para competir.
    - **Lentidão:** O leilão precisava correr por um longo período para garantir a descoberta de preço.
    - **Complexidade para o Usuário:** O vencedor precisava retornar para executar uma função `claim()` separada.

## 3. O Novo Modelo (Leilão Holandês)

Inspirado no contrato `Clipper.sol` do MakerDAO, o novo modelo inverte o processo de descoberta de preço.

### 3.1. Fluxo do Leilão

1.  **Início (`startAuction`):** Quando um `Vault` é liquidado, um leilão é iniciado. O preço do colateral começa **alto** – um multiplicador (ex: 150%) acima do preço atual do oráculo.
2.  **Decaimento do Preço:** O preço do colateral **diminui linearmente** com o tempo. Ele não espera por lances; o preço simplesmente cai a cada bloco.
3.  **Compra (`buy`):** Um participante (comprador) monitora o leilão off-chain. Quando o preço atinge um nível que ele considera justo ou lucrativo, ele chama a função `buy()` **uma única vez**.

### 3.2. A Função `buy()`

Esta função é o coração do novo mecanismo e substitui tanto o `bid()` quanto o `claim()`. Ela é **atômica**.

- **Parâmetros:** O comprador especifica o ID do leilão e a quantidade de colateral que deseja comprar.
- **Execução:**
    1.  O contrato calcula o `currentPrice` com base no tempo decorrido desde o início do leilão.
    2.  Ele calcula o `debtToPay` (custo em SCC-USD) para a quantidade de colateral desejada.
    3.  **Atomicidade:** Na mesma transação, o contrato:
        - Transfere o `debtToPay` (SCC-USD) da carteira do comprador.
        - Transfere o colateral comprado para a carteira do comprador.
    4.  O estado do leilão é atualizado, deduzindo a quantidade de colateral vendido e a dívida coberta.

### 3.3. Vantagens do Novo Modelo

- **Eficiência de Capital e Gás:** Um comprador executa apenas **uma transação** para garantir sua compra.
- **Rapidez:** As liquidações podem ser concluídas muito mais rapidamente, assim que um comprador estiver disposto a pagar o preço atual.
- **Simplicidade para o Usuário:** O processo é direto: chame `buy()` e receba o ativo instantaneamente. Não há necessidade de retornar para reivindicar.
- **Previsibilidade:** O caminho do preço é determinístico, facilitando a programação de bots liquidadores.

## 4. Impacto no Código

- **`LiquidationManager.sol`:** Totalmente refatorado.
    - A `struct Auction` foi simplificada.
    - A função `liquidate()` foi renomeada para `startAuction()`.
    - A função `bid()` foi removida e substituída por `buy()`.
    - A necessidade de uma função `claimAuction()` foi eliminada.
- **`DEVELOPMENT_PLAN.md`:** A tarefa de implementar `claim` tornou-se obsoleta e foi efetivamente fundida na nova lógica de `buy`.
