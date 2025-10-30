# 5. Subgraph do Protocolo SCC

O Subgraph do Protocolo SCC é um componente essencial para a indexação e consulta de dados da blockchain. Ele transforma os eventos e estados brutos dos contratos inteligentes em uma API GraphQL facilmente consultável, servindo como a principal fonte de dados para o frontend (DApp) e para análises.

## 5.1. Visão Geral

O Subgraph monitora os contratos principais do protocolo SCC, como `VaultFactory`, `SCC_USD`, `SCC_GOV`, `LiquidationManager`, `StakingPool`, `SCC_Governor` e `TimelockController`. Ao escutar eventos emitidos por esses contratos, ele persiste os dados relevantes em um banco de dados, que pode ser acessado via queries GraphQL. Isso permite que o frontend exiba informações atualizadas e históricas do protocolo sem precisar consultar diretamente a blockchain para cada dado.

## 5.2. Componentes do Subgraph

Um Subgraph é definido por três arquivos principais:

*   **`subgraph.yaml` (Manifesto do Subgraph):** O arquivo de configuração central. Ele define quais contratos monitorar, quais eventos escutar, quais arquivos ABI usar e quais funções de mapeamento (`mapping handlers`) executar para cada evento. É aqui que se configura a rede (ex: `localhost`, `mainnet`) e os endereços dos contratos.
*   **`schema.graphql` (Definição do Esquema de Dados):** Define o modelo de dados (entidades) que serão armazenadas e consultadas. Cada entidade corresponde a uma tabela no banco de dados do Subgraph. O esquema é crucial para a estrutura da API GraphQL.
*   **`src/mappings/*.ts` (Arquivos de Mapeamento):** Contêm a lógica em TypeScript (compilada para WebAssembly) que processa os eventos da blockchain e os transforma em entidades definidas no `schema.graphql`. Cada evento de contrato é mapeado para uma função que extrai os dados relevantes e os salva no formato de entidade.

## 5.3. Modelo de Dados (`schema.graphql`)

O `schema.graphql` define as seguintes entidades principais para o protocolo SCC:

*   **`Protocol`:** Uma entidade singleton que armazena dados agregados do protocolo, como `totalVaults`, `totalCollateralValueUSD`, `totalDebtUSD`, `activeAuctions`, `totalStakedGOV` e os parâmetros de governança (`minCollateralizationRatio`, `priceDecayHalfLife`, `startPriceMultiplier`).
*   **`Token`:** Representa os tokens ERC20 envolvidos no protocolo (ex: `SCC-USD`, `SCC-GOV`, tokens de colateral). Armazena `symbol`, `name`, `decimals` e o endereço do contrato.
*   **`TokenPrice`:** Registra o preço de um token em USD, com `lastUpdateBlockNumber` e `lastUpdateTimestamp`.
*   **`User`:** Representa um usuário do protocolo, com um ID sendo seu endereço de carteira. Contém referências aos `Vaults` que possui, sua `StakingPosition` e seus `votes`.
*   **`Vault`:** Representa um `Vault` individual. Armazena `owner`, `collateralToken`, `debtToken`, `status` (`Active`, `Liquidating`, `Liquidated`), `collateralAmount`, `collateralValueUSD`, `debtAmount`, `debtValueUSD`, `collateralizationRatio`, `createdAtTimestamp` e referências a `VaultUpdate` e `LiquidationAuction`.
*   **`VaultUpdate`:** Registra cada atualização significativa em um `Vault` (ex: `DEPOSIT`, `WITHDRAW`, `MINT`, `BURN`), com o `amount` e `timestamp`.
*   **`LiquidationAuction`:** Detalhes de um leilão de liquidação, incluindo `vault`, `status` (`Active`, `Bought`, `Closed`), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer`, `collateralBought`, `debtPaid` e `closedAtTimestamp`.
*   **`StakingPosition`:** A posição de staking de um usuário, com `user`, `stakingToken`, `amountStaked`, `rewardsClaimed`, `createdAtTimestamp`, `lastUpdatedAtTimestamp` e `rewardEvents`.
*   **`RewardEvent`:** Registra eventos de recompensa para uma `StakingPosition`.
*   **`GovernanceProposal`:** Detalhes de uma proposta de governança, incluindo `proposer`, `status` (`Pending`, `Active`, `Canceled`, `Defeated`, `Succeeded`, `Queued`, `Expired`, `Executed`), `targets`, `values`, `calldatas`, `description`, `forVotes`, `againstVotes`, `abstainVotes`, `createdAtTimestamp`, `executedAtTimestamp`, `canceledAtTimestamp` e `votes`.
*   **`Vote`:** Registra um voto individual em uma proposta de governança, com `proposal`, `voter`, `support` (`For`, `Against`, `Abstain`), `weight` e `reason`.

## 5.4. Estrutura de Diretórios (`subgraph/src/`)

O diretório `subgraph/src/` contém:

*   **`generated/`:** Contém o código TypeScript gerado automaticamente a partir do `schema.graphql` e dos ABIs dos contratos. Este código fornece classes para interagir com as entidades e eventos do Subgraph de forma tipada.
*   **`mappings/`:** Contém os arquivos AssemblyScript (compilados para WebAssembly) que implementam a lógica de mapeamento. Cada arquivo de mapeamento processa eventos de um ou mais contratos, extraindo os dados relevantes e criando/atualizando as entidades definidas no `schema.graphql`.

## 5.5. Configuração e Desenvolvimento Local

O desenvolvimento local do Subgraph envolve a configuração do `subgraph.yaml` para monitorar contratos em uma rede de desenvolvimento local (como Anvil), a geração de código (`graph codegen`), a construção do Subgraph (`graph build`) e o deploy em um Graph Node local (`graph deploy`). Isso permite testar e depurar os mapeamentos antes do deploy em redes públicas.

## 5.6. Melhores Práticas

Para garantir a eficiência e a manutenibilidade do Subgraph, são seguidas as seguintes melhores práticas:

*   **Otimização de Entidades:** Manter as entidades enxutas, armazenando apenas dados essenciais.
*   **`@derivedFrom`:** Utilizar esta diretiva no `schema.graphql` para criar campos virtuais que derivam de outras entidades, evitando duplicação de dados.
*   **Mapeamentos Eficientes:** Otimizar a lógica nos arquivos de mapeamento para minimizar operações de leitura/escrita no banco de dados.
*   **`startBlock`:** Definir o `startBlock` o mais alto possível (o bloco de deploy do contrato) para acelerar a sincronização inicial.
*   **Testes:** Escrever testes para os mapeamentos para garantir o processamento correto dos eventos.
