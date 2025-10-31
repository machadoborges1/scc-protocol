# DeFi Strategies Document

**Project:** Crypto-Collateralized Stablecoin (SCC)
**Version:** 0.1
Status: Active

## 1. Introduction

The success of the SCC-USD stablecoin depends on its deep integration and utility within the DeFi ecosystem. A stablecoin without liquidity and use cases has little value. This document describes the initial strategies to bootstrap SCC-USD liquidity and drive its adoption.

Strategies will be incentivized with emissions of the governance token, SCC-GOV, as described in the Tokenomics document.

## 2. Strategy 1: AMM Liquidity Pool (Focus on Liquidity)

This is the highest priority strategy for launch, as it ensures users can buy and sell SCC-USD with low slippage.

- **Objective:** Create a liquid market for SCC-USD against other established stablecoins.

- **Proposed Platform:** **Curve Finance**.
    - **Pool:** A "metapool" that pairs **SCC-USD** with the base pool **3CRV** (DAI+USDC+USDT). This is the industry standard for new stablecoins and offers immediate access to the liquidity of major stablecoins.

- **Incentive Mechanism:**
    1.  Users deposit SCC-USD and/or 3CRV into the Curve pool to receive LP (Liquidity Provider) tokens.
    2.  The SCC protocol will have a `StakingPool` contract where users can deposit (stake) their Curve LP tokens.
    3.  The `StakingPool` will distribute **SCC-GOV** rewards to these users, proportional to their participation.

## 3. Strategy 2: Integration with Money Markets (Focus on Utility)

Being listed as an asset on large money markets dramatically increases the utility of SCC-USD.

- **Objective:** Allow users to lend and borrow SCC-USD and use it as collateral on platforms like Aave and Compound.

- **Target Platforms:** **Aave**, **Compound**, **Euler**.

- **Action Plan:**
    1.  **Phase 1 (Post-Launch):** Focus on Strategy 1 to achieve significant trading volume and market capitalization. Peg stability must be proven for several months.
    2.  **Phase 2:** Initiate conversations with the Aave and Compound governance communities.
    3.  **Phase 3:** Submit a formal governance proposal on each platform to list SCC-USD. The proposal should highlight the security of our protocol, asset liquidity, and benefits to the platform.

## 4. Strategy 3: Collateral Type Expansion

This strategy is fundamental for the long-term scalability and security of the protocol.

- **Objective:** Increase the protocol's collateral base, diversify risk, and attract new user audiences.
- **Action Plan:**
    1. **Add wBTC:** The logical first step is to add **Wrapped Bitcoin (wBTC)** as a collateral type. This will open the protocol to the vast market of Bitcoin holders.
    2. **Governance:** The addition of new collateral will be a governance-managed process, which will vote to approve a new asset and configure its respective price oracle in the `OracleManager`.

## 5. Future Strategies

After the successful implementation of the initial strategies, the protocol can explore more advanced growth vectors:

### 5.1. Yield-Generating Collaterals (LSTs and LRTs)
-   **What they are:** Liquid Staking Tokens (e.g., stETH, rETH) and Liquid Restaking Tokens.
-   **Strategy:** Allow users to use these assets as collateral. As the assets themselves generate yield, the effective cost of borrowing for the user dramatically decreases, making SCC-USD one of the cheapest and most attractive borrowing options in the market.

### 5.2. Peg Stability Module (PSM)
-   **What it is:** A contract that allows 1:1 exchanges between `SCC-USD` and other central stablecoins (like USDC) with a minimal fee.
-   **Strategy:** Implement a PSM to strengthen the `SCC-USD` peg to the dollar. This creates a robust arbitrage mechanism that ensures price stability, increasing confidence and the stablecoin's utility as a medium of exchange.

### 5.3. Real-World Assets (RWA - Real-World Assets)
-   **What it is:** The tokenization of traditional assets, suchando treasury bonds, mortgages, or invoices.
-   **Strategy:** Explore partnerships to bring RWA into the protocol as collateral. This diversifies risk outside the crypto ecosystem and opens a path to scale `SCC-USD` issuance by orders of magnitude, serving a multi-trillion dollar market.

### 5.4. Protocol Owned Liquidity (POL)
-   **Strategy:** The protocol's treasury, controlled by governance, can use part of its revenue to acquire and permanently own LP tokens from the Curve pool. This ensures a minimum level of liquidity forever, making `SCC-USD` more resilient to market shocks.

### 5.5. Strategy Vaults
-   **Strategy:** Creation of contracts that implement automated yield farming strategies for users, using `SCC-USD` as the base asset, increasing its utility within the ecosystem itself.
