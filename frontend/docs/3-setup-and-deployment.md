# 3. Setup e Deploy

**Status:** Atualizado

Este guia descreve como configurar o ambiente de desenvolvimento local e como o projeto é implantado em produção.

## 1. Setup de Desenvolvimento Local

### Pré-requisitos

-   Node.js (v20+)
-   npm (vem com o Node.js)
-   Docker e Docker Compose
-   Foundry (para o ambiente de contratos)

### Passos

1.  **Clone o repositório e instale as dependências do monorepo:**

    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd scc-protocol
    pnpm install # Instala dependências para todos os workspaces
    ```

2.  **Inicie os serviços de backend (Terminal 1):**

    Isso irá iniciar um nó Anvil local, implantar os contratos e iniciar o serviço de subgraph.

    ```bash
    # Inicia os contêineres (anvil, postgres, graph-node)
    docker compose up -d

    # Implanta os contratos e o subgraph no ambiente local
    pnpm test:integration
    ```

3.  **Inicie o servidor de desenvolvimento do frontend (Terminal 2):**

    A partir da raiz do projeto (`scc-protocol`), execute:

    ```bash
    # O pnpm irá rodar o script 'dev' do workspace 'scc-nexus-front-main'
    pnpm --filter vite_react_shadcn_ts dev
    ```

    A aplicação estará disponível em [http://localhost:8080](http://localhost:8080).

## 2. Deploy e CI/CD

-   **Plataforma de Deploy:** Vercel é a plataforma recomendada, otimizada para frontends modernos com Vite/Next.js.
-   **Integração Contínua (CI):** Um workflow de GitHub Actions (`.github/workflows/frontend-ci.yml`) deve ser configurado para rodar `lint` e `build` a cada `push` ou `pull request` para garantir a qualidade do código.
-   **Deploy Contínuo (CD):** A integração da Vercel com o GitHub pode ser configurada para fazer o deploy automático da branch `main` para produção e criar deployments de preview para cada Pull Request.
-   **Variáveis de Ambiente:** Serão gerenciadas no dashboard da Vercel para produção e em um arquivo `.env.local` para desenvolvimento. As principais variáveis serão a URL do Subgraph e o ID da Chain da rede de destino.