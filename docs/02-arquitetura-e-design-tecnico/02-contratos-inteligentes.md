# 2. Contratos Inteligentes do Protocolo SCC

Esta seção detalha os principais contratos inteligentes que compõem o núcleo on-chain do Protocolo SCC. Cada contrato é responsável por uma funcionalidade específica, e a interação entre eles garante o funcionamento seguro e descentralizado da stablecoin `SCC-USD`.

## 2.1. `VaultFactory.sol`

*   **Propósito:** Contrato de fábrica responsável por criar e gerenciar novas instâncias de `Vault` para os usuários.
*   **Funcionalidades Chave:**
    *   `createNewVault()`: Cria um novo contrato `Vault` (implementado como um proxy para permitir atualizações futuras) e transfere a propriedade (NFT) para o chamador. Também autoriza o novo `Vault` a interagir com o `OracleManager` e concede a ele a permissão de `MINTER_ROLE` no contrato `SCC_USD`.
*   **Interações:** Interage com `Vault.sol`, `OracleManager.sol` e `SCC_USD.sol` durante a criação de um novo `Vault`.

## 2.2. `Vault.sol`

*   **Propósito:** Representa a Posição de Dívida Colateralizada (CDP) de um usuário como um NFT (ERC721). Cada `Vault` detém o colateral de um usuário e rastreia sua dívida em `SCC-USD`.
*   **Funcionalidades Chave:**
    *   `depositCollateral(uint256 _amount)`: Permite ao proprietário do `Vault` depositar colateral (ex: WETH).
    *   `withdrawCollateral(uint256 _amount)`: Permite ao proprietário retirar colateral, desde que a Taxa de Colateralização (CR) não caia abaixo do mínimo.
    *   `mint(uint256 _amount)`: Permite ao proprietário emitir `SCC-USD` contra o colateral, verificando o CR mínimo.
    *   `burn(uint256 _amount)`: Permite ao proprietário queimar `SCC-USD` para reduzir a dívida.
    *   `transferCollateralTo(address _to, uint256 _amount)`: Função restrita ao `LiquidationManager` para transferir colateral durante uma liquidação.
    *   `reduceDebt(uint256 _amount)`: Função restrita ao `LiquidationManager` para reduzir a dívida do `Vault` após uma liquidação.
*   **Interações:** Interage com `OracleManager.sol` para obter preços, `SCC_USD.sol` para mint/burn, e `LiquidationManager.sol` durante o processo de liquidação.

## 2.3. `SCC_USD.sol`

*   **Propósito:** A implementação do token stablecoin `SCC-USD` (ERC20), com funcionalidades de mint e burn controladas por roles.
*   **Funcionalidades Chave:**
    *   `mint(address to, uint256 amount)`: Emite novos tokens `SCC-USD` para um endereço específico. Restrito a endereços com o `MINTER_ROLE` (como os contratos `Vault`).
    *   `burnFrom(address from, uint256 amount)`: Queima tokens `SCC-USD` de um endereço específico. Restrito a endereços com o `BURNER_ROLE` (como os contratos `Vault`).
*   **Interações:** Principalmente com `Vault.sol` para a gestão da oferta de `SCC-USD`.

## 2.4. `SCC_GOV.sol`

*   **Propósito:** A implementação do token de governança `SCC-GOV` (ERC20Votes), que confere poder de voto aos seus detentores.
*   **Funcionalidades Chave:**
    *   `delegate(address delegatee)`: Permite que os detentores de `SCC-GOV` deleguem seu poder de voto a si mesmos ou a outro endereço.
    *   `getVotes(address account, uint256 blockNumber)`: Retorna o poder de voto de uma conta em um bloco específico, crucial para a governança.
*   **Interações:** Utilizado pelo `SCC_Governor.sol` para determinar o poder de voto nas propostas.

## 2.5. `OracleManager.sol`

*   **Propósito:** Gerencia os feeds de preço do Chainlink para o protocolo SCC, fornecendo uma interface padronizada e segura para obter preços de ativos.
*   **Funcionalidades Chave:**
    *   `getPrice(address _asset)`: Retorna o preço mais recente de um ativo, padronizado para 18 decimais, com verificações de segurança para preços desatualizados (`STALE_PRICE_TIMEOUT`) ou inválidos. Acesso restrito a endereços autorizados.
    *   `setPriceFeed(address _asset, address _feed)`: Define ou atualiza o endereço do feed de preço do Chainlink para um ativo. Apenas o `DEFAULT_ADMIN_ROLE` (governança) pode chamar.
    *   `setAuthorization(address _user, bool _authorized)`: Autoriza ou desautoriza um endereço a chamar a função `getPrice`. Apenas o `AUTHORIZER_ROLE` (ex: `VaultFactory`) pode chamar.
*   **Interações:** Consultada por `Vault.sol` e `LiquidationManager.sol` para obter os preços dos colaterais.

## 2.6. `SCC_Parameters.sol`

*   **Propósito:** Armazena e gerencia parâmetros globais configuráveis do protocolo SCC, como a Taxa Mínima de Colateralização e parâmetros de leilão.
*   **Funcionalidades Chave (apenas para o `owner` - governança):
    *   `setMinCollateralizationRatio(uint256 _newRatio)`: Atualiza a Taxa Mínima de Colateralização.
    *   `setPriceDecayHalfLife(uint256 _newHalfLife)`: Atualiza o tempo de meia-vida de decaimento do preço para leilões.
    *   `setStartPriceMultiplier(uint256 _newMultiplier)`: Atualiza o multiplicador do preço inicial para leilões.
*   **Interações:** Consultada por `Vault.sol` e `LiquidationManager.sol` para obter os parâmetros atuais do protocolo.

## 2.7. `LiquidationManager.sol`

*   **Propósito:** Gerencia o processo de liquidação de `Vaults` não saudáveis através de Leilões Holandeses, onde o preço do colateral começa alto e decai ao longo do tempo.
*   **Funcionalidades Chave:**
    *   `startAuction(address _vaultAddress)`: Inicia um leilão para um `Vault` sub-colateralizado. Qualquer um pode chamar, mas o `Vault` deve estar abaixo do CR mínimo. Calcula o preço inicial do leilão com base no preço do oráculo e um multiplicador.
    *   `buy(uint256 _auctionId, uint256 _collateralToBuy)`: Permite que um comprador adquira colateral de um leilão em andamento, pagando em `SCC-USD`. A função gerencia a transferência atômica de `SCC-USD` e colateral, e atualiza o estado do `Vault` e do leilão.
    *   `getCurrentPrice(uint256 _auctionId)`: Calcula o preço atual do colateral em um leilão, usando um modelo de decaimento linear.
    *   `isVaultLiquidatable(address _vaultAddress)`: Verifica se um `Vault` está abaixo do CR mínimo e é elegível para liquidação.
*   **Interações:** Interage com `Vault.sol` para transferir colateral e reduzir dívida, `OracleManager.sol` para obter preços, e `SCC_Parameters.sol` para obter parâmetros de leilão.

## 2.8. `SCC_Governor.sol`

*   **Propósito:** O contrato central de governança, baseado no OpenZeppelin Governor, que orquestra o processo de votação e execução de propostas.
*   **Funcionalidades Chave:**
    *   Gerencia a criação, votação e enfileiramento de propostas.
    *   Define `votingDelay`, `votingPeriod`, `proposalThreshold` e `quorum`.
    *   Interage com o `TimelockController` para a execução segura de propostas aprovadas.
*   **Interações:** Interage com `SCC_GOV.sol` para o poder de voto e com o `TimelockController` para a execução de propostas.

## 2.9. `TimelockController.sol`

*   **Propósito:** Atua como um cofre com trava de tempo, sendo o proprietário de contratos críticos do protocolo. Garante um delay de segurança entre a aprovação de uma proposta de governança e sua execução.
*   **Funcionalidades Chave:**
    *   `queue(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt, uint256 delay)`: Enfileira uma operação para ser executada após um `delay`.
    *   `execute(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt)`: Executa uma operação enfileirada após o `delay` ter passado.
*   **Interações:** Recebe chamadas do `SCC_Governor.sol` e executa ações em outros contratos do protocolo (ex: `VaultFactory`, `OracleManager`, `LiquidationManager`, `StakingPool`, `SCC_Parameters`).
