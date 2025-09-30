# Documento de Estratégias DeFi

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
**Status:** Rascunho

## 1. Introdução

O sucesso da stablecoin SCC-USD depende de sua profunda integração e utilidade no ecossistema DeFi. Uma stablecoin sem liquidez e sem casos de uso tem pouco valor. Este documento descreve as estratégias iniciais para bootstrap a liquidez da SCC-USD e impulsionar sua adoção.

As estratégias serão incentivadas com emissões do token de governança, SCC-GOV, conforme descrito no documento de Tokenomics.

## 2. Estratégia 1: Pool de Liquidez em AMM (Foco em Liquidez)

Esta é a estratégia de maior prioridade para o lançamento, pois garante que usuários possam comprar e vender SCC-USD com baixo slippage.

- **Objetivo:** Criar um mercado líquido para a SCC-USD contra outras stablecoins estabelecidas.

- **Plataforma Proposta:** **Curve Finance**.
    - **Pool:** Um "metapool" que pareia **SCC-USD** com o pool base **3CRV** (DAI+USDC+USDT). Este é o padrão da indústria para novas stablecoins e oferece acesso imediato à liquidez das principais stablecoins.

- **Mecanismo de Incentivo:**
    1.  Usuários depositam SCC-USD e/ou 3CRV no pool da Curve para receber tokens LP (Liquidity Provider).
    2.  O protocolo SCC terá um contrato de `StakingPool` onde os usuários poderão depositar (fazer stake) seus tokens LP da Curve.
    3.  O `StakingPool` distribuirá recompensas em **SCC-GOV** para esses usuários, proporcionalmente à sua participação.

## 3. Estratégia 2: Integração com Mercados Monetários (Foco em Utilidade)

Ser listada como um ativo em grandes mercados monetários (money markets) aumenta drasticamente a utilidade da SCC-USD.

- **Objetivo:** Permitir que usuários emprestem e tomem emprestado SCC-USD e a usem como colateral em plataformas como Aave e Compound.

- **Plataformas Alvo:** **Aave**, **Compound**, **Euler**.

- **Plano de Ação:**
    1.  **Fase 1 (Pós-Lançamento):** Focar na Estratégia 1 para atingir um volume de negociação e uma capitalização de mercado significativos. A estabilidade da paridade (peg) deve ser comprovada por vários meses.
    2.  **Fase 2:** Iniciar conversas com as comunidades de governança da Aave e Compound.
    3.  **Fase 3:** Submeter uma proposta formal de governança em cada plataforma para listar a SCC-USD. A proposta deve destacar a segurança do nosso protocolo, a liquidez do ativo e os benefícios para a plataforma.

## 4. Estratégias Futuras

Após a implementação bem-sucedida das estratégias iniciais, o protocolo poderá explorar:

-   **Protocol Owned Liquidity (POL):** A tesouraria do protocolo, controlada pela governança, pode usar parte de sua receita para adquirir e possuir permanentemente tokens LP do pool da Curve, garantindo um nível mínimo de liquidez para sempre.
-   **Vaults de Estratégia:** Criação de contratos que implementam estratégias de yield farming automatizadas para os usuários, usando a SCC-USD como ativo base.
