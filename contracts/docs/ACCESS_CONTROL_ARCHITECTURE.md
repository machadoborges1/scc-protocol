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
-   **Justificativa:** Este padrão estabelece a governança descentralizada como a autoridade máxima. O `Timelock` garante que nenhuma mudança crítica possa ser executada instantaneamente, fornecendo à comunidade um período de tempo para auditar e reagir, um pilar da segurança em DeFi.

### 2.2. Padrão 2: Role-Based Access Control (RBAC) (Papéis Operacionais)

-   **Função:** Gerenciar permissões para classes específicas de usuários ou bots que precisam executar ações no protocolo.
-   **Implementação:** O framework de governança (`SCC_Governor` e `TimelockController`) utiliza papéis como `PROPOSER_ROLE` e `EXECUTOR_ROLE` para gerenciar o ciclo de vida das propostas.
-   **Justificativa:** O RBAC permite uma separação clara de responsabilidades. Em vez de conceder permissões administrativas amplas, ele concede apenas os privilégios necessários para uma função específica. Por exemplo, detentores de tokens podem ter o `PROPOSER_ROLE` sem terem a capacidade de executar propostas diretamente.

### 2.3. Padrão 3: Capability-Based (Capacidades para Contratos)

-   **Função:** Proteger a comunicação entre os contratos internos do protocolo (Contract-to-Contract).
-   **Implementação:** Em vez de um contrato ter um "papel" amplo, ele recebe uma "capacidade" (capability) específica e limitada para chamar uma função em outro contrato. A concessão dessa capacidade é, por si só, uma ação administrativa gerenciada por um padrão de nível superior (RBAC ou Ownable).
    -   **Exemplo 1:** O `LiquidationManager` recebe a capacidade de chamar `transferCollateralTo()` em um `Vault`.
    -   **Exemplo 2:** O `Vault` recebe a capacidade de chamar `getPrice()` no `OracleManager`.
    -   **Exemplo 3 (Modelo Ideal):** A Governança (detentora do `DEFAULT_ADMIN_ROLE` no `OracleManager`) concede o `AUTHORIZER_ROLE` (um papel RBAC) para a `VaultFactory`. A `VaultFactory` então usa este papel para conceder a capacidade `getPrice` a cada novo `Vault` que cria.
-   **Justificativa:** Este é o **Princípio do Menor Privilégio** em prática. Cada contrato opera com o mínimo de confiança necessário, reduzindo drasticamente a superfície de ataque. A `VaultFactory`, por exemplo, pode autorizar `Vaults`, mas não pode alterar os oráculos de preço.

## 3. Conclusão

A combinação desses três padrões cria um sistema de defesa em profundidade. A governança é robusta e descentralizada, os papéis operacionais são bem definidos e as interações internas do sistema são protegidas pelo princípio do menor privilégio. A arquitetura do protocolo SCC segue estas melhores práticas.
