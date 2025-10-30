# 2. Mecanismo da Stablecoin (SCC-USD)

Este documento detalha os mecanismos fundamentais que governam a emissão, queima e a manutenção da estabilidade da stablecoin `SCC-USD` dentro do protocolo SCC. O sistema é projetado para garantir que toda `SCC-USD` em circulação seja sempre super-colateralizada, mantendo sua paridade com o dólar americano.

## 2.1. Conceitos Fundamentais

### Vault

Um `Vault` é um contrato inteligente individual (representado como um NFT ERC721) onde um usuário deposita seu colateral e gera dívida na forma de `SCC-USD`. Cada `Vault` é uma posição de dívida colateralizada (CDP) que o usuário possui e gerencia.

### Taxa de Colateralização (Collateralization Ratio - CR)

A `CR` é a razão entre o valor do colateral depositado no `Vault` (avaliado em USD) e a quantidade de `SCC-USD` emitida (dívida).

`CR = (Valor do Colateral em USD) / (Dívida em SCC-USD)`

### Taxa Mínima de Colateralização (Minimum Collateralization Ratio - MCR)

O `MCR` é o `CR` mais baixo que um `Vault` pode ter para ser considerado solvente. Se o `CR` de um `Vault` cair abaixo do `MCR`, ele se torna elegível para liquidação. Este é um parâmetro configurável via governança (ex: 150%).

### Taxa de Estabilidade (Stability Fee)

Uma taxa de juros anualizada, paga em `SCC-USD`, sobre a dívida emitida. Esta taxa atua como um mecanismo para controlar a oferta/demanda de `SCC-USD` e é uma fonte de receita para o protocolo. É um parâmetro de governança.

## 2.2. Processo de Minting (Criação de SCC-USD)

O processo de criação de `SCC-USD` envolve os seguintes passos, conforme implementado na função `mint` do contrato `Vault.sol`:

1.  **Criação de Vault:** O usuário interage com a `VaultFactory` para criar um novo `Vault`, recebendo um NFT que representa sua posição.
2.  **Depósito de Colateral:** O usuário deposita um ativo de colateral aprovado (ex: ETH) em seu `Vault` através da função `depositCollateral`.
    *   **Implementação (`Vault.sol`):** A função `depositCollateral` transfere o `_amount` de `collateralToken` do `msg.sender` para o `Vault` e atualiza `collateralAmount`.
3.  **Emissão de SCC-USD:** O usuário especifica a quantidade de `SCC-USD` que deseja emitir. O sistema, através da função `mint` no `Vault.sol`, verifica se o `CR` do `Vault` permanecerá acima do `MCR` após a emissão.
    *   **Implementação (`Vault.sol`):** A função `mint` calcula o `collateralValue` usando o `OracleManager`, verifica se o `collateralizationRatio` resultante é maior que `sccParameters.minCollateralizationRatio()`. Se for válido, `debtAmount` é atualizado e `sccUsdToken.mint` é chamado para criar os tokens e transferi-los para o `owner()` do `Vault`.
4.  **Recebimento de SCC-USD:** Se a verificação for bem-sucedida, a quantidade solicitada de `SCC-USD` é criada e transferida para a carteira do usuário, e a dívida é registrada no `Vault`.

## 2.3. Processo de Burning (Pagamento da Dívida)

Para recuperar seu colateral, o usuário precisa pagar sua dívida. Este processo é gerenciado pela função `burn` no `Vault.sol`:

1.  **Aprovação e Depósito de SCC-USD:** O usuário aprova o contrato `Vault` para gastar sua `SCC-USD` e chama a função `burn` para pagar a dívida.
2.  **Queima de SCC-USD:** O montante é transferido para o contrato e queimado (removido de circulação) através de `sccUsdToken.burnFrom`, e a `debtAmount` do `Vault` é reduzida.
3.  **Retirada de Colateral:** Após o pagamento da dívida, o usuário pode retirar uma parte ou todo o seu colateral usando a função `withdrawCollateral`. O sistema verifica se o `CR` do `Vault` não cairá abaixo do `MCR` após a retirada.
    *   **Implementação (`Vault.sol`):** A função `withdrawCollateral` verifica o `collateralizationRatio` após a retirada. Se a dívida for maior que zero e o `CR` cair abaixo do `MCR`, a transação é revertida. Caso contrário, `collateralAmount` é atualizado e o colateral é transferido de volta para o `owner()` do `Vault`.

## 2.4. Mecanismo de Liquidação

A liquidação é um processo crítico que garante a solvência do sistema quando o valor do colateral de um `Vault` cai, tornando-o sub-colateralizado. Este processo é gerenciado pelo `LiquidationManager` e interage com o `Vault` através de funções específicas.

1.  **Gatilho:** Um `Vault` se torna elegível para liquidação quando seu `CR` cai abaixo do `MCR`. Qualquer entidade externa (como um "keeper" ou "liquidator bot") pode iniciar o processo de liquidação para um `Vault` nessas condições.
2.  **Tomada do Colateral:** O `LiquidationManager` assume o controle do colateral no `Vault` liquidado através da função `transferCollateralTo`.
    *   **Implementação (`Vault.sol`):** A função `transferCollateralTo` é `external` e `onlyLiquidationManager`, permitindo que apenas o `LiquidationManager` transfira o colateral para si mesmo ou para outro endereço, reduzindo `collateralAmount` no `Vault`.
3.  **Cobertura da Dívida:** Uma parte do colateral é vendida para cobrir a dívida pendente em `SCC-USD`, mais uma taxa de penalidade de liquidação.
4.  **Leilões Holandeses (Dutch Auctions):** O protocolo utiliza Leilões Holandeses para vender o colateral. O preço do colateral começa alto e decai linearmente com o tempo. O primeiro participante a comprar o colateral a um preço aceitável adquire-o. Isso cria demanda por `SCC-USD` e remove a dívida "ruim" do sistema. O valor arrecadado acima da dívida é devolvido ao proprietário original do `Vault`.
    *   **Implementação (`Vault.sol`):** A função `reduceDebt` é `external` e `onlyLiquidationManager`, permitindo que o `LiquidationManager` reduza a `debtAmount` do `Vault` após a liquidação.

Para detalhes técnicos mais aprofundados sobre a implementação do mecanismo de liquidação, consulte o documento `07-mecanismo-de-liquidacao.md` na seção de Arquitetura e Design Técnico.
