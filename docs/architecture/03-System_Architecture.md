# Documento de Arquitetura do Sistema

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.2
Status: Ativo

## 1. Introdução

Este documento descreve a arquitetura técnica do protocolo SCC, detalhando os componentes on-chain (smart contracts) e off-chain (serviços auxiliares) e como eles interagem para formar um sistema coeso e robusto. O objetivo é fornecer uma visão clara da estrutura do sistema, seus fluxos de dados e as tecnologias empregadas.

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

O sistema on-chain é composto por um conjunto de smart contracts modulares e atualizáveis (usando o padrão UUPS/Proxy), implantados na rede Ethereum. Eles formam o núcleo do protocolo, gerenciando a lógica de colateralização, emissão de stablecoin, oráculos e governança.

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

O processo de minting de SCC-USD ilustra a interação entre o usuário e os contratos on-chain:

1.  **Usuário** chama a função `createNewVault()` no `VaultFactory`.
2.  `VaultFactory` deploya um novo `Vault` (proxy) e transfere a posse (NFT) para o **Usuário**.
3.  **Usuário** chama `deposit(amount)` no seu `Vault`, transferindo o colateral (ex: WETH) para o contrato.
4.  **Usuário** chama `mint(amount)` no seu `Vault`.
5.  O `Vault` consulta o `OracleManager` para obter o preço atual do colateral.
6.  O `Vault` calcula o CR resultante e verifica se está acima do MCR.
7.  Se for válido, o `Vault` chama a função `mint(user, amount)` no contrato `SCC_USD`.
8.  `SCC_USD` cria a quantidade de tokens e os transfere para o **Usuário**.

## 4. Arquitetura Off-Chain

Componentes que rodam fora da blockchain, mas são essenciais para a operação, monitoramento e usabilidade do protocolo. Eles interagem com a blockchain via nós RPC e processam dados para diversas finalidades.

1.  **Keepers (Bots):**
    - **Responsabilidade:** Monitorar o estado de todos os Vaults e garantir a solvência do protocolo.
    - **Ação:** Quando um Vault se torna insolvente (CR < MCR), o bot chama a função `startAuction()` no `LiquidationManager` para iniciar o leilão.
    - **Tecnologia:** TypeScript/Node.js com `viem`/`ethers.js`.
    - **Detalhes:** Para mais informações, consulte `offchain/docs/ARCHITECTURE.md`.

2.  **Serviço de Indexação (The Graph):**
    - **Responsabilidade:** Fornecer uma maneira rápida e eficiente de consultar dados históricos e em tempo real do protocolo.
    - **Ação:** Escuta eventos dos contratos (ex: `VaultCreated`, `CollateralDeposited`, `Liquidated`) e os armazena em uma API GraphQL.
    - **Tecnologia:** The Graph (ou SubQuery).
    - **Detalhes:** Para mais informações, consulte `subgraph/README.md` (a ser criado).

3.  **Frontend (DApp):**
    - **Responsabilidade:** Interface de usuário para interagir com o protocolo.
    - **Ação:** Leituras de dados via serviço de indexação (GraphQL); Envio de transações via carteira do usuário (RPC).
    - **Tecnologia:** React/Next.js com `viem`/`ethers.js`.

## 5. Fluxo de Dados e Interações

O fluxo de dados no protocolo SCC é bidirecional, envolvendo interações on-chain e off-chain:

*   **Usuário para Blockchain:** O Frontend (DApp) permite que o usuário envie transações (mint, stake, etc.) diretamente para a Blockchain via um nó RPC.
*   **Blockchain para Serviços Off-Chain:** Eventos emitidos pelos contratos inteligentes são capturados pelo Serviço de Indexação (The Graph) e pelo Bot Keeper. O Keeper também consulta o estado da blockchain via RPC.
*   **Serviços Off-Chain para Blockchain:** O Bot Keeper, ao identificar condições específicas (ex: Vault insolvente), envia transações para a Blockchain (ex: `startAuction`).
*   **Serviços Off-Chain para Frontend:** O Frontend consulta o Serviço de Indexação (The Graph) via GraphQL para exibir dados históricos e em tempo real aos usuários.

## 6. Tecnologia Stack

O protocolo SCC é construído sobre uma stack tecnológica moderna e robusta, abrangendo desenvolvimento on-chain e off-chain:

*   **Smart Contracts:** Solidity, Foundry (Forge, Anvil).
*   **Desenvolvimento Off-Chain (Keeper):** TypeScript, Node.js, Viem, Pino (logging), Prom-client (métricas), Docker.
*   **Indexação (Subgraph):** The Graph Protocol, GraphQL, AssemblyScript (para mappings).
*   **Frontend (DApp):** React/Next.js, Viem.
*   **Infraestrutura:** Docker, Docker Compose, Prometheus.

## 7. Considerações de Segurança

A segurança é a prioridade máxima do protocolo SCC. Todas as camadas da arquitetura são projetadas com foco em resiliência e proteção contra vulnerabilidades. Para uma análise detalhada das metodologias de teste, auditorias, controle de acesso e gestão de chaves, consulte o documento `docs/architecture/04-Security_Plan.md`.