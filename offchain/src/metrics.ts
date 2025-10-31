import { Registry, Counter, Gauge } from 'prom-client';

// Creates a separate metrics registry for our application.
// This avoids mixing with standard metrics that prom-client might expose.
export const register = new Registry();

// --- Discovery Metrics ---
export const vaultsDiscovered = new Counter({
  name: 'keeper_vaults_discovered_total',
  help: 'Total number of vaults discovered since the keeper started',
});
register.registerMetric(vaultsDiscovered);

// --- Monitoring Metrics ---
export const unhealthyVaultsDetected = new Counter({
  name: 'keeper_unhealthy_vaults_detected_total',
  help: 'Total number of unhealthy vaults detected',
});
register.registerMetric(unhealthyVaultsDetected);

// --- Liquidation Strategy Metrics ---
export const liquidationsAnalyzed = new Counter({
  name: 'keeper_liquidations_analyzed_total',
  help: 'Total number of liquidations analyzed for profitability',
  labelNames: ['is_profitable'], // Adds a label to distinguish profitable from non-profitable
});
register.registerMetric(liquidationsAnalyzed);

// --- Transaction Manager Metrics ---
export const transactionsSent = new Counter({
  name: 'keeper_transactions_sent_total',
  help: 'Total number of transactions sent',
});
register.registerMetric(transactionsSent);

export const transactionsConfirmed = new Counter({
  name: 'keeper_transactions_confirmed_total',
  help: 'Total number of transactions successfully confirmed',
});
register.registerMetric(transactionsConfirmed);

export const transactionsFailed = new Counter({
  name: 'keeper_transactions_failed_total',
  help: 'Total number of transactions that failed on-chain',
});
register.registerMetric(transactionsFailed);

export const transactionsReplaced = new Counter({
  name: 'keeper_transactions_replaced_total',
  help: 'Total number of transactions that were replaced due to being stuck',
});
register.registerMetric(transactionsReplaced);

// --- General Metrics ---
export const keeperEthBalance = new Gauge({
  name: 'keeper_eth_balance',
  help: 'Current ETH balance of the keeper wallet',
});
register.registerMetric(keeperEthBalance);
