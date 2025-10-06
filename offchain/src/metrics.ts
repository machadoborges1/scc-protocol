import { Registry, Counter, Gauge } from 'prom-client';

// Cria um registro de métricas separado para o nosso aplicativo.
// Isso evita a mistura com métricas padrão que o prom-client pode expor.
export const register = new Registry();

// --- Métricas de Descoberta ---
export const vaultsDiscovered = new Counter({
  name: 'keeper_vaults_discovered_total',
  help: 'Total number of vaults discovered since the keeper started',
});
register.registerMetric(vaultsDiscovered);

// --- Métricas de Monitoramento ---
export const unhealthyVaultsDetected = new Counter({
  name: 'keeper_unhealthy_vaults_detected_total',
  help: 'Total number of unhealthy vaults detected',
});
register.registerMetric(unhealthyVaultsDetected);

// --- Métricas de Estratégia de Liquidação ---
export const liquidationsAnalyzed = new Counter({
  name: 'keeper_liquidations_analyzed_total',
  help: 'Total number of liquidations analyzed for profitability',
  labelNames: ['is_profitable'], // Adiciona um label para distinguir lucrativas de não lucrativas
});
register.registerMetric(liquidationsAnalyzed);

// --- Métricas do Gerenciador de Transações ---
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

// --- Métricas Gerais ---
export const keeperEthBalance = new Gauge({
  name: 'keeper_eth_balance',
  help: 'Current ETH balance of the keeper wallet',
});
register.registerMetric(keeperEthBalance);
