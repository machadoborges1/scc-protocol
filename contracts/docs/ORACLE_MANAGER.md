# Mecanismo de Oracle Manager

Status: Implementado

## 1. Introdução

Este documento descreve o design e a implementação do contrato `OracleManager.sol`, responsável por agregar e fornecer preços confiáveis e descentralizados para os ativos de colateral utilizados no protocolo SCC. O objetivo é abstrair a complexidade das fontes de dados externas e fornecer uma interface segura, padronizada e robusta para outros contratos do protocolo, como o `Vault` e o `LiquidationManager`.

## 2. Arquitetura Principal

O `OracleManager` é um contrato singular, projetado para ser o único ponto de verdade para os preços dos ativos dentro do protocolo.

- **Controle de Acesso (RBAC):** O contrato utiliza o padrão `AccessControl` da OpenZeppelin para uma gestão de permissões granular e segura.
    - **`DEFAULT_ADMIN_ROLE`**: Este é o papel de administrador principal. Apenas endereços com este papel podem executar as funções mais críticas, como `setPriceFeed()`. A posse deste papel é destinada ao contrato de `TimelockController` da governança.
    - **`AUTHORIZER_ROLE`**: Um papel secundário cuja única permissão é chamar a função `setAuthorization()`. Este papel é destinado ao contrato `VaultFactory`, permitindo que ele autorize os `Vaults` que cria sem receber quaisquer outras permissões administrativas.
- **Mapeamento de Feeds:** O contrato manterá um mapeamento (`mapping`) do endereço de um ativo de colateral (ex: WETH) para o endereço do seu respectivo Price Feed da Chainlink (`AggregatorV3Interface`).
- **Padronização de Decimais:** Todos os preços retornados são padronizados para **18 casas decimais**.

## 3. Funções Principais

### `getPrice(address _asset) external view returns (uint256)`

Esta é a principal função de leitura, usada por outros contratos (como `Vault`) para obter o preço de um ativo. Apenas endereços autorizados podem chamá-la.

### `setPriceFeed(address _asset, address _feed) external onlyRole(DEFAULT_ADMIN_ROLE)`

Função administrativa para a governança gerenciar os feeds de preço.

### `setAuthorization(address _user, bool _authorized) external onlyRole(AUTHORIZER_ROLE)`

Função que concede ou revoga a permissão para um endereço (`_user`) chamar a função `getPrice()`.

## 4. Mecanismos de Segurança Críticos

A implementação deve seguir estritamente as seguintes práticas de segurança para mitigar os riscos associados a oráculos.

### 4.1. Controle de Acesso (`onlyAuthorized`)

- **Mecanismo:** A função `getPrice` só pode ser chamada por endereços (contratos ou usuários) que foram explicitamente autorizados.
- **Implementação:** A função `getPrice` usa o modificador `onlyAuthorized`, que verifica se `isAuthorized[msg.sender]` é `true`. A autorização é gerenciada pela função `setAuthorization(address, bool)`, que só pode ser chamada pelo `owner` (a governança via `Timelock`).
- **Padrão de Uso:** A governança concede a capacidade de autorização a contratos de sistema confiáveis, como a `VaultFactory`. A `VaultFactory`, por sua vez, concede autorização a cada novo `Vault` que cria.

### 4.2. Verificação de Preço Desatualizado (Staleness Check)

- **Mecanismo:** A função `getPrice` **deve** verificar o timestamp da última atualização do preço.
- **Implementação:**
    - O contrato terá uma variável imutável `STALE_PRICE_TIMEOUT` (ex: 24 horas).
    - Ao chamar `latestRoundData()`, o valor `updatedAt` retornado será comparado com `block.timestamp`.
    - Se `block.timestamp - updatedAt > STALE_PRICE_TIMEOUT`, a transação **deve** reverter com um erro customizado: `StalePrice(asset, updatedAt)`.

### 4.3. Validação de Preço Inválido

- **Mecanismo:** A função `getPrice` **deve** validar o preço retornado pelo oráculo.
- **Implementação:**
    - O preço (`answer`) retornado por `latestRoundData()` deve ser estritamente maior que zero.
    - Se `answer <= 0`, a transação **deve** reverter com um erro customizado: `InvalidPrice(asset, answer)`.

### 4.4. Gestão de Feeds pela Governança

- **Mecanismo:** Apenas a governança pode alterar os endereços dos feeds.
- **Implementação:** A função `setPriceFeed` usa o modificador `onlyOwner` do OpenZeppelin.

## 5. Eventos

### `event PriceFeedUpdated(address indexed asset, address indexed feed)`

Emitido sempre que um feed de preço é adicionado ou atualizado, permitindo o monitoramento off-chain das atividades da governança.

## 6. Futuras Iterações

- **Fallback Oracles:** Uma futura versão poderá incluir um mecanismo de fallback. Se o feed primário da Chainlink estiver desatualizado, o contrato poderia tentar consultar um oráculo secundário (ex: um TWAP de um AMM) antes de reverter.
- **Validação de Desvio:** Poderia ser implementada uma verificação que impede atualizações de preço que se desviem mais do que uma certa porcentagem do preço anterior em um curto período, como uma proteção contra manipulação ou falhas do oráculo.