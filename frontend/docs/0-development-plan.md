# Plano de Desenvolvimento - Frontend SCC Protocol

**Status:** Proposto

Este documento descreve o plano de desenvolvimento em etapas para a implementação do DApp (Frontend) do protocolo SCC.

## Milestone 1: Fundação do Projeto e UI Core

**Objetivo:** Configurar a estrutura do projeto, instalar todas as dependências, e construir o layout base da aplicação com os componentes de UI essenciais e conexão de carteira.

-   [ ] **Tarefa 1.1:** Criar o projeto Next.js (`/frontend`) com TypeScript, TailwindCSS e ESLint.
-   [ ] **Tarefa 1.2:** Instalar dependências principais: `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `zustand`, `framer-motion`, `recharts`.
-   [ ] **Tarefa 1.3:** Configurar o `shadcn/ui` e o tema base (dark/light mode).
-   [ ] **Tarefa 1.4:** Implementar os provedores de contexto (`AppProviders`) para `wagmi` e `RainbowKit` no layout principal.
-   [ ] **Tarefa 1.5:** Construir os componentes de layout principais: `Header` (com o botão de conectar carteira), `Sidebar` (para navegação) e `Footer`.
-   [ ] **Tarefa 1.6:** Criar a documentação inicial: `1-architecture.md` e `2-style-guide.md`.

## Milestone 2: Visualização de Dados (Leitura)

**Objetivo:** Integrar o frontend com o Subgraph para exibir dados do protocolo e do usuário em modo "somente leitura".

-   [ ] **Tarefa 2.1:** Implementar o serviço GraphQL (`/services/subgraph.ts`) para se comunicar com a API do Subgraph.
-   [ ] **Tarefa 2.2:** Desenvolver o Módulo de Dashboard:
    -   [ ] Criar o hook `useProtocolStats` para buscar dados globais do protocolo.
    -   [ ] Construir a página do Dashboard exibindo as métricas principais (TVL, Dívida Total, etc.) em `StatCard`s.
-   [ ] **Tarefa 2.3:** Desenvolver o Módulo de Vaults (Leitura):
    -   [ ] Criar o hook `useUserVaults` para buscar os Vaults do usuário conectado.
    -   [ ] Construir a página que lista os Vaults do usuário (`/vaults`).

## Milestone 3: Interação On-Chain (Escrita)

**Objetivo:** Habilitar a interação do usuário com os contratos, permitindo a modificação do estado da blockchain.

-   [ ] **Tarefa 3.1:** Implementar a funcionalidade de **criação de Vault** no `VaultFactory`.
-   [ ] **Tarefa 3.2:** Implementar os formulários e a lógica de transação para **gerenciamento de Vaults**:
    -   [ ] Depositar e Sacar Colateral.
    -   [ ] Gerar (Mint) e Pagar (Burn) Dívida.
-   [ ] **Tarefa 3.3:** Implementar um sistema de notificações (`toasts`) para feedback de transações (pendente, sucesso, erro).

## Milestone 4: Staking e Governança

**Objetivo:** Implementar as funcionalidades de participação no protocolo.

-   [ ] **Tarefa 4.1:** Desenvolver o Módulo de Staking:
    -   [ ] Criar a UI para stake/unstake de SCC-GOV.
    -   [ ] Implementar a lógica para `claim` de recompensas.
-   [ ] **Tarefa 4.2:** Desenvolver o Módulo de Governança:
    -   [ ] Criar a UI para listar e visualizar propostas.
    -   [ ] Implementar a funcionalidade de voto (`castVote`).

## Milestone 5: Deploy e Finalização

**Objetivo:** Preparar o DApp para produção e automatizar o processo de deploy.

-   [ ] **Tarefa 5.1:** Configurar o projeto na Vercel.
-   [ ] **Tarefa 5.2:** Criar um workflow de CI/CD no GitHub Actions para rodar `lint`, `test` e `build` a cada PR.
-   [ ] **Tarefa 5.3:** Adicionar testes unitários para os hooks e componentes críticos.
-   [ ] **Tarefa 5.4:** Revisão final da documentação e da responsividade da UI.
