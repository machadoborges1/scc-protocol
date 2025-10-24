# Implementação Técnica da Governança

**Status:** Documentado

## 1. Introdução

Este documento serve como um guia técnico para desenvolvedores sobre a implementação do sistema de governança no protocolo SCC. Ele complementa o documento de arquitetura de alto nível, focando nos detalhes de implementação, no fluxo de configuração durante o deploy e nas funções específicas controladas pela governança em cada contrato.

## 2. Componentes Principais

A governança é composta por três contratos do OpenZeppelin, que trabalham em conjunto:

-   **`SCC_GOV` (`ERC20Votes`):** O token de governança. Sua funcionalidade `Votes` permite a delegação de poder de voto e a captura de "snapshots" do balanço dos eleitores no momento da criação da proposta, prevenindo a compra de tokens para influenciar votações em andamento.
-   **`SCC_Governor` (`Governor`):** O cérebro da governança. Ele orquestra o processo de votação, incluindo a criação de propostas, o período de votação, a contagem de votos e o quórum. É o único com permissão para enfileirar propostas no `TimelockController`.
-   **`TimelockController` (`TimelockController`):** O executor e guardião do protocolo. Este contrato é o **proprietário (`owner`)** de todos os outros contratos do sistema. Ele impõe um atraso de tempo (`delay`) obrigatório entre a aprovação de uma proposta e sua execução, funcionando como uma salvaguarda crítica para a segurança do protocolo.

## 3. Fluxo de Configuração no Deploy (`Deploy.s.sol`)

O script de deploy (`Deploy.s.sol`) é responsável por configurar corretamente toda a cadeia de comando da governança. O fluxo é o seguinte:

1.  **Deploy dos Contratos:** Todos os contratos do protocolo (`OracleManager`, `VaultFactory`, `LiquidationManager`, `StakingPool`, etc.) são implantados.
2.  **Deploy dos Contratos de Governança:** `SCC_GOV`, `TimelockController` e `SCC_Governor` são implantados.
3.  **Configuração do Timelock:**
    *   O papel `PROPOSER_ROLE` do Timelock é concedido ao `SCC_Governor`.
    *   O papel `EXECUTOR_ROLE` do Timelock é concedido a `address(0)` (qualquer um).
    *   O papel `TIMELOCK_ADMIN_ROLE` (o administrador do próprio Timelock) é renunciado pelo deployer e transferido para o próprio Timelock. A partir deste ponto, apenas o Timelock pode se reconfigurar, através de uma proposta de governança.
4.  **Transferência de Propriedade:** A propriedade (`owner`) de cada contrato do protocolo é transferida para o endereço do `TimelockController`.
5.  **Concessão de Permissões Especiais:** O script concede permissões específicas necessárias para a operação do sistema, como dar ao `VaultFactory` o `AUTHORIZER_ROLE` no `OracleManager` e o `MINTER_GRANTER_ROLE` no `SCC_USD`.

Ao final do script, nenhuma carteira externa (EOA) possui controle administrativo sobre o protocolo. O controle total reside no `TimelockController`, que por sua vez é controlado pelo `SCC_Governor`.

## 4. Tabela de Funções Governaveis

A tabela a seguir consolida as principais funções administrativas que a governança (via `TimelockController`) pode executar nos contratos do protocolo.

| Contrato | Função Governável | Descrição da Ação |
| :--- | :--- | :--- |
| **`OracleManager`** | `setPriceFeed(address asset, address feed)` | Adiciona ou atualiza o endereço do oráculo de preço para um ativo de colateral. |
| | `setAuthorization(address user, bool authorized)` | Autoriza ou desautoriza um contrato (como um `Vault`) a usar a função `getPrice`. |
| **`LiquidationManager`** | `withdrawFees(address recipient, uint256 amount)` | Saca as taxas de `SCC-USD` acumuladas no contrato (provenientes de liquidações) para um endereço de destino (ex: `StakingPool`). |
| **`StakingPool`** | `notifyRewardAmount(uint256 reward, uint256 duration)` | Inicia um novo período de distribuição de recompensas, depositando `SCC-USD` e definindo a duração da distribuição. |
| **`SCC_USD`** | `grantRole(bytes32 role, address account)` | Concede papéis de acesso, como `MINTER_ROLE` ou `MINTER_GRANTER_ROLE`. |
| | `revokeRole(bytes32 role, address account)` | Revoga papéis de acesso. |
| **`VaultFactory`** | `N/A` | O `VaultFactory` é imutável por design. Para alterar seus parâmetros, a governança deve implantar uma nova fábrica e atualizar as integrações. |
| **`SCC_Governor`** | `setVotingDelay(uint256 newVotingDelay)` | Altera o atraso entre a criação de uma proposta e o início da votação. |
| | `setVotingPeriod(uint256 newVotingPeriod)` | Altera a duração do período de votação. |
| | `setProposalThreshold(uint256 newProposalThreshold)` | Altera a quantidade mínima de `SCC_GOV` necessária para criar uma proposta. |
| | `setQuorumNumerator(uint256 newQuorumNumerator)` | Altera o quórum necessário para uma votação ser válida. |
