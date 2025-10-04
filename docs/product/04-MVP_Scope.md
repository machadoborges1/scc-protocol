# Documento de Escopo do MVP

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
**Status:** Ativo

## 1. Introdução

Este documento tem como objetivo definir com clareza o escopo do Produto Mínimo Viável (MVP) do SCC Protocol. A definição de um MVP claro é crucial para focar os esforços de desenvolvimento, teste e auditoria na funcionalidade essencial para um lançamento seguro e bem-sucedido.

Ele traça a linha entre o produto principal a ser lançado e as subsequentes estratégias de crescimento e expansão.

## 2. Componentes do MVP (Produto Mínimo Viável)

O MVP consiste em um protocolo de empréstimo colateralizado totalmente funcional, seguro e governado pela comunidade. Ele deve ser capaz de operar de forma autônoma e demonstrar seu ciclo de receita completo.

### 2.1. Funcionalidade Principal de Empréstimo

-   **Criação de Vaults:** Implantação do `VaultFactory` para permitir que usuários criem seus próprios `Vaults` (posições de dívida).
-   **Gestão de Colateral e Dívida:** Funcionalidade completa nos `Vaults` para:
    -   Depositar um único tipo de colateral (ex: WETH).
    -   Emitir (`mint`) a stablecoin `SCC-USD`.
    -   Pagar a dívida (`burn`) com `SCC-USD`.
    -   Retirar o colateral.
-   **Tokens Fundamentais:** Os contratos `SCC-USD` (ERC20) e `SCC-GOV` (ERC20Votes) totalmente implementados.

### 2.2. Mecanismos de Segurança e Solvência

-   **Oráculos de Preço:** O `OracleManager` integrado com a rede principal da Chainlink para fornecer preços confiáveis e seguros para o ativo de colateral inicial.
-   **Liquidações:** O `LiquidationManager` totalmente funcional, utilizando Leilões Holandeses para garantir a solvência do protocolo de forma eficiente.
-   **Controle de Acesso Robusto:** Implementação completa da arquitetura de controle de acesso híbrida (Timelock, RBAC, Capabilities) para proteger funções administrativas.

### 2.3. Governança e Captura de Valor

-   **Ciclo de Governança:** O `SCC_Governor` e o `TimelockController` operacionais, permitindo que detentores de `SCC-GOV` criem propostas, votem e executem mudanças no protocolo de forma descentralizada.
-   **Distribuição de Receita:** O `StakingPool` funcional, capaz de receber as taxas geradas pelo protocolo e distribuí-las aos stakers de `SCC-GOV`.

## 3. Componentes Pós-MVP (Estratégias de Crescimento)

Estes componentes são planejados para serem desenvolvidos e implementados após o lançamento bem-sucedido e a estabilização do MVP. Eles estão detalhados no documento `05-DeFi_Strategies.md`.

### 3.1. Fase 1: Lançamento e Liquidez (Pós-lançamento imediato)

-   **Foco:** Tornar a `SCC-USD` útil e acessível.
-   **Iniciativas:**
    -   Criação de um pool de liquidez primário na Curve Finance (`SCC-USD`/`3CRV`).
    -   Lançamento de programas de incentivo (`Liquidity Mining`) para atrair provedores de liquidez.

### 3.2. Fase 2: Expansão e Utilidade (Curto a Médio Prazo)

-   **Foco:** Aumentar a escala e a utilidade da `SCC-USD`.
-   **Iniciativas:**
    -   **Expansão de Colaterais:** Adicionar suporte a novos ativos, como `wBTC` e Liquid Staking Tokens (`LSTs`).
    -   **Integração com o Ecossistema:** Listar a `SCC-USD` em mercados monetários (ex: Aave, Compound).

### 3.3. Fase 3: Evolução do Protocolo (Longo Prazo)

-   **Foco:** Solidificar a posição do protocolo no mercado e explorar novas fronteiras.
-   **Iniciativas:**
    -   Implementação de um Módulo de Estabilidade de Peg (**PSM**).
    -   Pesquisa e desenvolvimento para a integração de Ativos do Mundo Real (**RWA**).
    -   Criação de uma reserva de liquidez permanente através de Protocol Owned Liquidity (**POL**).
