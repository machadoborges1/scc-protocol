# 1. Arquitetura do Frontend

**Status:** Proposto

## 1. Visão Geral

O frontend do SCC Protocol é um DApp (Decentralized Application) construído com Next.js, servindo como a interface principal para os usuários interagirem com o ecossistema SCC. A arquitetura é projetada para ser moderna, performática, segura e modular.

## 2. Stack de Tecnologia

-   **Framework:** Next.js 14 (com App Router)
-   **Linguagem:** TypeScript
-   **Estilização:** TailwindCSS + shadcn/ui
-   **Integração Web3:** `wagmi` e `viem`
-   **Autenticação:** `@rainbow-me/rainbowkit`
-   **Gerenciamento de Estado:** Zustand
-   **Visualização de Dados:** Recharts
-   **Animação:** Framer Motion

## 3. Diagrama de Contexto

```mermaid
graph TD
    subgraph User[Usuário Final]
    subgraph Browser[Navegador Web]
        DApp[Frontend SCC (Next.js)]
    end
    subgraph Blockchain[Blockchain]
        Contracts[Contratos SCC]
    end
    subgraph Indexer[Serviços de Indexação]
        Subgraph[API GraphQL do Subgraph]
    end

    User -- "Interage com" --> DApp
    DApp -- "Lê estado do protocolo via" --> Subgraph
    DApp -- "Lê estado on-chain e envia transações via" --> Blockchain
```

## 4. Estrutura de Diretórios Principal

A arquitetura de pastas é modular e baseada em funcionalidades (`features`).

```
/frontend
├── /src
│   ├── /app/                  # Páginas e rotas
│   ├── /components/           # Componentes de UI compartilhados (shadcn/ui, etc.)
│   ├── /features/             # Módulos de funcionalidades (vaults, governance)
│   ├── /hooks/                # Hooks globais e reutilizáveis
│   ├── /lib/                  # Configurações (wagmi) e utilitários
│   ├── /services/             # Lógica de comunicação com APIs (Subgraph)
│   └── /styles/               # CSS global e configuração do Tailwind
└── ...
```
