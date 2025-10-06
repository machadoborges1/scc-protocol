import logger from './logger';

type AlertLevel = 'warn' | 'error' | 'fatal';

/**
 * Envia um alerta para o sistema de monitoramento.
 * 
 * Em um ambiente de produção, esta função seria estendida para fazer chamadas HTTP
 * para serviços como PagerDuty, OpsGenie, ou enviar uma mensagem para um canal do Slack/Telegram.
 * 
 * Por enquanto, ela apenas registra o alerta no log de forma estruturada.
 * 
 * @param level A severidade do alerta.
 * @param title Um título curto e descritivo para o alerta.
 * @param details Um objeto com detalhes adicionais para depuração.
 */
export function sendAlert(level: AlertLevel, title: string, details: object) {
  logger[level]({ alert: true, title, ...details }, `ALERT: ${title}`);
}
