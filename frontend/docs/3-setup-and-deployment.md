# 3. Setup e Deploy

**Status:** Proposto

Este guia descreve como configurar o ambiente de desenvolvimento local e como o projeto é implantado em produção.

## 1. Setup de Desenvolvimento Local

### Pré-requisitos

-   Node.js (v20+)
-   pnpm
-   Docker e Docker Compose
-   Foundry

### Passos

1.  **Clone o repositório e instale as dependências:**

    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd scc-protocol
    pnpm install
    ```

2.  **Inicie os serviços de backend (Terminal 1):**

    ```bash
    docker compose up -d
    pnpm test:integration # Implanta contratos e o subgraph
    ```

3.  **Inicie o servidor de desenvolvimento do frontend (Terminal 2):**

    ```bash
    pnpm --filter frontend dev
    ```

    A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## 2. Deploy e CI/CD

-   **Plataforma de Deploy:** Vercel, otimizada para Next.js.
-   **Integração Contínua (CI):** Um workflow de GitHub Actions (`.github/workflows/frontend-ci.yml`) será executado a cada `push` ou `pull request`, rodando verificações de `lint`, `test` e `build` para garantir a qualidade do código.
-   **Deploy Contínuo (CD):** A integração da Vercel com o GitHub fará o deploy automático da branch `main` para produção e criará deployments de preview para cada Pull Request.
-   **Variáveis de Ambiente:** Serão gerenciadas no dashboard da Vercel para produção e em um arquivo `.env.local` para desenvolvimento.
