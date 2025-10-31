# 4. SCC Protocol Frontend

The SCC Protocol frontend is a DApp (Decentralized Application) built with Vite and React, serving as the main interface for users to interact with the SCC ecosystem. The architecture is designed to be modern, performant, secure, and modular, using a current technology stack.

## 4.1. Technology Stack

*   **Build Tool:** Vite
*   **Framework:** React 18
*   **Language:** TypeScript
*   **Routing:** React Router DOM v6
*   **Styling:** TailwindCSS + shadcn/ui
*   **Web3 Integration:** `wagmi` and `viem`
*   **Authentication:** (To be defined, with recommendations like RainbowKit or Web3Modal)
*   **State Management:** React Query + Zustand/Jotai (as needed)
*   **Data Visualization:** Recharts
*   **Animation:** Framer Motion

## 4.2. Context Diagram

```mermaid
graph TD
    subgraph User[End User]
    subgraph Browser[Web Browser]
        DApp[SCC Frontend (Vite + React)]
    end
    subgraph Blockchain[Blockchain]
        Contracts[SCC Contracts]
    end
    subgraph Indexer[Indexing Services]
        Subgraph[Subgraph GraphQL API]
    end

    User -- "Interacts with" --> DApp
    DApp -- "Reads protocol state via" --> Subgraph
    DApp -- "Reads on-chain state and sends transactions via" --> Blockchain
```

## 4.3. Main Directory Structure (`frontend/src/`)

The folder architecture is modular and based on functionalities and file types, facilitating code organization and maintenance:

```
/src
├── /components/           # Reusable UI components (including shadcn/ui)
│   ├── /Dashboard/        # Components specific to the Dashboard page
│   ├── /Layout/           # Layout components (Header, Footer, Sidebar, etc.)
│   └── /ui/               # Base components from shadcn/ui
├── /hooks/                # Custom hooks for reusable logic (e.g., use-toast, use-mobile)
├── /lib/                  # Utilities and helper functions (e.g., cn for CSS classes, general utils)
├── /pages/                # Page components, which correspond to the application's routes
├── /services/             # Modules for interaction with external APIs or specific services
├── App.css                # Global CSS styles for the application
├── App.tsx                # Root component of the application, responsible for providers and routing
├── main.tsx               # Entry point of the React application
└── index.css              # Global CSS styles and TailwindCSS variables
```

## 4.4. Interaction with the Protocol

The frontend acts as the main interface for the user to interact with the SCC protocol:

*   **Data Reading:** Uses the GraphQL API provided by the Subgraph to display historical and real-time data from the protocol, such as the state of Vaults, token balances, transaction history, and governance information.
*   **Sending Transactions:** Allows users to send transactions directly to the blockchain through their Web3 wallets (e.g., MetaMask). This includes actions like creating Vaults, depositing/withdrawing collateral, minting/burning `SCC-USD`, staking `SCC-GOV`, participating in liquidation auctions, and voting on governance proposals.

## 4.5. Design and UX Considerations

The frontend design prioritizes an intuitive and responsive user experience, following Material Design guidelines and using `shadcn/ui` components to ensure visual consistency and accessibility. Navigation is clear, and information is presented concisely to facilitate understanding of the complex state of the DeFi protocol.