# 5. Modelo de Negócio do Protocolo SCC

Este documento detalha o modelo de negócio do Protocolo SCC, explicando como ele gera receita, captura valor e se posiciona no ecossistema DeFi. O protocolo opera como um **banco descentralizado**, onde o serviço principal é a emissão de empréstimos (a stablecoin `SCC-USD`) contra ativos de colateral depositados pelos usuários.

## 5.1. Fontes de Receita

O protocolo possui duas fontes de receita primárias:

### 5.1.1. Taxa de Estabilidade (Stability Fee)

*   **Definição:** Uma taxa de juros anualizada, cobrada sobre toda a dívida de `SCC-USD` emitida. Esta é a principal fonte de receita do protocolo.
*   **Funcionamento:** A taxa é acumulada continuamente em cada `Vault` com dívida ativa e é paga pelo usuário em `SCC-USD` no momento em que ele quita sua dívida.
*   **Governança:** O valor da Taxa de Estabilidade é um parâmetro crucial controlado pela governança (`SCC-GOV`), podendo ser ajustado para controlar a oferta e demanda da `SCC-USD` e otimizar a receita.

### 5.1.2. Penalidade de Liquidação (Liquidation Penalty)

*   **Definição:** Uma taxa cobrada quando um `Vault` se torna sub-colateralizado e é liquidado.
*   **Funcionamento:** Durante o processo de liquidação, o colateral do `Vault` é leiloado para cobrir a dívida. A penalidade é um valor adicional cobrado sobre a dívida, servindo como fonte de receita secundária e como desincentivo para posições de alto risco.

## 5.2. Captura de Valor (O Papel do SCC-GOV)

O token `SCC-GOV` é fundamental para o modelo de negócio, pois permite que os detentores do token se beneficiem da receita gerada pelo protocolo.

*   **Fluxo de Valor:**
    1.  As Taxas de Estabilidade e Penalidades de Liquidação são arrecadadas pelo protocolo.
    2.  Essa receita (em `SCC-USD`) é transferida para o contrato `StakingPool`.
    3.  Detentores de `SCC-GOV` podem depositar (`stake`) seus tokens no `StakingPool`.
    4.  O `StakingPool` distribui a receita acumulada proporcionalmente a todos os stakers.

Este mecanismo transforma o `SCC-GOV` em um **ativo produtivo**, cujo valor está diretamente ligado à receita gerada pelo protocolo. Quanto mais `SCC-USD` for emitido e quanto mais taxas forem coletadas, maior será o rendimento para os stakers de `SCC-GOV`.

## 5.3. Benchmarking e Modelos de Sucesso

O modelo de negócio do Protocolo SCC é inspirado e validado por projetos de sucesso no espaço DeFi:

*   **MakerDAO (DAI & MKR):** Pioneiro em stablecoins colateralizadas, com um modelo de `Vaults`, Taxas de Estabilidade e um token de governança (`MKR`) que captura valor, gerando receita significativa.
*   **Liquity (LUSD & LQTY):** Outro protocolo de stablecoin colateralizada por ETH, que distribui a receita do protocolo aos stakers de seu token de governança (`LQTY`).
