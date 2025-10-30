# 7. Mecanismo de Liquidação (Leilão Holandês)

Este documento descreve o mecanismo de liquidação implementado no Protocolo SCC, que utiliza um modelo de **Leilão Holandês** para garantir a solvência do sistema. Este mecanismo é gerenciado pelo contrato `LiquidationManager.sol` e é crucial para manter a super-colateralização da `SCC-USD`.

## 7.1. Visão Geral do Leilão Holandês

O Leilão Holandês inverte o processo de descoberta de preço em comparação com um leilão inglês tradicional. Em vez de o preço subir com lances, ele começa alto e decai linearmente com o tempo até que um comprador intervenha. Este modelo é inspirado em protocolos de referência como o MakerDAO, visando maior eficiência de capital, menor custo de gás para os participantes e um processo de liquidação mais rápido e determinístico.

### 7.1.1. Fluxo do Leilão

1.  **Início (`startAuction`):** Quando um `Vault` se torna sub-colateralizado (seu CR cai abaixo do `minCollateralizationRatio` definido em `SCC_Parameters`), qualquer pessoa (geralmente um Keeper Bot) pode chamar a função `startAuction()` no `LiquidationManager.sol` para iniciar um leilão.
    *   O preço do colateral começa alto, calculado com base no preço atual do oráculo (`OracleManager`) e um multiplicador (`startPriceMultiplier` de `SCC_Parameters`).
    *   Uma nova `Auction` é criada, registrando o `collateralAmount`, `debtToCover`, `vaultAddress`, `startTime` e `startPrice`.
2.  **Decaimento do Preço:** O preço do colateral diminui linearmente com o tempo. A função `getCurrentPrice()` calcula o preço atual com base no `startTime` do leilão e no `priceDecayHalfLife` (definido em `SCC_Parameters`).
3.  **Compra (`buy`):** Um participante (comprador) monitora o leilão off-chain. Quando o preço atinge um nível que ele considera justo ou lucrativo, ele chama a função `buy()` no `LiquidationManager.sol`.

### 7.1.2. A Função `buy()`

A função `buy()` é atômica e permite que o comprador adquira colateral e pague a dívida em uma única transação:

1.  O comprador especifica o `_auctionId` e a quantidade de colateral (`_collateralToBuy`) que deseja adquirir.
2.  O contrato calcula o `currentPrice` e o `debtRequiredForDesiredCollateral` (custo em `SCC-USD`).
3.  O `SCC-USD` é transferido da carteira do comprador para o contrato `LiquidationManager`.
4.  O colateral é transferido do `Vault` liquidado para a carteira do comprador (usando `vault.transferCollateralTo()`).
5.  O estado do `Vault` é atualizado, reduzindo sua dívida (`vault.reduceDebt()`).
6.  O estado do leilão (`auction.collateralAmount` e `auction.debtToCover`) é atualizado.
7.  Se o leilão for concluído (dívida coberta ou colateral esgotado), qualquer colateral restante é devolvido ao proprietário original do `Vault`, e o leilão é finalizado (`_closeAuction()`).

## 7.2. Vantagens do Modelo de Leilão Holandês

*   **Eficiência de Capital e Gás:** Um comprador executa apenas uma transação para garantir sua compra, otimizando o uso de gás.
*   **Rapidez:** As liquidações podem ser concluídas muito mais rapidamente, assim que um comprador estiver disposto a pagar o preço atual.
*   **Simplicidade para o Usuário:** O processo é direto: chame `buy()` e receba o ativo instantaneamente.
*   **Previsibilidade:** O caminho do preço é determinístico, facilitando a programação de bots liquidadores.

## 7.3. Funções Chave do `LiquidationManager.sol`

*   **`startAuction(address _vaultAddress)`:** Inicia um leilão para um `Vault` sub-colateralizado. Verifica se o `Vault` é liquidável e se já não está em leilão. Calcula o preço inicial do leilão.
*   **`buy(uint256 _auctionId, uint256 _collateralToBuy)`:** Permite a compra de colateral de um leilão em andamento. Realiza a troca atômica de `SCC-USD` por colateral e atualiza os estados.
*   **`getCurrentPrice(uint256 _auctionId)`:** Função `view` que calcula o preço atual do colateral em um leilão, com base no tempo decorrido e nos parâmetros de decaimento.
*   **`isVaultLiquidatable(address _vaultAddress)`:** Função `view` que verifica se um `Vault` está abaixo do `minCollateralizationRatio` e é elegível para liquidação.
*   **`withdrawFees(address _recipient, uint256 _amount)`:** Função `onlyOwner` que permite à governança sacar as taxas de `SCC-USD` acumuladas no contrato `LiquidationManager` (correção de um problema crítico identificado na versão inicial).

## 7.4. Parâmetros de Liquidação (Configuráveis via Governança)

Os seguintes parâmetros, armazenados em `SCC_Parameters.sol`, influenciam diretamente o comportamento dos leilões e são controlados pela governança:

*   **`minCollateralizationRatio`:** O CR mínimo que um `Vault` deve manter. Abaixo deste valor, o `Vault` é liquidável.
*   **`priceDecayHalfLife`:** O tempo em segundos para que o preço do leilão decaia pela metade.
*   **`startPriceMultiplier`:** Um multiplicador aplicado ao preço do oráculo para definir o preço inicial do leilão (ex: 150% do preço de mercado).

## 7.5. Interações

O `LiquidationManager` interage com:

*   **`Vault.sol`:** Para transferir colateral e reduzir a dívida do `Vault` liquidado.
*   **`OracleManager.sol`:** Para obter os preços atualizados dos ativos de colateral.
*   **`SCC_Parameters.sol`:** Para consultar os parâmetros configuráveis do leilão.
*   **`SCC_USD.sol`:** Para receber os pagamentos em `SCC-USD` dos compradores.
