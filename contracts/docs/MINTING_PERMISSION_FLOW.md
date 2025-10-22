# Fluxo de Permissões de Token (Mint e Burn)

**Status:** Implementado / Vulnerabilidade Identificada

## 1. Contexto e Problema (Minting)

Durante os testes de integração do bot off-chain, foi identificado um erro de reversão na chamada `vault.mint()`. A análise revelou a causa raiz: um `Vault` recém-criado não possuía a permissão (`MINTER_ROLE`) necessária para mintar novos tokens `SCC_USD`.

O script de deploy original configurava as permissões para o `OracleManager`, mas não estabelecia um fluxo para que os `Vaults` recebessem a permissão de mint, um requisito da arquitetura.

## 2. Solução de Design (Minting)

Para resolver o problema, foi implementada uma solução que espelha o padrão de design seguro já utilizado para as permissões do `OracleManager`, garantindo a consistência da arquitetura e aderindo ao **Princípio do Menor Privilégio**.

A solução se baseia em uma delegação de poder em três passos:

### 2.1. Passo 1: Modificação do Contrato `SCC_USD.sol`

Foi introduzido um novo papel de acesso (`bytes32`) no contrato `SCC_USD`:

- **`MINTER_GRANTER_ROLE`**: Um papel administrativo cuja única finalidade é gerenciar quem possui o `MINTER_ROLE`.

No construtor do `SCC_USD`, a função `_setRoleAdmin(MINTER_ROLE, MINTER_GRANTER_ROLE)` é chamada. Isso estabelece que apenas uma conta com o `MINTER_GRANTER_ROLE` pode conceder ou revogar o `MINTER_ROLE` de outras contas.

### 2.2. Passo 2: Atualização do Script `Deploy.s.sol`

O script de deploy foi atualizado para orquestrar a nova configuração de papéis:

1.  Após a implantação do `SCC_USD` e da `VaultFactory`, o script concede o `MINTER_GRANTER_ROLE` ao endereço da `VaultFactory`.
2.  O `DEFAULT_ADMIN_ROLE` (papel de administrador geral) do `SCC_USD` é, como antes, transferido para o `TimelockController` para o controle final da governança.

Isso garante que a `VaultFactory` tenha apenas a permissão específica e limitada de que precisa.

### 2.3. Passo 3: Atualização do Contrato `VaultFactory.sol`

A função `createNewVault` foi modificada. Além de autorizar o novo vault no `OracleManager`, ela agora também executa a seguinte ação:

- **Concessão de Permissão:** A fábrica chama `sccUsdToken.grantRole(MINTER_ROLE, address(newVault))`, usando seu `MINTER_GRANTER_ROLE` para dar ao `Vault` recém-criado a capacidade de mintar `SCC-USD`.

---

## 3. Vulnerabilidade Crítica no Fluxo de Burn

**Status:** Corrigido

-   **Contrato:** `SCC_USD.sol`
-   **Função:** `burn(address account, uint256 amount) public onlyRole(MINTER_ROLE)`
-   **Descrição do Problema:** A função de queima de tokens foi implementada de forma a permitir que qualquer endereço com `MINTER_ROLE` queime tokens de qualquer `account`. Como cada `Vault` criado recebe o `MINTER_ROLE`, cada `Vault` individual tem a permissão de destruir o saldo de `SCC-USD` de qualquer outro usuário ou contrato no sistema.
-   **Impacto:** **Crítico.** Esta é uma permissão excessivamente ampla e perigosa. Um bug ou uma vulnerabilidade em um único `Vault` poderia ser explorado para queimar os fundos de outros usuários, causando perdas financeiras diretas e irreparáveis. Ele quebra o isolamento e a segurança que os `Vaults` individuais deveriam ter.
-   **Ação Requerida (Correção):**
    1.  **Remover** a função `burn(address account, uint256 amount)` do contrato `SCC_USD.sol`.
    2.  Fazer com que `SCC_USD.sol` herde do contrato `ERC20Burnable.sol` da OpenZeppelin. Isso fornecerá duas funções seguras e padronizadas:
        - `burn(uint256 amount)`: Queima tokens do `msg.sender`.
        - `burnFrom(address account, uint256 amount)`: Queima tokens de uma `account` usando o sistema de `allowance` (aprovação).
    3.  Atualizar a função `burn` no contrato `Vault.sol`. Em vez de chamar a função perigosa, ela deve usar `sccUsdToken.burnFrom(owner(), _amount)`. Isso exigirá que o usuário primeiro aprove o contrato `Vault` para gastar seus `SCC-USD`, o que é o fluxo padrão e seguro para interações de tokens.
