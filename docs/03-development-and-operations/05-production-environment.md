# Production Environment Architecture and Requirements

This document describes the components and architecture required to deploy and operate the SCC protocol in a production (mainnet) environment.

## Overview

The transition from a local development environment to production involves replacing simulated components (like Anvil) with real services and adding robust layers of security, monitoring, and infrastructure.

---

### 1. Blockchain Access (Nodes)

In production, access to the blockchain network is done through Node-as-a-Service providers.

-   **Recommended Services:**
    -   [Infura](https://infura.io/)
    -   [Alchemy](https://www.alchemy.com/)
    -   [QuickNode](https://www.quicknode.com/)
-   **Function:** They provide the RPC interface (`RPC_URL`) for the main network (e.g., Ethereum Mainnet). They ensure reliable and scalable access, eliminating the need to maintain your own node.
-   **Note:** High-volume transaction projects will require a paid plan to ensure connection performance and stability.

### 2. Infrastructure for Off-chain Services

The Keeper Bot and other possible backend services need to run on high-availability servers.

-   **Cloud Provider:**
    -   **Platforms:** AWS (Amazon Web Services), GCP (Google Cloud Platform), Azure.
-   **Service Hosting (Keeper Bot):**
    -   **Option 1 (Simple):** A virtual machine (e.g., **AWS EC2**) with Docker, to replicate the `docker-compose` environment more robustly.
    -   **Option 2 (Advanced):** A container orchestration service like **Kubernetes (EKS on AWS)** or **AWS Fargate**. This option offers superior resilience, automatically restarting services in case of failure.

### 3. Security

This is the most critical area in a production environment.

-   **Smart Contract Audits:**
    -   **Action:** **MANDATORY**. Before deployment, the contracts must be audited by one or more independent and respected security firms (e.g., Trail of Bits, ConsenSys Diligence, OpenZeppelin).
-   **Secrets Management:**
    -   **Deployer/Administrator Key:** Should be a multi-signature wallet (**Gnosis Safe**). This distributes control and avoids a single point of failure.
    -   **Keeper Bot Key:** The bot's private key, which signs maintenance transactions (like liquidations), needs to be a "hot wallet". It should **NEVER** be stored in plain text.
        -   **Solution:** Use a secrets vault like **AWS Secrets Manager** or **HashiCorp Vault**. The bot receives permission to access the key dynamically, without it being exposed.
-   **On-chain Security Monitoring:**
    -   **Services:** **Forta**, **OpenZeppelin Defender**.
    -   **Function:** They monitor the activity of your contracts in real-time and trigger alerts on suspicious transactions that may indicate an attack.

### 4. Monitoring and Operations (DevOps)

It is crucial to know what is happening with the system at all times.

-   **Logging and Alerts:**
    -   **Tools:** Datadog, Grafana, PagerDuty, Slack.
    -   **Function:** Centralize logs from off-chain services and create automatic alerts for critical events, such as:
        -   The Keeper Bot is inactive.
        -   The Keeper's wallet gas balance is low.
        -   A high error rate has occurred.
-   **Data Dashboards:**
    -   **Tools:** **Dune Analytics**, **The Graph**.
    -   **Function:** Create dashboards to visualize the health of the protocol (TVL, collateralization ratios, number of users, etc.).

### 5. Frontend (User Interface)

-   **Hosting:**
    -   **Services:** **Vercel**, **Netlify**, **AWS S3 + CloudFront**.
    -   **Function:** They publish the web application (React, Vue, etc.) that end-users will use to interact with the protocol.
