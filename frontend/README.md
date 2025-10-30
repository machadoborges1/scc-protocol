# Frontend do Protocolo SCC

Este diretório contém o código-fonte do DApp (Decentralized Application) do Protocolo SCC, que serve como a interface principal para os usuários interagirem com o ecossistema SCC.

## Visão Geral

O frontend oferece uma experiência de usuário intuitiva para:

*   **Gerenciar Vaults:** Criar, depositar colateral, mintar e queimar `SCC-USD`.
*   **Staking:** Fazer staking de `SCC-GOV` e reivindicar recompensas.
*   **Leilões:** Participar de leilões de liquidação.
*   **Governança:** Votar em propostas e delegar poder de voto.
*   **Visualizar Dados:** Acompanhar o estado do protocolo e suas posições através de um dashboard.

## Stack de Tecnologia

O DApp é construído com uma stack moderna:

*   **Build Tool:** Vite
*   **Framework:** React 18
*   **Linguagem:** TypeScript
*   **Estilização:** TailwindCSS + shadcn/ui
*   **Integração Web3:** `wagmi` e `viem`

## Desenvolvimento Local

Para rodar o frontend localmente, certifique-se de que o ambiente Docker Compose do monorepo esteja ativo (`docker compose up -d`).

1.  **Instalar dependências:**
    ```bash
    pnpm install
    ```
2.  **Iniciar o servidor de desenvolvimento:**
    ```bash
    pnpm --filter @scc/frontend dev
    ```

## Aprofunde-se na Documentação

Para uma análise detalhada da arquitetura do frontend, fluxo de dados e interação com o protocolo, consulte a [documentação completa do projeto](../docs/README.md).