# Arquitetura do Subgraph - Protocolo SCC

**Status:** Proposto

## 1. Visão Geral

O Subgraph do Protocolo SCC serve como a camada de indexação de dados, responsável por transformar os eventos e estados brutos da blockchain em uma API GraphQL estruturada, performática e de fácil consulta. Ele é a espinha dorsal para a obtenção de dados para o DApp (frontend), análises de protocolo e monitoramento externo.

O design se baseia na escuta de eventos emitidos pelos contratos inteligentes core e na atualização de um conjunto de entidades de dados que representam o estado do protocolo.

## 2. Modelo de Dados (`schema.graphql`)

As seguintes entidades formam o núcleo do nosso modelo de dados. Elas são projetadas para serem eficientes e fornecer uma visão completa do protocolo.

### Entidades Principais

-   **`Protocol` (Singleton):**
    -   Descrição: Uma entidade única que agrega estatísticas globais do protocolo.
    -   Campos: `id`, `totalVaults`, `totalCollateralValueUSD`, `totalDebt`, `activeAuctions`, `totalStakedGOV`.

-   **`User`:**
    -   Descrição: Representa uma conta de usuário que interage com o protocolo.
    -   Campos: `id` (endereço do usuário), `vaults` (relação `@derivedFrom`), `stakingPosition` (relação), `votes` (relação `@derivedFrom`).

-   **`Token`:**
    -   Descrição: Representa um token utilizado no sistema (Colateral, SCC-USD, SCC-GOV).
    -   Campos: `id` (endereço do token), `symbol`, `name`, `decimals`, `totalStaked` (se aplicável).

-   **`Vault`:**
    -   Descrição: A entidade central, representando uma Posição de Dívida Colateralizada (CDP).
    -   Campos: `id` (endereço do vault), `owner` (relação com `User`), `collateralToken` (relação com `Token`), `collateralAmount`, `debtAmount`, `createdAtTimestamp`, `updates` (relação `@derivedFrom`).

-   **`VaultUpdate`:**
    -   Descrição: Registra um evento histórico para um `Vault` específico (depósito, saque, mint, burn).
    -   Campos: `id` (tx hash + log index), `vault` (relação), `type` (enum: DEPOSIT, WITHDRAW, MINT, BURN), `amount`, `timestamp`.

### Entidades de Módulos

-   **`LiquidationAuction`:**
    -   Descrição: Rastreia o estado de um leilão de liquidação.
    -   Campos: `id` (ID do leilão), `vault` (relação), `status` (enum: Active, Closed), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer` (se aplicável).

-   **`StakingPosition`:**
    -   Descrição: Rastreia a posição de staking de um usuário no `StakingPool`.
    -   Campos: `id` (endereço do staker), `user` (relação), `amountStaked`, `rewardsClaimed`.

-   **`GovernanceProposal`:**
    -   Descrição: Rastreia o ciclo de vida de uma proposta de governança.
    -   Campos: `id` (ID da proposta), `proposer` (relação com `User`), `status` (enum: Pending, Active, Succeeded, Defeated, Executed), `description`, `forVotes`, `againstVotes`, `abstainVotes`.

-   **`Vote`:**
    -   Descrição: Rastreia um voto individual em uma proposta.
    -   Campos: `id` (proposer ID + voter address), `proposal` (relação), `voter` (relação com `User`), `support` (enum: For, Against, Abstain), `weight`.

# Arquitetura do Subgraph - Protocolo SCC

**Status:** Em Andamento

## 1. Visão Geral

O Subgraph do Protocolo SCC serve como a camada de indexação de dados, responsável por transformar os eventos e estados brutos da blockchain em uma API GraphQL estruturada, performática e de fácil consulta. Ele é a espinha dorsal para a obtenção de dados para o DApp (frontend), análises de protocolo e monitoramento externo.

O design se baseia na escuta de eventos emitidos pelos contratos inteligentes core e na atualização de um conjunto de entidades de dados que representam o estado do protocolo.

## 2. Modelo de Dados (`schema.graphql`)

As seguintes entidades formam o núcleo do nosso modelo de dados. Elas são projetadas para serem eficientes e fornecer uma visão completa do protocolo.

### Entidades Principais

-   **`Protocol` (Singleton):**
    -   Descrição: Uma entidade única que agrega estatísticas globais do protocolo.
    -   Campos: `id`, `totalVaults`, `totalCollateralValueUSD`, `totalDebt`, `activeAuctions`, `totalStakedGOV`.

-   **`User`:**
    -   Descrição: Representa uma conta de usuário que interage com o protocolo.
    -   Campos: `id` (endereço do usuário), `vaults` (relação `@derivedFrom`), `stakingPosition` (relação), `votes` (relação `@derivedFrom`).

-   **`Token`:**
    -   Descrição: Representa um token utilizado no sistema (Colateral, SCC-USD, SCC-GOV).
    -   Campos: `id` (endereço do token), `symbol`, `name`, `decimals`, `totalStaked` (se aplicável).

-   **`Vault`:**
    -   Descrição: A entidade central, representando uma Posição de Dívida Colateralizada (CDP).
    -   Campos: `id` (endereço do vault), `owner` (relação com `User`), `collateralToken` (relação com `Token`), `collateralAmount`, `debtAmount`, `createdAtTimestamp`, `updates` (relação `@derivedFrom`).

-   **`VaultUpdate`:**
    -   Descrição: Registra um evento histórico para um `Vault` específico (depósito, saque, mint, burn).
    -   Campos: `id` (tx hash + log index), `vault` (relação), `type` (enum: DEPOSIT, WITHDRAW, MINT, BURN), `amount`, `timestamp`.

### Entidades de Módulos

-   **`LiquidationAuction`:**
    -   Descrição: Rastreia o estado de um leilão de liquidação.
    -   Campos: `id` (ID do leilão), `vault` (relação), `status` (enum: Active, Closed), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer` (se aplicável).

-   **`StakingPosition`:**
    -   Descrição: Rastreia a posição de staking de um usuário no `StakingPool`.
    -   Campos: `id` (endereço do staker), `user` (relação), `amountStaked`, `rewardsClaimed`.

-   **`GovernanceProposal`:**
    -   Descrição: Rastreia o ciclo de vida de uma proposta de governança.
    -   Campos: `id` (ID da proposta), `proposer` (relação com `User`), `status` (enum: Pending, Active, Succeeded, Defeated, Executed), `description`, `forVotes`, `againstVotes`, `abstainVotes`.

-   **`Vote`:**
    -   Descrição: Rastreia um voto individual em uma proposta.
    -   Campos: `id` (proposer ID + voter address), `proposal` (relação), `voter` (relação com `User`), `support` (enum: For, Against, Abstain), `weight`.

## 3. Fontes de Dados e Mapeamentos (`subgraph.yaml`)

O Subgraph utiliza uma combinação de fontes de dados estáticas e dinâmicas (templates) para indexar eficientemente todos os aspectos do protocolo. Cada fonte de dados está associada a um arquivo de mapeamento (`mapping`) em `src/mappings/` que contém a lógica de transformação dos dados.

### `src/mappings/vault-factory.ts`

-   **Contrato Monitorado:** `VaultFactory`
-   **Responsabilidade:** Ponto de entrada para a descoberta de novos Vaults.
-   **Handler Principal:** `handleVaultCreated(event: VaultCreated)`
-   **Lógica:**
    1.  Cria ou atualiza a entidade singleton `Protocol`, incrementando o contador `totalVaults`.
    2.  Cria uma entidade `User` para o proprietário do Vault, caso ainda não exista.
    3.  Cria a entidade `Vault` principal, associando-a ao proprietário e definindo seus valores iniciais.
    4.  **Ação Crítica:** Inicia a indexação dinâmica do novo contrato `Vault` usando o `VaultTemplate.create()`. Isso permite que o subgraph escute eventos específicos daquele Vault individual.

### `src/mappings/vault.ts` (Template)

-   **Contrato Monitorado:** Instâncias individuais de `Vault` (criadas dinamicamente).
-   **Responsabilidade:** Rastrear o ciclo de vida e as mudanças de estado de um único Vault.
-   **Handlers:**
    -   `handleCollateralDeposited` e `handleCollateralWithdrawn`: Atualizam o campo `collateralAmount` da entidade `Vault`.
    -   `handleSccUsdMinted` e `handleSccUsdBurned`: Atualizam o campo `debtAmount` da entidade `Vault`.
-   **Lógica Comum:** Todos os handlers neste arquivo também criam uma entidade `VaultUpdate` para cada evento, registrando um histórico imutável de todas as operações realizadas no Vault.

### `src/mappings/liquidation-manager.ts`

-   **Contrato Monitorado:** `LiquidationManager`
-   **Responsabilidade:** Indexar o ciclo de vida completo dos leilões de liquidação.
-   **Handlers:**
    -   `handleAuctionStarted`: Cria uma nova entidade `LiquidationAuction`, define seu status como `Active` e a associa à entidade `Vault` correspondente.
    -   `handleAuctionBought`: Atualiza uma `LiquidationAuction` existente, registrando o comprador (`buyer`), a quantidade de colateral comprada e a dívida paga.
    -   `handleAuctionClosed`: Finaliza o leilão, atualizando seu status para `Closed` e registrando o timestamp de fechamento.

### `src/mappings/staking-pool.ts`

-   **Contrato Monitorado:** `StakingPool`
-   **Responsabilidade:** Rastrear as posições de staking e o resgate de recompensas.
-   **Handlers:**
    -   `handleStaked` e `handleUnstaked`: Criam ou atualizam a entidade `StakingPosition` de um usuário, ajustando o campo `amountStaked`.
    -   `handleRewardPaid`: Atualiza o total de `rewardsClaimed` na `StakingPosition` e cria uma entidade `RewardEvent` para o registro histórico.

### Mapeamentos Futuros

-   **`governance.ts`:** Será responsável por indexar a criação de propostas, votos e o ciclo de vida da governança, conforme definido no Milestone 4 do plano de desenvolvimento.
