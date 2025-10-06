# Arquitetura de Controle de Acesso

**Status:** Documentado

## 1. Filosofia Principal

O protocolo SCC adota uma **arquitetura de controle de acesso híbrida**, utilizando múltiplos padrões de design para garantir o mais alto nível de segurança, flexibilidade e descentralização. A filosofia é aplicar o padrão certo para a tarefa certa, em vez de depender de uma única metodologia.

Este modelo híbrido é composto por três padrões principais:

1.  **`Ownable` com `Timelock`:** Para controle administrativo global.
2.  **Role-Based Access Control (RBAC):** Para permissões operacionais de atores externos.
3.  **Capability-Based Access Control:** Para comunicação segura entre contratos internos.

---

## 2. Padrões em Detalhe

### 2.1. Padrão 1: `Ownable` + `Timelock` (Governança Administrativa)

-   **Função:** Gerenciar ações de altíssimo risco que alteram as regras fundamentais do protocolo (ex: upgrades de contrato, alteração de parâmetros de risco globais).
-   **Implementação:** Os contratos principais (`VaultFactory`, `OracleManager`, etc.) são `Ownable`. Na fase de deploy, a propriedade (`ownership`) desses contratos é transferida para um contrato `TimelockController`.
-   **Justificativa:** Este padrão estabelece a governança descentralizada como a autoridade máxima. O `Timelock` garante que nenhuma mudança crítica possa ser executada instantaneamente, fornecendo à comunidade um período de tempo para auditar e reagir.

### 2.2. Padrão 2: Role-Based Access Control (RBAC) (Papéis Operacionais)

-   **Função:** Gerenciar permissões para classes específicas de usuários ou bots que precisam executar ações no protocolo.
-   **Implementação:** O framework de governança (`SCC_Governor` e `TimelockController`) utiliza papéis como `PROPOSER_ROLE` e `EXECUTOR_ROLE`. Contratos como `SCC_USD` e `OracleManager` definem papéis customizados (`MINTER_ROLE`, `AUTHORIZER_ROLE`) para delegar permissões específicas.
-   **Justificativa:** O RBAC permite uma separação clara de responsabilidades. Em vez de conceder permissões administrativas amplas, ele concede apenas os privilégios necessários para uma função específica.

### 2.3. Padrão 3: Capability-Based (Capacidades para Contratos)

-   **Função:** Proteger a comunicação entre os contratos internos do protocolo (Contract-to-Contract).
-   **Implementação:** Um contrato recebe uma "capacidade" (capability) específica e limitada para chamar uma função em outro contrato. A concessão dessa capacidade é, por si só, uma ação administrativa gerenciada por um padrão de nível superior (RBAC).
-   **Justificativa:** Este é o **Princípio do Menor Privilégio** em prática. Cada contrato opera com o mínimo de confiança necessário, reduzindo drasticamente a superfície de ataque.

---

## 3. Fluxo de Permissões Pós-Deploy (Exemplo Prático)

Para que o sistema funcione corretamente, uma série de permissões deve ser configurada após a implantação inicial dos contratos. Este fluxo é um exemplo prático de como os padrões de RBAC e Capacidades se interligam.

**Cenário:** Um usuário chama `createNewVault()` na `VaultFactory`.

**Requisitos de Permissão:**

1.  **O `VaultFactory` precisa autorizar o novo `Vault` no `OracleManager`:** Para que o `Vault` possa consultar preços, a `VaultFactory` chama `oracleManager.setAuthorization(newVaultAddress, true)`. Esta função é protegida e exige que o chamador (`VaultFactory`) tenha a `AUTHORIZER_ROLE`.

2.  **O `VaultFactory` precisa dar ao novo `Vault` a permissão de mintar `SCC_USD`:** A `VaultFactory` chama `sccUsd.grantRole(MINTER_ROLE, newVaultAddress)`. Esta função também é protegida e exige que o chamador (`VaultFactory`) tenha a `MINTER_GRANTER_ROLE`.

3.  **O `LiquidationManager` precisa ler preços do `OracleManager`:** Para verificar se um vault está subcolateralizado, o `LiquidationManager` chama `oracle.getPrice()`. Esta função exige que o chamador (`LiquidationManager`) seja um endereço autorizado.

**Ações de Configuração Pós-Deploy (Executadas pela Conta Deployer/Governança):**

Para satisfazer os requisitos acima, a conta que fez o deploy (e que detém a `DEFAULT_ADMIN_ROLE` por padrão) deve executar as seguintes transações de configuração:

```solidity
// 1. Dar ao VaultFactory a permissão para gerenciar autorizações no OracleManager
bytes32 authorizerRole = oracleManager.AUTHORIZER_ROLE();
oracleManager.grantRole(authorizerRole, address(vaultFactory));

// 2. Dar ao VaultFactory a permissão para conceder a MINTER_ROLE no SCC_USD
bytes32 minterGranterRole = sccUsd.MINTER_GRANTER_ROLE();
sccUsd.grantRole(minterGranterRole, address(vaultFactory));

// 3. Autorizar o LiquidationManager a consultar preços
oracleManager.setAuthorization(address(liquidationManager), true);
```

Este fluxo de configuração explícita é uma **feature de segurança fundamental**, garantindo que as interações e relações de confiança entre os contratos do sistema sejam estabelecidas de forma deliberada e segura pela governança.