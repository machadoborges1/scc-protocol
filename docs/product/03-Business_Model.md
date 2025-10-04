# Documento do Modelo de Negócio

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
**Status:** Ativo

## 1. Visão Geral

Este documento detalha o modelo de negócio do SCC Protocol, explicando como ele gera receita, captura valor e se posiciona no ecossistema DeFi.

O protocolo opera como um **banco descentralizado**, onde o serviço principal é a emissão de empréstimos (a stablecoin `SCC-USD`) contra ativos de colateral depositados pelos usuários. A receita é gerada a partir desses empréstimos e distribuída aos detentores do token de governança (`SCC-GOV`), que são os "acionistas" do protocolo.

## 2. Fontes de Receita

O protocolo possui duas fontes de receita primárias:

### 2.1. Taxa de Estabilidade (Stability Fee)

-   **O que é:** Uma taxa de juros anualizada, cobrada sobre toda a dívida de `SCC-USD` emitida. Esta é a principal fonte de receita do protocolo.
-   **Como funciona:** A taxa é acumulada continuamente em cada `Vault` com dívida ativa. Ela é paga pelo usuário em `SCC-USD` no momento em que ele quita sua dívida.
-   **Governança:** O valor da Taxa de Estabilidade é um parâmetro crucial controlado pela governança (`SCC-GOV`). Ele pode ser ajustado para controlar a oferta e demanda da `SCC-USD` e otimizar a receita.

### 2.2. Penalidade de Liquidação (Liquidation Penalty)

-   **O que é:** Uma taxa cobrada quando um `Vault` se torna sub-colateralizado e é liquidado.
-   **Como funciona:** Durante o processo de liquidação, o colateral do `Vault` é leiloado para cobrir a dívida. A penalidade é um valor adicional cobrado sobre a dívida, que serve tanto como uma fonte de receita secundária quanto como um desincentivo para que os usuários mantenham posições de alto risco.

## 3. Captura de Valor (O Papel do SCC-GOV)

O modelo de negócio só é completo com um mecanismo para que os "donos" do protocolo se beneficiem da receita gerada. É aqui que o token `SCC-GOV` entra.

-   **Fluxo de Valor:**
    1.  As Taxas de Estabilidade e Penalidades de Liquidação são arrecadadas pelo protocolo.
    2.  Essa receita (em `SCC-USD`) é transferida para o contrato `StakingPool`.
    3.  Detentores de `SCC-GOV` podem depositar (`stake`) seus tokens no `StakingPool`.
    4.  O `StakingPool` distribui a receita acumulada proporcionalmente a todos os stakers.

-   **Conclusão:** Este mecanismo transforma o `SCC-GOV` em um **ativo produtivo**. Seu valor não é puramente especulativo; ele é diretamente ligado à receita gerada pelo protocolo. Quanto mais `SCC-USD` for emitido e quanto mais taxas forem coletadas, maior será o rendimento para os stakers de `SCC-GOV`.

## 4. Benchmarking (Modelos de Sucesso)

O modelo de negócio do SCC Protocol é testado e comprovado, seguindo os passos de alguns dos projetos mais bem-sucedidos em DeFi:

-   **MakerDAO (DAI & MKR):** O pioneiro das stablecoins colateralizadas. O modelo de `Vaults`, Taxas de Estabilidade e um token de governança que captura valor (MKR) foi validado ao longo de vários anos, gerando centenas de milhões em receita.
-   **Liquity (LUSD & LQTY):** Um protocolo que também emite uma stablecoin contra colateral de ETH. Ele utiliza um modelo de taxa única em vez de juros contínuos, mas o princípio é o mesmo: a receita do protocolo é distribuída aos stakers do token de governança (LQTY).
