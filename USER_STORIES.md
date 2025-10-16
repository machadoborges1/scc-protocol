## Documentação de Histórias de Usuário – SCC Protocol

### 1. Histórias de Usuário Final (Consumidor)

Histórias focadas na perspectiva de um usuário que interage com o sistema através de uma interface (front-end).

---

#### **Papel: Investidor / Holder de Stablecoin**

**História 1: Criação de Stablecoin (Mint)**

> **Como um** investidor, **eu quero** depositar meu colateral (WETH) em um Vault e criar (mint) a stablecoin SCC_USD, **para que** eu possa ter liquidez em dólar sem precisar vender meus ativos.

*   **Prioridade:** High
*   **Critérios de Aceitação:**
    *   O usuário deve conseguir criar um novo Vault, que é representado como um NFT em sua carteira.
    *   O usuário deve conseguir depositar WETH no seu Vault.
    *   O sistema deve permitir que o usuário crie SCC_USD até o limite determinado pela taxa de colateralização mínima (150%).
    *   A transação deve falhar se o usuário tentar criar mais SCC_USD do que o permitido.
    *   O SCC_USD criado deve ser transferido para a carteira do usuário.
*   **Componentes Envolvidos:**
    *   Contratos: `VaultFactory`, `Vault`, `SCC_USD`, `OracleManager`.
    *   Serviços: Front-end (UI para gerenciar o vault).

**História 2: Queima de Stablecoin para Resgatar Colateral**

> **Como um** investidor, **eu quero** pagar minha dívida em SCC_USD para poder resgatar meu colateral (WETH), **para que** eu possa realizar lucros ou sair da minha posição.

*   **Prioridade:** High
*   **Critérios de Aceitação:**
    *   O usuário deve conseguir queimar (burn) seus SCC_USD através do seu Vault.
    *   A quantidade de SCC_USD a ser queimada não pode ser maior que a dívida existente no Vault.
    *   Após a queima da dívida, o usuário deve conseguir sacar uma quantidade proporcional (ou total) do seu colateral, desde que a taxa de colateralização mínima seja mantida.
    *   O colateral sacado (WETH) deve ser transferido de volta para a carteira do usuário.
*   **Componentes Envolvidos:**
    *   Contratos: `Vault`, `SCC_USD`, `OracleManager`.
    *   Serviços: Front-end (UI).

---

#### **Papel: Staker / Yield Farmer**

**História 3: Staking de Tokens de Governança**

> **Como um** participante do ecossistema, **eu quero** fazer "stake" dos meus tokens de governança (SCC_GOV), **para que** eu possa receber recompensas em SCC_USD e ajudar a segurar o protocolo.

*   **Prioridade:** Medium
*   **Critérios de Aceitação:**
    *   O usuário deve primeiro aprovar o contrato `StakingPool` para gastar seus SCC_GOV.
    *   O usuário deve conseguir chamar a função `stake()` para depositar a quantidade desejada de SCC_GOV.
    *   O contrato deve registrar corretamente a quantidade de tokens em stake para aquele usuário.
    *   O front-end deve exibir a quantidade total que o usuário tem em stake e as recompensas acumuladas.
*   **Componentes Envolvidos:**
    *   Contratos: `StakingPool`, `SCC_GOV` (token).
    *   Serviços: Front-end (UI para staking), Subgraph (para exibir dados de staking).

---

#### **Papel: Membro da Governança**

**História 4: Votação em Propostas**

> **Como um** detentor de tokens SCC_GOV, **eu quero** votar em propostas de governança (a favor, contra ou abster-me), **para que** eu possa participar ativamente nas decisões que afetam o futuro do protocolo.

*   **Prioridade:** Medium
*   **Critérios de Aceitação:**
    *   A interface deve listar todas as propostas de governança ativas.
    *   O usuário deve conseguir ver os detalhes de cada proposta (descrição, o que ela executa, etc.).
    *   O usuário deve conseguir submeter seu voto (For, Against, Abstain) através de uma transação.
    *   O sistema deve registrar o voto e o "poder de voto" (quantidade de tokens) do usuário naquele momento.
    *   O voto não deve ser permitido se a proposta não estiver no período de votação.
*   **Componentes Envolvidos:**
    *   Contratos: `SCC_Governor`, `SCC_GOV` (para verificar o poder de voto).
    *   Serviços: Front-end (UI de governança), Subgraph (para exibir propostas e resultados).

***

### 2. Histórias de Protocolo / Infraestrutura

Histórias focadas na perspectiva dos sistemas e operadores que mantêm o protocolo funcionando de forma segura e autônoma.

---

#### **Papel: Operador / Bot Keeper**

**História 5: Liquidação de Vaults Não Saudáveis**

> **Como um** Keeper (bot), **eu quero** monitorar continuamente a saúde de todos os Vaults e iniciar um leilão de liquidação para qualquer vault que caia abaixo da taxa de colateralização mínima, **para que** o protocolo permaneça solvente e o risco de dívida incobrável seja minimizado.

*   **Prioridade:** High
*   **Critérios de Aceitação:**
    *   O bot deve consultar a blockchain (ou um subgraph) em intervalos regulares para obter a lista de todos os vaults.
    *   Para cada vault com dívida, o bot deve calcular sua taxa de colateralização usando o preço mais recente do oráculo.
    *   Se a taxa for menor que 150%, o bot deve chamar a função `startAuction()` no contrato `LiquidationManager`.
    *   O bot deve ter uma lógica para não tentar liquidar um vault para o qual um leilão já está ativo.
    *   O bot deve gerenciar seu próprio gás (ETH) e ter uma estratégia para lidar com falhas de transação.
*   **Componentes Envolvidos:**
    *   Serviços: **Keeper Bot** (`offchain` service).
    *   Contratos: `Vault`, `OracleManager`, `LiquidationManager`.

---

#### **Papel: Indexer / The Graph Service**

**História 6: Indexação de Dados para o Front-end**

> **Como um** serviço de indexação (The Graph), **eu quero** ouvir todos os eventos emitidos pelos contratos do protocolo (VaultCreated, Staked, AuctionStarted, etc.), **para que** o front-end possa consultar esses dados de forma rápida e eficiente através de uma API GraphQL, sem precisar consultar a blockchain diretamente.

*   **Prioridade:** High
*   **Critérios de Aceitação:**
    *   O subgraph deve ter um "handler" para cada evento relevante emitido pelos contratos.
    *   Quando um evento `VaultCreated` é recebido, a entidade `Vault` deve ser criada e o contador `totalVaults` no `Protocol` deve ser incrementado.
    *   Quando um evento `AuctionStarted` é recebido, a entidade `LiquidationAuction` deve ser criada com o status "Active" e o contador `activeAuctions` deve ser incrementado.
    *   Quando um evento `AuctionClosed` é recebido, o status da `LiquidationAuction` deve ser atualizado e o contador `activeAuctions` deve ser decrementado.
    *   Os dados devem estar disponíveis na API do subgraph poucos segundos após a confirmação do evento na blockchain.
*   **Componentes Envolvidos:**
    *   Serviços: **Subgraph** (`subgraph` service), Graph Node, IPFS.
    *   Contratos: Todos os contratos principais que emitem eventos.