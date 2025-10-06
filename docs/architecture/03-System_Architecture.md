# Documento de Arquitetura do Sistema

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
Status: Ativo

## 1. Introdução

Este documento descreve a arquitetura técnica do protocolo SCC, detalhando os componentes on-chain (smart contracts) e off-chain (serviços auxiliares) e como eles interagem para formar um sistema coeso e robusto.

## 2. Diagrama da Arquitetura

```mermaid
graph TD
    subgraph Usuário
        A[Frontend DApp]
    end

    subgraph Serviços Off-Chain
        B[Serviço de Indexação (The Graph)]
        C[Bot Keeper (Liquidações)]
    end

    subgraph Blockchain (Nó RPC)
        D[Nó da Blockchain]
    end

    subgraph Contratos On-Chain
        E[VaultFactory]
        F[Vault]
        G[OracleManager]
        H[LiquidationManager]
        I[SCC_USD]
        J[SCC_GOV]
        K[StakingPool]
        L[SCC_Governor]
        M[Timelock]
    end

    A -- "Lê dados via GraphQL" --> B
    A -- "Envia transações (mint, stake, etc)" --> D
    B -- "Indexa eventos dos contratos" --> D
    C -- "Monitora Vaults e chama `startAuction`" --> D
    D -- "Interage com" --> E
    D -- "Interage com" --> F
    D -- "Interage com" --> H
    D -- "Interage com" --> K
    D -- "Interage com" --> L

    F -- "Consulta preço" --> G
    H -- "Consulta preço" --> G
    F -- "Cria/Queima" --> I
    L -- "Executa propostas via" --> M
    M -- "Gerencia" --> E
    M -- "Gerencia" --> G
    M -- "Gerencia" --> H
    M -- "Gerencia" --> K

    style A fill:#cde4ff
    style B fill:#d2ffd2
    style C fill:#d2ffd2
    style D fill:#ffe4b5

```

## 3. Arquitetura On-Chain

O sistema on-chain é composto por um conjunto de smart contracts modulares e atualizáveis (usando o padrão UUPS/Proxy).

| Contrato                 | Padrão      | Responsabilidade Principal                                                              |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------- |
| **VaultFactory**         | Custom      | Fábrica para criar e rastrear novos Vaults.                                             |
| **Vault**                | ERC721      | Contrato individual que detém o colateral e a dívida de um usuário. A posse é um NFT.     |
| **SCC_USD**              | ERC20       | A implementação do token stablecoin, com permissões de mint/burn para os Vaults.          |
| **SCC_GOV**              | ERC20       | A implementação do token de governança.                                                 |
| **OracleManager**        | Custom      | Agrega e fornece os preços dos ativos de colateral, abstraindo a fonte (ex: Chainlink). |
| **LiquidationManager**   | Custom      | Gerencia o processo de leilão de colateral de Vaults insolventes.                       |
| **Governance**           | Custom      | Contrato de Timelock + Governador (baseado no OpenZeppelin Governor). Permite votações. |
| **StakingPool**          | Custom      | Permite que usuários façam stake de SCC-GOV para receber parte da receita do protocolo.  |

### Fluxo de Interação (Exemplo: Mint de SCC-USD)

1.  **Usuário** chama a função `createNewVault()` no `VaultFactory`.
2.  `VaultFactory` deploya um novo `Vault` (proxy) e transfere a posse (NFT) para o **Usuário**.
3.  **Usuário** chama `deposit(amount)` no seu `Vault`, transferindo o colateral (ex: WETH) para o contrato.
4.  **Usuário** chama `mint(amount)` no seu `Vault`.
5.  O `Vault` consulta o `OracleManager` para obter o preço atual do colateral.
6.  O `Vault` calcula o CR resultante e verifica se está acima do MCR.
7.  Se for válido, o `Vault` chama a função `mint(user, amount)` no contrato `SCC_USD`.
8.  `SCC_USD` cria a quantidade de tokens e os transfere para o **Usuário**.

## 4. Arquitetura Off-Chain

Componentes que rodam fora da blockchain, mas são essenciais para a operação e usabilidade do protocolo.

1.  **Keepers (Bots):**
    - **Responsabilidade:** Monitorar o estado de todos os Vaults.
    - **Ação:** Quando um Vault se torna insolvente (CR < MCR), o bot chama a função `startAuction()` no `LiquidationManager` para iniciar o leilão.
    - **Tecnologia:** TypeScript/Node.js com `viem`/`ethers.js`.

2.  **Serviço de Indexação:**
    - **Responsabilidade:** Fornecer uma maneira rápida e eficiente de consultar dados do protocolo.
    - **Ação:** Escuta eventos dos contratos (ex: `VaultCreated`, `CollateralDeposited`, `Liquidated`) e os armazena em uma API GraphQL.
    - **Tecnologia:** The Graph (ou SubQuery).

3.  **Frontend:**
    - **Responsabilidade:** Interface de usuário para interagir com o protocolo.
    - **Ação:** Leituras via serviço de indexação; Escritas via carteira do usuário (RPC).
    - **Tecnologia:** React/Next.js com `viem`/`ethers.js`.
