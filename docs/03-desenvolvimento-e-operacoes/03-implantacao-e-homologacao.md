# 3. Implantação e Homologação do Protocolo SCC

Este documento descreve os processos padrão para a implantação (deploy) e homologação dos smart contracts do protocolo SCC, cobrindo tanto o deploy via scripts do Foundry quanto a configuração de um ambiente de teste completo.

## 3.1. Implantação de Contratos Inteligentes (Foundry Scripts)

A implantação dos smart contracts é realizada através de scripts do Foundry, que automatizam a implantação e configuração de todos os contratos do protocolo na ordem correta de dependência. Este método é ideal para deploys em redes de teste ou para a implantação inicial do ambiente de desenvolvimento.

### 3.1.1. Script de Deploy (`Deploy.s.sol`)

O script `contracts/script/Deploy.s.sol` é o principal responsável pela implantação. Ele executa as seguintes etapas:

1.  **Configuração de Rede:** Detecta a `chainId` para determinar se está em uma rede local (ex: Anvil) ou em uma testnet (ex: Sepolia). Para redes locais, ele implanta mocks (ex: `MockERC20` para WETH, `MockV3Aggregator` para o feed de preço).
2.  **Deploy de Contratos Core:** Implanta os contratos essenciais do protocolo:
    *   `SCC_USD`
    *   `OracleManager`
    *   `SCC_Parameters`
    *   `LiquidationManager`
    *   `VaultFactory`
3.  **Deploy de Governança e Staking:** Implanta os contratos relacionados à governança e staking:
    *   `SCC_GOV`
    *   `TimelockController`
    *   `SCC_Governor`
    *   `StakingPool`
4.  **Configuração e Transferência de Propriedade:**
    *   Configura o `OracleManager` com os feeds de preço e autoriza o `LiquidationManager` e `VaultFactory` a consultá-lo.
    *   Concede o `MINTER_GRANTER_ROLE` do `SCC_USD` ao `VaultFactory`.
    *   Configura os papéis (`PROPOSER_ROLE`, `EXECUTOR_ROLE`, `DEFAULT_ADMIN_ROLE`) no `TimelockController` para o `SCC_Governor`.
    *   Transfere a propriedade (`ownership`) de contratos críticos (`VaultFactory`, `LiquidationManager`, `StakingPool`, `OracleManager`, `SCC_USD`) para o `TimelockController`, garantindo que futuras alterações sejam feitas via governança.
5.  **Criação de Ecossistema de Teste (apenas para redes locais):** Para facilitar o desenvolvimento e teste local, o script cria um ecossistema rico, incluindo:
    *   Múltiplos `Vaults` com diferentes níveis de colateralização (saudável, em aviso, sub-colateralizado).
    *   Staking de `SCC-GOV`.
    *   Simulação de queda de preço do WETH para testar cenários de liquidação.

### 3.1.2. Execução do Script de Deploy

Para executar o script de deploy:

1.  **Verificar o Ambiente:** Garanta que um nó de blockchain (Anvil para desenvolvimento local, ou um nó de testnet/mainnet) está ativo e acessível.
2.  **Comando:** Utilize `forge script` com os parâmetros apropriados:
    ```bash
    forge script contracts/script/Deploy.s.sol --rpc-url <URL_DO_RPC> --private-key <CHAVE_PRIVADA> --broadcast
    ```
    *   `<URL_DO_RPC>`: Endereço RPC da rede alvo (ex: `http://localhost:8545` para Anvil, ou uma URL de testnet).
    *   `<CHAVE_PRIVADA>`: Chave privada da conta que realizará o deploy (para testnets/mainnet, use um gerenciador de chaves seguro).
    *   `--broadcast`: Envia as transações para a rede.

### 3.1.3. Coleta de Endereços de Contrato

A saída do script de deploy fornecerá os endereços dos contratos recém-criados. Estes endereços são cruciais para configurar os serviços off-chain (ex: no arquivo `.env` do Keeper Bot e para o Subgraph).

## 3.2. Homologação e Testes de Integração

Após a implantação, a homologação do protocolo é realizada através de uma suíte de testes de integração abrangente, conforme detalhado no documento `02-fluxo-de-testes.md`.

*   **Testes de Contratos:** Os testes do Foundry verificam a funcionalidade e segurança dos contratos implantados.
*   **Testes de Serviços Off-chain:** Os testes de integração do Keeper Bot (`offchain/test/integration/liquidation.test.ts`) garantem que os serviços off-chain interagem corretamente com os contratos implantados na blockchain.
*   **Verificação do Subgraph:** O processo de `pnpm test:integration` inclui a implantação e teste do Subgraph, garantindo que os eventos da blockchain estão sendo indexados corretamente e que a API GraphQL está funcionando como esperado.

## 3.3. Ambiente de Homologação Contínuo

Para ambientes de homologação contínua (CI/CD), o processo de deploy e teste pode ser automatizado. O comando `pnpm test:integration` na raiz do monorepo é um exemplo de como essa automação pode ser orquestrada, garantindo que todas as partes do sistema funcionem em conjunto antes de cada nova versão.
