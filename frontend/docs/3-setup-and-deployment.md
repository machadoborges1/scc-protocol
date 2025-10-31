# 3. Setup and Deployment

**Status:** Updated

This guide describes how to set up the local development environment and how the project is deployed to production.

## 1. Local Development Setup

### Prerequisites

-   Node.js (v20+)
-   npm (comes with Node.js)
-   Docker and Docker Compose
-   Foundry (for the contracts environment)

### Steps

1.  **Clone the repository and install the monorepo dependencies:**

    ```bash
    git clone <REPOSITORY_URL>
    cd scc-protocol
    pnpm install # Installs dependencies for all workspaces
    ```

2.  **Start the backend services (Terminal 1):**

    This will start a local Anvil node, deploy the contracts, and start the subgraph service.

    ```bash
    # Starts the containers (anvil, postgres, graph-node)
    docker compose up -d

    # Deploys the contracts and the subgraph to the local environment
    pnpm test:integration
    ```

3.  **Start the frontend development server (Terminal 2):**

    From the project root (`scc-protocol`), run:

    ```bash
    # pnpm will run the 'dev' script of the 'scc-nexus-front-main' workspace
    pnpm --filter vite_react_shadcn_ts dev
    ```

    The application will be available at [http://localhost:8080](http://localhost:8080).

## 2. Deployment and CI/CD

-   **Deployment Platform:** Vercel is the recommended platform, optimized for modern frontends with Vite/Next.js.
-   **Continuous Integration (CI):** A GitHub Actions workflow (`.github/workflows/frontend-ci.yml`) should be configured to run `lint` and `build` on each `push` or `pull request` to ensure code quality.
-   **Continuous Deployment (CD):** Vercel's integration with GitHub can be configured to automatically deploy the `main` branch to production and create preview deployments for each Pull Request.
-   **Environment Variables:** They will be managed in the Vercel dashboard for production and in a `.env.local` file for development. The main variables will be the Subgraph URL and the Chain ID of the target network.
