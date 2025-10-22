# Mecanismo do Vault e da VaultFactory

**Status:** Implementado
**Contratos Afetados:** `Vault.sol`, `VaultFactory.sol`

## 1. Introdução

O sistema de Vaults é o coração do protocolo SCC. Cada `Vault` funciona como uma Posição de Dívida Colateralizada (CDP) individual para um usuário, permitindo que ele tome emprestado a stablecoin SCC-USD contra um ativo de colateral depositado. Para garantir a unicidade e a propriedade, cada Vault é representado como um NFT (padrão ERC721).

## 2. VaultFactory

A `VaultFactory` é um contrato simples cuja única responsabilidade é criar novas instâncias do contrato `Vault`.

### `createNewVault()`

- **O que faz:** Quando um usuário chama esta função, a fábrica deploya um novo contrato `Vault`.
- **Propriedade:** A propriedade do novo `Vault` (o NFT correspondente) é imediatamente transferida para o `msg.sender` (o usuário que chamou a função).
- **Parâmetros:** A fábrica já está configurada com os endereços dos contratos principais (Token de Colateral, SCC-USD, OracleManager) e os passa para o construtor do novo `Vault`.
- **Autorização (Capability):** Após criar o `Vault`, a fábrica chama `oracleManager.setAuthorization(address(newVault), true)`. Isso concede ao novo `Vault` a "capacidade" de consultar preços, uma etapa essencial para seu funcionamento.
- **Evento:** Emite um evento `VaultCreated` com o endereço do novo Vault e o endereço do proprietário.

## 3. Vault

O contrato `Vault` gerencia o colateral e a dívida de uma única posição.

### 3.1. Funções de Gerenciamento de Colateral

- **`depositCollateral(uint256 _amount)`:**
  - Permite que o dono do Vault deposite mais colateral no contrato. O usuário precisa primeiro aprovar o contrato do Vault para transferir os tokens de colateral.

- **`withdrawCollateral(uint256 _amount)`:**
  - Permite que o dono do Vault retire uma parte do seu colateral. 
  - **Verificação de Segurança:** A função verifica se a retirada não deixará o Vault sub-colateralizado (abaixo da `MIN_COLLATERALIZATION_RATIO`). Se o Vault não tiver dívida, toda a colateral pode ser retirada.

### 3.2. Funções de Gerenciamento de Dívida

- **`mint(uint256 _amount)`:**
  - Cria (minte) novas unidades de SCC-USD e as envia para o dono do Vault, aumentando sua dívida.
  - **Verificação de Segurança:** Esta é uma função crítica. Ela primeiro consulta o `OracleManager` para obter o preço atual do colateral, calcula o novo índice de colateralização que resultaria do `mint`, e só prossegue se o novo índice for maior que a `MIN_COLLATERALIZATION_RATIO`.

- **`burn(uint256 _amount)`:**
  - Permite que o dono do Vault pague sua dívida. O usuário precisa primeiro aprovar o contrato do Vault para gastar seus SCC-USD.
  - Os tokens SCC-USD são transferidos do usuário e queimados, diminuindo a dívida do Vault e o fornecimento total da stablecoin.

### 3.3. Interação com a Liquidação

- **`transferCollateralTo(address _to, uint256 _amount)`:**
  - Esta é uma função restrita que só pode ser chamada pelo `LiquidationManager`.
  - Durante um leilão, ela permite que o `LiquidationManager` transfira o colateral do Vault para o comprador do leilão.

---

## 4. Vulnerabilidade Crítica: Gerenciador de Liquidação Controlado pelo Usuário

**Status:** Corrigido

-   **Contrato:** `Vault.sol`
-   **Função:** `setLiquidationManager(address _manager) external onlyOwner`
-   **Descrição do Problema:** A função permite que o proprietário do `Vault` (o usuário final) especifique qualquer endereço como o `LiquidationManager`. Um usuário mal-intencionado pode apontar para um endereço de contrato vazio ou um contrato que não executa a lógica de liquidação, tornando seu `Vault` efetivamente imune à liquidação.
-   **Impacto:** **Crítico.** Esta falha compromete a principal garantia de solvência do protocolo. Se os `Vaults` não puderem ser liquidados, o `SCC-USD` pode se tornar sub-colateralizado em todo o sistema.
-   **Ação Requerida (Correção):**
    1.  Remover a função `setLiquidationManager` do contrato `Vault.sol`.
    2.  Adicionar o endereço do `LiquidationManager` como uma variável `immutable` no `Vault.sol`.
    3.  Atualizar o construtor do `Vault.sol` para aceitar o endereço do `LiquidationManager`.
    4.  Atualizar a `VaultFactory.sol` para que ela passe o endereço do `LiquidationManager` (que ela deve conhecer) para o construtor de cada novo `Vault` que ela cria. Isso garante que todos os `Vaults` apontem para o único e correto `LiquidationManager` do sistema, sem possibilidade de alteração pelo usuário.

