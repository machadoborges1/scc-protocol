# 6. Gerenciamento de Oráculos (`OracleManager.sol`)

Este documento descreve o design e a implementação do contrato `OracleManager.sol`, responsável por agregar e fornecer preços confiáveis e descentralizados para os ativos de colateral utilizados no protocolo SCC. O objetivo é abstrair a complexidade das fontes de dados externas e fornecer uma interface segura, padronizada e robusta para outros contratos do protocolo, como o `Vault` e o `LiquidationManager`.

## 6.1. Arquitetura Principal

O `OracleManager` é um contrato singular, projetado para ser o único ponto de verdade para os preços dos ativos dentro do protocolo. Ele utiliza o padrão `AccessControl` da OpenZeppelin para uma gestão de permissões granular e segura.

*   **Controle de Acesso (RBAC):**
    *   **`DEFAULT_ADMIN_ROLE`:** Papel de administrador principal, com permissão para executar funções críticas como `setPriceFeed()`. A posse deste papel é destinada ao contrato de `TimelockController` da governança.
    *   **`AUTHORIZER_ROLE`:** Papel secundário cuja única permissão é chamar a função `setAuthorization()`. Este papel é destinado ao contrato `VaultFactory`, permitindo que ele autorize os `Vaults` que cria sem receber quaisquer outras permissões administrativas.
*   **Mapeamento de Feeds:** O contrato mantém um mapeamento (`s_priceFeeds`) do endereço de um ativo de colateral (ex: WETH) para o endereço do seu respectivo Price Feed da Chainlink (`AggregatorV3Interface`).
*   **Padronização de Decimais:** Todos os preços retornados são padronizados para **18 casas decimais** (`PRICE_DECIMALS`).

## 6.2. Funções Principais

### `getPrice(address _asset) external view onlyAuthorized returns (uint256)`

*   **Propósito:** Principal função de leitura, usada por outros contratos (como `Vault` e `LiquidationManager`) para obter o preço de um ativo.
*   **Segurança:** Apenas endereços autorizados (`isAuthorized[msg.sender] == true`) podem chamá-la. Inclui verificações de segurança para preços desatualizados (`STALE_PRICE_TIMEOUT`) ou inválidos (`answer <= 0`).
*   **Retorno:** O preço do ativo em USD, com 18 decimais.

### `setPriceFeed(address _asset, address _feed) external onlyRole(DEFAULT_ADMIN_ROLE)`

*   **Propósito:** Função administrativa para a governança gerenciar os feeds de preço.
*   **Segurança:** Apenas contas com o `DEFAULT_ADMIN_ROLE` (governança) podem chamar esta função.

### `setAuthorization(address _user, bool _authorized) external onlyRole(AUTHORIZER_ROLE)`

*   **Propósito:** Concede ou revoga a permissão para um endereço (`_user`) chamar a função `getPrice()`.
*   **Segurança:** Apenas contas com o `AUTHORIZER_ROLE` (ex: `VaultFactory`) podem chamar esta função.

## 6.3. Mecanismos de Segurança Críticos

A implementação do `OracleManager` incorpora estritamente as seguintes práticas de segurança para mitigar os riscos associados a oráculos:

### 6.3.1. Controle de Acesso (`onlyAuthorized`)

*   A função `getPrice` só pode ser chamada por endereços que foram explicitamente autorizados via `setAuthorization`. Isso impede que contratos não autorizados ou usuários arbitrários consultem o oráculo, adicionando uma camada de segurança.

### 6.3.2. Verificação de Preço Desatualizado (Staleness Check)

*   O contrato possui uma variável imutável `STALE_PRICE_TIMEOUT` (definida no construtor). Ao consultar um feed de preço, o `updatedAt` retornado é comparado com `block.timestamp`. Se o preço estiver mais antigo que `STALE_PRICE_TIMEOUT`, a transação reverte com o erro `StalePrice(asset, updatedAt)`, protegendo contra o uso de dados obsoletos.

### 6.3.3. Validação de Preço Inválido

*   O preço (`answer`) retornado pelo oráculo é validado para garantir que seja estritamente maior que zero. Se `answer <= 0`, a transação reverte com o erro `InvalidPrice(asset, answer)`, prevenindo o uso de preços maliciosos ou incorretos.

### 6.3.4. Gestão de Feeds pela Governança

*   Apenas a governança (detentora do `DEFAULT_ADMIN_ROLE`) pode alterar os endereços dos feeds de preço através da função `setPriceFeed`, garantindo que apenas entidades confiáveis possam configurar as fontes de dados críticas.

## 6.4. Eventos

*   **`PriceFeedUpdated(address indexed asset, address indexed feed)`:** Emitido sempre que um feed de preço é adicionado ou atualizado, permitindo o monitoramento off-chain das atividades da governança.
*   **`AuthorizationSet(address indexed user, bool authorized)`:** Emitido quando um endereço é autorizado ou desautorizado a chamar `getPrice`.

## 6.5. Futuras Iterações

*   **Fallback Oracles:** Implementação de um mecanismo de fallback para consultar oráculos secundários caso o feed primário da Chainlink esteja desatualizado ou falhe.
*   **Validação de Desvio:** Adição de verificações para impedir atualizações de preço que se desviem significativamente do preço anterior em um curto período, como uma proteção contra manipulação ou falhas do oráculo.
