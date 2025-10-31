# 3. SCC Protocol Launch Plan

This document describes the launch plan for the SCC Protocol, focusing on the essential steps for a safe and successful launch of the Minimum Viable Product (MVP) and the initial strategies to boost liquidity and adoption of `SCC-USD`.

## 3.1. Phase 0: Pre-Launch (MVP Completion and Audits)

This phase focuses on finalizing the MVP development and ensuring its security and robustness.

*   **MVP Development Completion:**
    *   Finalization of all smart contracts (`VaultFactory`, `Vault`, `SCC_USD`, `SCC_GOV`, `OracleManager`, `LiquidationManager`, `SCC_Governor`, `TimelockController`, `StakingPool`).
    *   Full implementation of off-chain services (Keeper Bot, Subgraph).
    *   Frontend (DApp) development for all MVP functionalities.
*   **Exhaustive Testing:**
    *   Full execution of the smart contract test suite (unit, integration, forking, fuzzing).
    *   Full execution of off-chain services and Subgraph integration tests.
    *   Additional security tests (re-entrancy, simulated governance attacks).
*   **Security Audits:**
    *   Completion of at least two independent audits by reputable security firms.
    *   Resolution of all identified critical and high-severity vulnerabilities.
*   **Governance Configuration:**
    *   Deployment and configuration of `TimelockController` and `SCC_Governor`.
    *   Configuration of `Gnosis Safe (Multisig)` as the `Timelock` administrator.
    *   Transfer of ownership of all critical contracts to the `Timelock`.
*   **Documentation:**
    *   Finalization of all technical, product, and business documentation (as per this plan).

## 3.2. Phase 1: MVP Launch and Liquidity Bootstrap

This phase focuses on deploying the protocol to the mainnet and creating initial liquidity for `SCC-USD`.

*   **Mainnet Deployment:**
    *   Deployment of all MVP smart contracts on the main network (Ethereum or compatible L2).
    *   Deployment of off-chain services (Keeper Bot, Subgraph) on production infrastructure.
    *   Launch of the publicly accessible Frontend (DApp).
*   **Primary Liquidity Creation:**
    *   **Curve Finance Liquidity Pool:** Creation of an `SCC-USD`/`3CRV` metapool on Curve Finance to ensure deep liquidity and low slippage for `SCC-USD`.
    *   **Incentive Programs (Liquidity Mining):** Launch of incentive programs with `SCC-GOV` emissions to attract liquidity providers to the Curve pool.
*   **Active Monitoring:**
    *   Activation of 24/7 monitoring with Prometheus, Grafana, Tenderly/Forta for anomaly detection and alerts.
*   **Bug Bounty Program:** Launch of a bug bounty program to encourage the discovery and responsible reporting of post-launch vulnerabilities.

## 3.3. Phase 2: Expansion and Utility (Short to Medium Term)

After MVP stabilization and initial liquidity creation, the focus shifts to expanding the utility and adoption of `SCC-USD`.

*   **Collateral Expansion:**
    *   Governance proposals to add support for new collateral assets (e.g., `wBTC`, Liquid Staking Tokens - `LSTs`).
    *   Integration of new price feeds into the `OracleManager` for new collaterals.
*   **DeFi Ecosystem Integration:**
    *   Initiation of discussions and submission of governance proposals to list `SCC-USD` on money markets (e.g., Aave, Compound, Euler).
    *   Exploration of partnerships with other DeFi protocols to increase `SCC-USD` use cases.

## 3.4. Phase 3: Protocol Evolution (Long Term)

This phase aims to solidify the protocol's market position and explore long-term innovations.

*   **Peg Stability Module (PSM):** Implementation of a PSM to strengthen the `SCC-USD` peg to the dollar, creating a robust arbitrage mechanism.
*   **Real World Assets (RWA):** Research and development for the integration of RWAs as collateral, diversifying risk and scaling `SCC-USD` issuance.
*   **Protocol Owned Liquidity (POL):** Utilization of protocol revenue to acquire and permanently own LP tokens, ensuring a minimum level of liquidity.
*   **Strategy Vaults:** Creation of contracts that implement automated yield farming strategies for users, increasing the utility of `SCC-USD` within the ecosystem itself.
