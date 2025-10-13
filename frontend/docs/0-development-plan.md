# Plano de Desenvolvimento - Frontend SCC Protocol

**Status:** Atualizado

Este documento descreve o plano de desenvolvimento em etapas para a implementação e finalização do DApp (Frontend) do protocolo SCC.

## Milestone 1: Fundação do Projeto e UI Core (Concluído)

**Objetivo:** Configurar a estrutura do projeto, instalar dependências e construir o layout base da aplicação com os componentes de UI essenciais.

-   [x] **Tarefa 1.1:** Criar o projeto com Vite, React, TypeScript, TailwindCSS e ESLint.
-   [x] **Tarefa 1.2:** Instalar dependências de UI: `shadcn/ui`, `recharts`, `react-router-dom`.
-   [x] **Tarefa 1.3:** Configurar o `shadcn/ui` e o tema base (dark/light mode).
-   [x] **Tarefa 1.4:** Implementar os componentes de layout principais: `Header` (com navegação) e estrutura de páginas.
-   [x] **Tarefa 1.5:** Criar as páginas e componentes de UI para todas as seções principais (Dashboard, Vaults, Staking, etc.) com dados mockados.
-   [x] **Tarefa 1.6:** Criar a documentação inicial do projeto.

## Milestone 2: Conectividade Web3 e Leitura de Dados

**Objetivo:** Integrar o frontend com a blockchain e o Subgraph para exibir dados reais do protocolo e do usuário.

-   [ ] **Tarefa 2.1:** Instalar e configurar `wagmi`, `viem` e `RainbowKit` (ou Web3Modal) para conexão de carteira.
-   [ ] **Tarefa 2.2:** Implementar o botão `ConnectWallet` no Header e exibir o estado da conexão (endereço, rede).
-   [ ] **Tarefa 2.3:** Implementar um serviço GraphQL para se comunicar com a API do Subgraph.
-   [ ] **Tarefa 2.4:** Substituir os dados mockados no Módulo de Dashboard por dados reais do Subgraph (`useProtocolStats`).
-   [ ] **Tarefa 2.5:** Substituir os dados mockados no Módulo de Vaults por dados reais do Subgraph (`useUserVaults`).
-   [ ] **Tarefa 2.6:** Substituir os dados mockados nas páginas de Staking, Leilões e Governança por dados do Subgraph.

## Milestone 3: Interação On-chain (Escrita)

**Objetivo:** Habilitar a interação do usuário com os smart contracts, permitindo a modificação do estado da blockchain.

-   [ ] **Tarefa 3.1:** Implementar a funcionalidade de **criação de Vault** (chamada para `VaultFactory.createNewVault()`).
-   [ ] **Tarefa 3.2:** Implementar os formulários e a lógica de transação para **gerenciamento de Vaults**:
    -   [ ] Depositar e Sacar Colateral (`depositCollateral`, `withdrawCollateral`).
    -   [ ] Gerar (Mint) e Pagar (Burn) Dívida (`mint`, `burn`).
-   [ ] **Tarefa 3.3:** Implementar o Módulo de Staking:
    -   [ ] Lógica para `stake`, `unstake` e `getReward` no `StakingPool`.
-   [ ] **Tarefa 3.4:** Implementar o Módulo de Leilões:
    -   [ ] Lógica para `buy` no `LiquidationManager`.
-   [ ] **Tarefa 3.5:** Implementar o Módulo de Governança:
    -   [ ] Lógica para `delegate` e `castVote`.
-   [ ] **Tarefa 3.6:** Implementar um sistema de notificações (`toasts`) para feedback de transações (pendente, sucesso, erro).

## Milestone 4: Testes e Deploy

**Objetivo:** Garantir a qualidade do código, preparar o DApp para produção e automatizar o processo de deploy.

-   [ ] **Tarefa 4.1:** Configurar o projeto na Vercel ou plataforma similar.
-   [ ] **Tarefa 4.2:** Criar um workflow de CI/CD no GitHub Actions para rodar `lint` e `build` a cada PR.
-   [ ] **Tarefa 4.3:** Adicionar testes unitários para os hooks e componentes críticos.
-   [ ] **Tarefa 4.4:** Realizar testes de integração completos para todos os fluxos de usuário.
-   [ ] **Tarefa 4.5:** Revisão final da documentação e da responsividade da UI.