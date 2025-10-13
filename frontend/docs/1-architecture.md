# 1. Arquitetura do Frontend

**Status:** Atualizado

## 1. Visão Geral

O frontend do SCC Protocol é um DApp (Decentralized Application) construído com Vite e React, servindo como a interface principal para os usuários interagirem com o ecossistema SCC. A arquitetura é projetada para ser moderna, performática, segura e modular, utilizando uma stack de tecnologias atual.

## 2. Stack de Tecnologia

-   **Build Tool:** Vite
-   **Framework:** React 18
-   **Linguagem:** TypeScript
-   **Roteamento:** React Router DOM v6
-   **Estilização:** TailwindCSS + shadcn/ui
-   **Integração Web3:** `wagmi` e `viem` (a ser integrado)
-   **Autenticação:** A ser definido (RainbowKit ou Web3Modal são recomendados)
-   **Gerenciamento de Estado:** React Query + Zustand/Jotai (conforme necessário)
-   **Visualização de Dados:** Recharts
-   **Animação:** Framer Motion

## 3. Diagrama de Contexto

```mermaid
graph TD
    subgraph User[Usuário Final]
    subgraph Browser[Navegador Web]
        DApp[Frontend SCC (Vite + React)]
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

A arquitetura de pastas é modular e baseada em funcionalidades e tipos de arquivo.

```
/src
├── /components/           # Componentes de UI (incluindo shadcn/ui)
│   ├── /Dashboard/        # Componentes específicos do Dashboard
│   ├── /Layout/           # Header, Footer, etc.
│   └── /ui/               # Componentes base do shadcn
├── /hooks/                # Hooks customizados (ex: use-toast, use-mobile)
├── /lib/                  # Utilitários (ex: cn, utils)
├── /pages/                # Componentes de página (rotas)
├── App.tsx                # Componente raiz com provedores e roteamento
├── main.tsx               # Ponto de entrada da aplicação
└── index.css              # Estilos globais e variáveis do Tailwind
```