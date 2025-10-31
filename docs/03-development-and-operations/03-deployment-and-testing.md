# 3. SCC Protocol Deployment and Testing

This document describes the standard processes for the deployment and testing of the SCC protocol's smart contracts, covering both deployment via Foundry scripts and the configuration of a complete testing environment.

## 3.1. Smart Contract Deployment (Foundry Scripts)

The deployment of the smart contracts is carried out through Foundry scripts, which automate the deployment and configuration of all protocol contracts in the correct order of dependency. This method is ideal for deployments on test networks or for the initial deployment of the development environment.

### 3.1.1. Deploy Script (`Deploy.s.sol`)

The `contracts/script/Deploy.s.sol` script is primarily responsible for the deployment. It executes the following steps:

1.  **Network Configuration:** Detects the `chainId` to determine if it is on a local network (e.g., Anvil) or a testnet (e.g., Sepolia). For local networks, it deploys mocks (e.g., `MockERC20` for WETH, `MockV3Aggregator` for the price feed).
2.  **Core Contract Deployment:** Deploys the essential protocol contracts:
    *   `SCC_USD`
    *   `OracleManager`
    *   `SCC_Parameters`
    *   `LiquidationManager`
    *   `VaultFactory`
3.  **Governance and Staking Deployment:** Deploys the contracts related to governance and staking:
    *   `SCC_GOV`
    *   `TimelockController`
    *   `SCC_Governor`
    *   `StakingPool`
4.  **Configuration and Ownership Transfer:**
    *   Configures the `OracleManager` with the price feeds and authorizes the `LiquidationManager` and `VaultFactory` to query it.
    *   Grants the `MINTER_GRANTER_ROLE` of `SCC_USD` to the `VaultFactory`.
    *   Configures the roles (`PROPOSER_ROLE`, `EXECUTOR_ROLE`, `DEFAULT_ADMIN_ROLE`) in the `TimelockController` for the `SCC_Governor`.
    *   Transfers the ownership of critical contracts (`VaultFactory`, `LiquidationManager`, `StakingPool`, `OracleManager`, `SCC_USD`) to the `TimelockController`, ensuring that future changes are made via governance.
5.  **Test Ecosystem Creation (for local networks only):** To facilitate local development and testing, the script creates a rich ecosystem, including:
    *   Multiple `Vaults` with different collateralization levels (healthy, warning, under-collateralized).
    *   Staking of `SCC-GOV`.
    *   Simulation of a WETH price drop to test liquidation scenarios.

### 3.1.2. Running the Deploy Script

To run the deploy script:

1.  **Check the Environment:** Ensure that a blockchain node (Anvil for local development, or a testnet/mainnet node) is active and accessible.
2.  **Command:** Use `forge script` with the appropriate parameters:
    ```bash
    forge script contracts/script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
    ```
    *   `<RPC_URL>`: RPC address of the target network (e.g., `http://localhost:8545` for Anvil, or a testnet URL).
    *   `<PRIVATE_KEY>`: Private key of the account that will perform the deployment (for testnets/mainnet, use a secure key manager).
    *   `--broadcast`: Sends the transactions to the network.

### 3.1.3. Collecting Contract Addresses

The output of the deploy script will provide the addresses of the newly created contracts. These addresses are crucial for configuring the off-chain services (e.g., in the Keeper Bot's `.env` file and for the Subgraph).

## 3.2. Testing and Integration Tests

After deployment, the protocol's testing is carried out through a comprehensive integration test suite, as detailed in the `02-testing-workflow.md` document.

*   **Contract Tests:** The Foundry tests verify the functionality and security of the deployed contracts.
*   **Off-chain Services Tests:** The Keeper Bot's integration tests (`offchain/test/integration/liquidation.test.ts`) ensure that the off-chain services interact correctly with the contracts deployed on the blockchain.
*   **Subgraph Verification:** The `pnpm test:integration` process includes the deployment and testing of the Subgraph, ensuring that blockchain events are being indexed correctly and that the GraphQL API is working as expected.

## 3.3. Continuous Testing Environment

For continuous integration/continuous deployment (CI/CD) environments, the deployment and testing process can be automated. The `pnpm test:integration` command at the root of the monorepo is an example of how this automation can be orchestrated, ensuring that all parts of the system work together before each new release.
