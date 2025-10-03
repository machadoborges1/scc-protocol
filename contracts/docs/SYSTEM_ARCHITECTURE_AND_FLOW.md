# Arquitetura do Sistema e Fluxo de Dados

**Status:** Documentado

## 1. Propósito

Este documento detalha a arquitetura geral do protocolo SCC, a função de cada contrato principal e o fluxo de dados entre eles. Ele também documenta um problema de design de dependência circular identificado durante a análise e a solução arquitetural implementada.

## 2. Visão Geral dos Contratos e Suas Funções

O protocolo opera com um conjunto de contratos especializados que interagem para permitir a criação de dívida colateralizada de forma segura.

---

### 2.1. `OracleManager.sol`

-   **Função para o Negócio (Protocolo):**
    Este contrato atua como o **"Serviço de Inteligência de Preços"** do protocolo. Sua função crítica é ser a fonte única e confiável para os preços de todos os ativos de colateral. Ele se conecta a oráculos externos (Chainlink), padroniza os preços e inclui verificações de segurança vitais (ex: `StalePrice`) para proteger o protocolo contra falhas ou manipulação de oráculos.

-   **Função para o Usuário (Indireta):**
    O usuário não interage diretamente com este contrato. Ele funciona nos bastidores como um **garantidor de justiça e segurança**, informando ao `Vault` o preço justo do colateral para calcular os limites de empréstimo.

---

### 2.2. `VaultFactory.sol`

-   **Função para o Negócio (Protocolo):**
    É a **"Agência de Abertura de Contas"** do protocolo. Sua responsabilidade é padronizar a criação de novos `Vaults`, garantindo que cada um seja configurado com os parâmetros corretos e globais do sistema (endereços do `OracleManager`, `SCC_USD`, etc.).

-   **Função para o Usuário:**
    É o **ponto de partida** para o usuário. A primeira ação para tomar um empréstimo é chamar `createNewVault()` neste contrato, recebendo em troca um `Vault` pessoal (representado por um NFT) para gerenciar sua dívida.

---

### 2.3. `Vault.sol`

-   **Função para o Negócio (Protocolo):**
    Cada `Vault` é uma **"Célula de Dívida Individual"**. Ele guarda o colateral e registra a dívida (`SCC-USD`) de uma única posição. Sua principal função de negócio é aplicar o rácio de colateralização, consultando o `OracleManager` para proibir operações que tornem a posição arriscada.

-   **Função para o Usuário:**
    É o **"Painel de Controle da Dívida"** do usuário. Após criar seu `Vault`, o usuário o utiliza para:
    -   `depositCollateral()`: Adicionar garantia.
    -   `withdrawCollateral()`: Retirar garantia.
    -   `mint()`: Tomar `SCC-USD` emprestado.
    -   `burn()`: Pagar o empréstimo.

---

### 2.4. `LiquidationManager.sol`

-   **Função para o Negócio (Protocolo):**
    É o **"Sistema Imunológico"** do protocolo. Protege o `SCC-USD` de insolvência ao eliminar dívidas ruins. Quando um `Vault` se torna sub-colateralizado, este contrato assume e vende o colateral em um leilão para quitar a dívida.

-   **Função para o Usuário:**
    -   **Para o Dono do Vault:** Se sua posição for liquidada, este contrato vende seu colateral para pagar a dívida.
    -   **Para um "Agente Liquidador":** Oferece uma oportunidade de negócio, permitindo a compra de colateral em leilão, potencialmente com desconto.

---

## 3. Análise do Fluxo de Dados e Resolução da Dependência Circular

### 3.1. O Fluxo de Autorização Ideal

1.  Um usuário chama `createNewVault()` na `VaultFactory`.
2.  A `VaultFactory` cria um novo contrato `Vault`.
3.  O novo `Vault` precisa consultar preços no `OracleManager`. Para isso, ele precisa de **autorização**.
4.  Portanto, a `VaultFactory`, após criar o `Vault`, deve ser capaz de solicitar ao `OracleManager` a autorização para o endereço do novo `Vault`.

### 3.2. O Problema de Design: Dependência Circular

A implementação original dessa lógica criou um impasse de deploy:

-   **Lógica Antiga:** O `OracleManager` foi projetado com uma regra de negócio que apenas a `VaultFactory` poderia autorizar novos `Vaults`. Para aplicar isso, o construtor do `OracleManager` exigia o endereço da `VaultFactory` para armazená-lo em uma variável `immutable`.
-   **O Impasse:**
    -   Para implantar o `OracleManager`, era necessário o endereço da `VaultFactory`.
    -   Para implantar a `VaultFactory`, era necessário o endereço do `OracleManager`.
    -   Resultado: Nenhum dos dois contratos podia ser implantado primeiro.

### 3.3. A Solução Arquitetural

A solução implementada **mantém a lógica de negócio intacta**, mas altera a implementação técnica para quebrar o impasse, seguindo padrões de design mais robustos e seguros (RBAC).

1.  **Remoção da Dependência do Construtor:** A necessidade do `OracleManager` conhecer a `VaultFactory` em seu construtor foi removida.
2.  **Uso de Papéis (RBAC):** O `OracleManager` agora usa o padrão `AccessControl`. A capacidade de autorizar `Vaults` é gerenciada por um `AUTHORIZER_ROLE`, enquanto a gestão de oráculos é feita pelo `DEFAULT_ADMIN_ROLE`.
3.  **Novo Fluxo de Deploy e Autorização:**
    a. O `OracleManager` é implantado.
    b. A `VaultFactory` é implantada.
    c. Após o deploy, a **Governança** (que detém o `DEFAULT_ADMIN_ROLE` no `OracleManager`) chama `oracleManager.grantRole(AUTHORIZER_ROLE, address(vaultFactory))`. Isso concede à `VaultFactory` a permissão específica para autorizar outros endereços.
    d. A partir de então, sempre que a `VaultFactory` criar um novo `Vault`, ela usará seu `AUTHORIZER_ROLE` para chamar `oracleManager.setAuthorization(address(newVault), true)`, completando o fluxo de negócio de forma segura.
