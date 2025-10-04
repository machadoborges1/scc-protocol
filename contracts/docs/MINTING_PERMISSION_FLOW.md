# Fluxo de Permissão de Mint (Minting)

**Status:** Implementado

## 1. Contexto e Problema

Durante os testes de integração do bot off-chain, foi identificado um erro de reversão na chamada `vault.mint()`. A análise revelou a causa raiz: um `Vault` recém-criado não possuía a permissão (`MINTER_ROLE`) necessária para mintar novos tokens `SCC_USD`.

O script de deploy original configurava as permissões para o `OracleManager`, mas não estabelecia um fluxo para que os `Vaults` recebessem a permissão de mint, um requisito da arquitetura.

## 2. Solução de Design

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

## 3. Conclusão

Esta solução corrige o bug do teste de integração de forma robusta e segura. Ela evita uma "gambiarra" (como dar poder de administrador excessivo à `VaultFactory`) e, em vez disso, fortalece a arquitetura de controle de acesso do protocolo, mantendo-a consistente e segura.
