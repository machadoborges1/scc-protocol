# Documento de Estratégias DeFi

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
Status: Ativo

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

## 4. Estratégia 3: Expansão de Tipos de Colateral

Esta estratégia é fundamental para a escalabilidade e segurança de longo prazo do protocolo.

- **Objetivo:** Aumentar a base de colateral do protocolo, diversificar o risco e atrair novos públicos de usuários.
- **Plano de Ação:**
    1. **Adicionar wBTC:** O primeiro passo lógico é adicionar **Wrapped Bitcoin (wBTC)** como um tipo de colateral. Isso abrirá o protocolo ao vasto mercado de detentores de Bitcoin.
    2. **Governança:** A adição de novos colaterais será um processo gerenciado pela governança, que votará para aprovar um novo ativo e configurar seu respectivo oráculo de preço no `OracleManager`.

## 5. Estratégias Futuras

Após a implementação bem-sucedida das estratégias iniciais, o protocolo poderá explorar vetores de crescimento mais avançados:

### 5.1. Colaterais Geradores de Rendimento (LSTs e LRTs)
-   **O que são:** Liquid Staking Tokens (ex: stETH, rETH) e Liquid Restaking Tokens.
-   **Estratégia:** Permitir que os usuários usem esses ativos como colateral. Como os próprios ativos geram rendimento, o custo efetivo do empréstimo para o usuário diminui drasticamente, tornando o SCC-USD uma das opções de empréstimo mais baratas e atraentes do mercado.

### 5.2. Módulo de Estabilidade de Peg (PSM)
-   **O que é:** Um contrato que permite trocas 1:1 entre `SCC-USD` e outras stablecoins centrais (como USDC) com uma taxa mínima.
-   **Estratégia:** Implementar um PSM para fortalecer a paridade da `SCC-USD` com o dólar. Isso cria um mecanismo de arbitragem robusto que garante a estabilidade do preço, aumentando a confiança e a utilidade da stablecoin como meio de troca.

### 5.3. Ativos do Mundo Real (RWA - Real-World Assets)
-   **O que é:** A tokenização de ativos tradicionais, como títulos do tesouro, hipotecas ou faturas.
-   **Estratégia:** Explorar parcerias para trazer RWA para o protocolo como colateral. Isso diversifica o risco para fora do ecossistema cripto e abre um caminho para escalar a emissão de `SCC-USD` em ordens de magnitude, atendendo a um mercado de trilhões de dólares.

### 5.4. Protocol Owned Liquidity (POL)
-   **Estratégia:** A tesouraria do protocolo, controlada pela governança, pode usar parte de sua receita para adquirir e possuir permanentemente tokens LP do pool da Curve. Isso garante um nível mínimo de liquidez para sempre, tornando o `SCC-USD` mais resiliente a choques de mercado.

### 5.5. Vaults de Estratégia
-   **Estratégia:** Criação de contratos que implementam estratégias de yield farming automatizadas para os usuários, usando a `SCC-USD` como ativo base, aumentando sua utilidade dentro do próprio ecossistema.
