# 4. Frontend do Protocolo SCC

O frontend do SCC Protocol é um DApp (Decentralized Application) construído com Vite e React, servindo como a interface principal para os usuários interagirem com o ecossistema SCC. A arquitetura é projetada para ser moderna, performática, segura e modular, utilizando uma stack de tecnologias atual.

## 4.1. Stack de Tecnologia

*   **Build Tool:** Vite
*   **Framework:** React 18
*   **Linguagem:** TypeScript
*   **Roteamento:** React Router DOM v6
*   **Estilização:** TailwindCSS + shadcn/ui
*   **Integração Web3:** `wagmi` e `viem`
*   **Autenticação:** (A ser definido, com recomendações como RainbowKit ou Web3Modal)
*   **Gerenciamento de Estado:** React Query + Zustand/Jotai (conforme necessário)
*   **Visualização de Dados:** Recharts
*   **Animação:** Framer Motion

## 4.2. Diagrama de Contexto

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

## 4.3. Estrutura de Diretórios Principal (`frontend/src/`)

A arquitetura de pastas é modular e baseada em funcionalidades e tipos de arquivo, facilitando a organização e manutenção do código:

```
/src
├── /components/           # Componentes de UI reutilizáveis (incluindo shadcn/ui)
│   ├── /Dashboard/        # Componentes específicos da página Dashboard
│   ├── /Layout/           # Componentes de layout (Header, Footer, Sidebar, etc.)
│   └── /ui/               # Componentes base do shadcn/ui
├── /hooks/                # Hooks customizados para lógica reutilizável (ex: use-toast, use-mobile)
├── /lib/                  # Utilitários e funções auxiliares (ex: cn para classes CSS, utils gerais)
├── /pages/                # Componentes de página, que correspondem às rotas da aplicação
├── /services/             # Módulos para interação com APIs externas ou serviços específicos
├── App.css                # Estilos CSS globais da aplicação
├── App.tsx                # Componente raiz da aplicação, responsável por provedores e roteamento
├── main.tsx               # Ponto de entrada da aplicação React
└── index.css              # Estilos CSS globais e variáveis do TailwindCSS
```

## 4.4. Interação com o Protocolo

O frontend atua como a principal interface para o usuário interagir com o protocolo SCC:

*   **Leitura de Dados:** Utiliza a API GraphQL fornecida pelo Subgraph para exibir dados históricos e em tempo real do protocolo, como o estado dos Vaults, saldos de tokens, histórico de transações e informações de governança.
*   **Envio de Transações:** Permite que os usuários enviem transações diretamente para a blockchain através de suas carteiras Web3 (ex: MetaMask). Isso inclui ações como criar Vaults, depositar/retirar colateral, mintar/queimar `SCC-USD`, fazer staking de `SCC-GOV`, participar de leilões de liquidação e votar em propostas de governança.

## 4.5. Considerações de Design e UX

O design do frontend prioriza uma experiência de usuário intuitiva e responsiva, seguindo as diretrizes de Material Design e utilizando componentes `shadcn/ui` para garantir consistência visual e acessibilidade. A navegação é clara, e as informações são apresentadas de forma concisa para facilitar a compreensão do estado complexo do protocolo DeFi.
