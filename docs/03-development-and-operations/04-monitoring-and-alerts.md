# 4. SCC Protocol Monitoring and Alerts

Monitoring and the alert system are crucial components to ensure the health, security, and continuous operation of the SCC Protocol. They allow for the early detection of anomalies, performance issues, or potential attacks, minimizing downtime and protecting user funds.

## 4.1. Metrics Monitoring (Prometheus)

The protocol uses Prometheus for the collection and storage of performance metrics from the off-chain services. This provides a detailed view of the system's behavior over time.

### 4.1.1. Prometheus Configuration (`monitoring/prometheus.yml`)

The `monitoring/prometheus.yml` file configures Prometheus to collect metrics from the `keeper-bot`:

```yaml
global:
  scrape_interval: 15s # By default, collects metrics every 15 seconds.

scrape_configs:
  - job_name: 'keeper-bot'
    static_configs:
      - targets: ['keeper:9091'] # 'keeper' is the service name in docker-compose, 9091 is the exposed port.
```

*   **`scrape_interval`:** Defines the frequency at which Prometheus collects metrics from the configured targets.
*   **`job_name: 'keeper-bot'`:** Identifies the metrics collection job for the Keeper Bot.
*   **`targets: ['keeper:9091']`:** Specifies the address and port where the Keeper Bot exposes its metrics in the Prometheus format. The name `keeper` refers to the service name in `docker-compose.yml`.

### 4.1.2. Metrics Exposed by the Keeper Bot

The Keeper Bot (`offchain/`) is configured to expose relevant metrics for Prometheus, which may include:

*   **Processing Latency:** The time the bot takes to process a `Vault` or a transaction.
*   **Number of Liquidations:** Count of successfully initiated liquidations.
*   **Transaction Errors:** Count of failures when sending transactions to the blockchain.
*   **Queue State:** Size of the queue of `Vaults` to be processed.
*   **Gas Usage:** Metrics related to the gas consumption of the sent transactions.

These metrics are essential for understanding the bot's performance, identifying bottlenecks, and optimizing its operation.

## 4.2. Alert System (`alerter.ts`)

The `alerter.ts` module in the off-chain service (`offchain/src/alerter.ts`) is responsible for generating and sending alerts in case of critical events or detected anomalies.

### 4.2.1. `sendAlert` Function

```typescript
import logger from './logger';

type AlertLevel = 'warn' | 'error' | 'fatal';

export function sendAlert(level: AlertLevel, title: string, details: object) {
  logger[level]({ alert: true, title, ...details }, `ALERT: ${title}`);
}
```

*   **`AlertLevel`:** Defines the severity of the alert (`warn`, `error`, `fatal`).
*   **`title`:** A short and descriptive title for the alert.
*   **`details`:** An object with additional details for debugging, such as transaction IDs, contract addresses, error messages, etc.
*   **Integration:** Currently, the `sendAlert` function logs the alert in a structured way. In a production environment, this function would be extended to make HTTP calls to external alert services, such as:
    *   **PagerDuty/OpsGenie:** For critical alerts that require immediate attention from the operations team.
    *   **Slack/Telegram:** For notifications in team communication channels.
    *   **Email/SMS:** For lower priority alerts or as a fallback.

### 4.2.2. Alert Scenarios

The alert system should be configured to trigger in scenarios such as:

*   **Under-collateralized Vaults:** If a `Vault` remains below the MCR for an extended period without being liquidated.
*   **Oracle Failures:** If the `OracleManager` reports outdated or invalid prices.
*   **Transaction Errors:** Persistent failures in sending transactions by the Keeper Bot.
*   **Network Congestion:** If the bot's transactions are constantly failing due to gas spikes or network congestion.
*   **Parameter Deviation:** Unexpected changes in the protocol's critical parameters.
*   **Suspicious Activity:** Large volumes of `SCC-USD` minting/burning or unusual governance activities.

## 4.3. On-Chain Monitoring

In addition to monitoring off-chain services, it is crucial to monitor the blockchain itself for events and states of the smart contracts. Tools like Tenderly, Forta, or Blocknative can be used to:

*   **Event Monitoring:** Listen to events emitted by the contracts (e.g., `VaultCreated`, `AuctionStarted`, `RewardPaid`) to track the protocol's activity.
*   **Function Monitoring:** Monitor calls to critical functions and their results.
*   **Security Alerts:** Detect unusual transaction patterns that may indicate an attack or exploitation.

## 4.4. Dashboards and Visualization

The metrics collected by Prometheus can be visualized in interactive dashboards using tools like Grafana. This allows the operations team and the community to monitor the protocol's health in real-time, identify trends, and make informed decisions.
