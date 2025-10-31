# 1. Frontend Architecture

**Status:** Updated

## 1. Overview

The SCC Protocol frontend is a DApp (Decentralized Application) built with Vite and React, serving as the main interface for users to interact with the SCC ecosystem. The architecture is designed to be modern, performant, secure, and modular, using a current technology stack.

## 2. Technology Stack

-   **Build Tool:** Vite
-   **Framework:** React 18
-   **Language:** TypeScript
-   **Routing:** React Router DOM v6
-   **Styling:** TailwindCSS + shadcn/ui
-   **Web3 Integration:** `wagmi` and `viem` (to be integrated)
-   **Authentication:** To be defined (RainbowKit or Web3Modal are recommended)
-   **State Management:** React Query + Zustand/Jotai (as needed)
-   **Data Visualization:** Recharts
-   **Animation:** Framer Motion

## 3. Context Diagram

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

## 4. Main Directory Structure

The folder architecture is modular and based on functionalities and file types.

```
/src
├── /components/           # UI Components (including shadcn/ui)
│   ├── /Dashboard/        # Dashboard-specific components
│   ├── /Layout/           # Header, Footer, etc.
│   └── /ui/               # Base shadcn components
├── /hooks/                # Custom hooks (e.g., use-toast, use-mobile)
├── /lib/                  # Utilities (e.g., cn, utils)
├── /pages/                # Page components (routes)
├── App.tsx                # Root component with providers and routing
├── main.tsx               # Application entry point
└── index.css              # Global styles and Tailwind variables
```
