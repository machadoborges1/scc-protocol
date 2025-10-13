# Requisitos de Frontend para o Protocolo SCC

Este documento detalha os requisitos técnicos e funcionais para a construção da interface de usuário (dApp) do protocolo SCC. Ele é gerado a partir da análise do código-fonte e da documentação do protocolo para servir como um blueprint para a equipe de desenvolvimento.

## 1. Visão Geral e Objetivos do Frontend

O objetivo principal do dApp é fornecer uma interface segura, intuitiva e reativa para que os usuários possam interagir com todas as funcionalidades do protocolo SCC. A aplicação deve permitir que os usuários:

- Gerenciem suas posições de dívida colateralizada (Vaults).
- Participem da segurança e da receita do protocolo através do staking.
- Participem da governança on-chain, votando em propostas.
- Monitorem a saúde geral do protocolo e suas próprias posições.
- Participem dos leilões de liquidação.

## 2. Arquitetura de UI e Rotas

A aplicação será uma Single Page Application (SPA) com as seguintes rotas e componentes principais:

| Rota | Página | Componentes Chave | Dados Principais (Subgraph) |
| :--- | :--- | :--- | :--- |
| `/` ou `/dashboard` | Dashboard Principal | `ProtocolStats`, `UserSummary`, `ActiveAuctionsPreview` | `protocol`, `user` |
| `/vaults` | Meus Vaults | `VaultsTable`, `CreateVaultButton` | `user.vaults` |
| `/vaults/[id]` | Gerenciamento de Vault | `VaultManagementPanel`, `VaultHealthChart`, `VaultHistory` | `vault`, `vault.updates` |
| `/auctions` | Leilões de Liquidação | `AuctionsList` | `liquidationAuctions` |
| `/staking` | Staking de SCC-GOV | `StakingPanel`, `UserRewardsSummary` | `stakingPosition` |
| `/governance` | Propostas de Governança | `ProposalsList` | `governanceProposals` |
| `/governance/[id]` | Detalhes da Proposta | `ProposalDetails`, `VoteButtons`, `VotersList` | `governanceProposal`, `proposal.votes` |

## 3. Fluxos de Usuário Detalhados

### 3.1. Criação e Gestão de Vault
1.  **Conexão:** Usuário conecta a carteira via botão `ConnectWallet`.
2.  **Criação:** Na página `/vaults`, o usuário clica em "Criar Novo Vault". Isso dispara uma transação para `VaultFactory.createNewVault()`. Após a confirmação, o usuário é redirecionado para a página do novo vault `/vaults/[new_vault_address]`.
3.  **Depósito de Colateral:** Na página do vault, o usuário insere um valor no formulário de depósito. Ele primeiro assina uma transação `approve()` para o token de colateral (WETH) e, em seguida, assina a transação `vault.depositCollateral(amount)`.
4.  **Emissão de Dívida (Mint):** O usuário insere um valor de SCC-USD a ser emitido. A UI calcula e exibe o CR (Collateralization Ratio) resultante em tempo real. Se o CR estiver acima do mínimo, o usuário assina `vault.mint(amount)`.
5.  **Pagamento de Dívida (Burn):** O usuário insere um valor de SCC-USD a ser pago. Ele primeiro assina `approve()` para o token SCC-USD e, em seguida, assina `vault.burn(amount)`.
6.  **Saque de Colateral:** O usuário insere um valor de colateral a ser sacado. A UI valida se a retirada não deixará o vault subcolateralizado. Se válido, o usuário assina `vault.withdrawCollateral(amount)`.

### 3.2. Staking de SCC-GOV
1.  **Navegação:** Usuário acessa a página `/staking`.
2.  **Stake:** O usuário insere a quantidade de SCC-GOV para stake. Ele assina `approve()` para o token SCC-GOV e, em seguida, `stakingPool.stake(amount)`.
3.  **Resgate de Recompensas:** A UI exibe as recompensas acumuladas. O usuário clica em "Resgatar" e assina `stakingPool.getReward()`.
4.  **Unstake:** O usuário insere a quantidade a ser retirada e assina `stakingPool.unstake(amount)`.

### 3.3. Participação em Leilões
1.  **Navegação:** Usuário acessa a página `/auctions`.
2.  **Visualização:** A UI exibe uma lista de leilões ativos, mostrando o colateral à venda e o preço atual (que decai com o tempo).
3.  **Compra:** O usuário seleciona um leilão, insere a quantidade de colateral que deseja comprar, assina `approve()` para o SCC-USD e, em seguida, assina `liquidationManager.buy(auctionId, amount)`.

### 3.4. Governança
1.  **Delegação:** Se for a primeira vez, a UI deve permitir que o usuário delegue seu poder de voto para seu próprio endereço via `sccGOV.delegate(self)`.
2.  **Visualização:** Usuário acessa `/governance` e vê a lista de propostas e seus status.
3.  **Votação:** Usuário clica em uma proposta ativa, lê os detalhes e clica em "A Favor", "Contra" ou "Abster-se", o que dispara a transação `governor.castVote(proposalId, support)`.

## 4. Interações On-chain (Contratos)

O frontend precisará de interfaces para chamar as seguintes funções dos smart contracts:

-   **VaultFactory:** `createNewVault()`
-   **Vault:** `depositCollateral(uint256)`, `withdrawCollateral(uint256)`, `mint(uint256)`, `burn(uint256)`
-   **LiquidationManager:** `buy(uint256, uint256)`
-   **StakingPool:** `stake(uint256)`, `unstake(uint256)`, `getReward()`
-   **SCC_Governor:** `castVote(uint256, uint8)`, `delegate(address)`
-   **Tokens ERC20 (WETH, SCC-GOV, SCC-USD):** `approve(address, uint256)`, `balanceOf(address)`

## 5. Requisitos de Dados (The Graph)

O frontend deve usar a API GraphQL do Subgraph para buscar dados.

-   **Dashboard:** Query para a entidade `protocol(id: "scc-protocol")` para obter `totalVaults`, `totalCollateralValueUSD`, `totalDebtUSD`.
-   **Página de Vaults:** Query para `user(id: "[user_address]").vaults` para listar os vaults do usuário. Cada vault deve incluir `id`, `collateralAmount`, `debtAmount`, `collateralizationRatio`.
-   **Página de Leilões:** Query para `liquidationAuctions(where: {status: "Active"})` para listar leilões ativos.
-   **Página de Staking:** Query para `stakingPosition(id: "[user_address]")` para obter `amountStaked` e `rewardsClaimed`.
-   **Página de Governança:** Query para `governanceProposals` ordenadas por `createdAtTimestamp`.
-   **Detalhes da Proposta:** Query para `governanceProposal(id: "[proposal_id]")` e `votes(where: {proposal: "[proposal_id]"})`.

## 6. Padrões de UX e Segurança para dApps

-   **Feedback de Transação:** Toda transação deve exibir um feedback claro com seu estado: "Pendente", "Confirmada" ou "Falhou", idealmente com um link para o explorador de blocos.
-   **Estados de Carregamento:** A UI deve exibir indicadores de carregamento (`spinners`, `skeletons`) enquanto os dados do subgraph ou da blockchain estão sendo buscados.
-   **Formatação:** Endereços devem ser encurtados (ex: `0x1234...5678`), e valores numéricos grandes devem ser formatados para fácil leitura (ex: `1,500,000.00 SCC-USD`).
-   **Validação de Input:** Os formulários devem ter validação para prevenir que usuários insiram valores inválidos (ex: sacar mais colateral do que o permitido).
-   **Conexão de Carteira:** A UI deve exibir de forma proeminente o endereço conectado, a rede e o saldo de ETH. Deve alertar o usuário se ele estiver em uma rede incorreta.

## 7. Sugestões de Tecnologia

-   **Framework:** Next.js (com App Router)
-   **Linguagem:** TypeScript
-   **Interação Web3:** `wagmi` e `viem`
-   **UI Kit:** `shadcn/ui`
-   **Conexão de Carteira:** RainbowKit ou Web3Modal
-   **Gráficos:** Recharts ou Tremor
-   **Estilização:** Tailwind CSS
-   **Gestão de Estado:** Zustand ou Jotai para estado global simples.

## 8. Checklist de Implementação e Validação

-   [ ] Módulo de Conexão de Carteira implementado e funcional.
-   [ ] Dashboard exibe estatísticas do protocolo corretamente.
-   [ ] Fluxo de criação de Vault (transação `createNewVault`) funciona.
-   [ ] Fluxo de depósito e saque de colateral funciona, com validações.
-   [ ] Fluxo de emissão e pagamento de dívida (mint/burn) funciona, com validações.
-   [ ] Página de Staking permite stake, unstake e resgate de recompensas.
-   [ ] Página de Leilões exibe leilões ativos.
-   [ ] Página de Governança exibe propostas.
-   [ ] Fluxo de votação em propostas funciona.
-   [ ] Todos os inputs são validados e todos os estados de carregamento/erro são tratados.
