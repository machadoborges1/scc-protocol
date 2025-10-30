# 4. Monitoramento e Alertas do Protocolo SCC

O monitoramento e o sistema de alertas são componentes cruciais para garantir a saúde, a segurança e a operação contínua do Protocolo SCC. Eles permitem a detecção precoce de anomalias, problemas de desempenho ou potenciais ataques, minimizando o tempo de inatividade e protegendo os fundos dos usuários.

## 4.1. Monitoramento de Métricas (Prometheus)

O protocolo utiliza Prometheus para a coleta e armazenamento de métricas de desempenho dos serviços off-chain. Isso permite uma visão detalhada do comportamento do sistema ao longo do tempo.

### 4.1.1. Configuração do Prometheus (`monitoring/prometheus.yml`)

O arquivo `monitoring/prometheus.yml` configura o Prometheus para coletar métricas do `keeper-bot`:

```yaml
global:
  scrape_interval: 15s # Por padrão, coleta métricas a cada 15 segundos.

scrape_configs:
  - job_name: 'keeper-bot'
    static_configs:
      - targets: ['keeper:9091'] # 'keeper' é o nome do serviço no docker-compose, 9091 é a porta exposta.
```

*   **`scrape_interval`:** Define a frequência com que o Prometheus coleta métricas dos alvos configurados.
*   **`job_name: 'keeper-bot'`:** Identifica o trabalho de coleta de métricas para o Keeper Bot.
*   **`targets: ['keeper:9091']`:** Especifica o endereço e a porta onde o Keeper Bot expõe suas métricas no formato Prometheus. O nome `keeper` refere-se ao nome do serviço no `docker-compose.yml`.

### 4.1.2. Métricas Expostas pelo Keeper Bot

O Keeper Bot (`offchain/`) é configurado para expor métricas relevantes para o Prometheus, que podem incluir:

*   **Latência de Processamento:** Tempo que o bot leva para processar um `Vault` ou uma transação.
*   **Número de Liquidações:** Contagem de liquidações iniciadas com sucesso.
*   **Erros de Transação:** Contagem de falhas ao enviar transações para a blockchain.
*   **Estado da Fila:** Tamanho da fila de `Vaults` a serem processados.
*   **Uso de Gás:** Métricas relacionadas ao consumo de gás das transações enviadas.

Essas métricas são essenciais para entender o desempenho do bot, identificar gargalos e otimizar sua operação.

## 4.2. Sistema de Alertas (`alerter.ts`)

O módulo `alerter.ts` no serviço off-chain (`offchain/src/alerter.ts`) é responsável por gerar e enviar alertas em caso de eventos críticos ou anomalias detectadas.

### 4.2.1. Função `sendAlert`

```typescript
import logger from './logger';

type AlertLevel = 'warn' | 'error' | 'fatal';

export function sendAlert(level: AlertLevel, title: string, details: object) {
  logger[level]({ alert: true, title, ...details }, `ALERT: ${title}`);
}
```

*   **`AlertLevel`:** Define a severidade do alerta (`warn`, `error`, `fatal`).
*   **`title`:** Um título curto e descritivo para o alerta.
*   **`details`:** Um objeto com detalhes adicionais para depuração, como IDs de transação, endereços de contrato, mensagens de erro, etc.
*   **Integração:** Atualmente, a função `sendAlert` registra o alerta no log de forma estruturada. Em um ambiente de produção, esta função seria estendida para fazer chamadas HTTP para serviços de alerta externos, como:
    *   **PagerDuty/OpsGenie:** Para alertas críticos que exigem atenção imediata da equipe de operações.
    *   **Slack/Telegram:** Para notificações em canais de comunicação da equipe.
    *   **Email/SMS:** Para alertas de menor prioridade ou como fallback.

### 4.2.2. Cenários de Alerta

O sistema de alertas deve ser configurado para disparar em cenários como:

*   **Vaults Sub-colateralizados:** Se um `Vault` permanecer abaixo do MCR por um período prolongado sem ser liquidado.
*   **Falhas de Oráculo:** Se o `OracleManager` reportar preços desatualizados ou inválidos.
*   **Erros de Transação:** Falhas persistentes no envio de transações pelo Keeper Bot.
*   **Congestionamento da Rede:** Se as transações do bot estiverem constantemente falhando devido a picos de gás ou congestionamento da rede.
*   **Desvio de Parâmetros:** Alterações inesperadas nos parâmetros críticos do protocolo.
*   **Atividade Suspeita:** Grandes volumes de mint/burn de `SCC-USD` ou atividades incomuns de governança.

## 4.3. Monitoramento On-Chain

Além do monitoramento de serviços off-chain, é crucial monitorar a própria blockchain para eventos e estados dos contratos inteligentes. Ferramentas como Tenderly, Forta ou Blocknative podem ser utilizadas para:

*   **Monitoramento de Eventos:** Escutar eventos emitidos pelos contratos (ex: `VaultCreated`, `AuctionStarted`, `RewardPaid`) para rastrear a atividade do protocolo.
*   **Monitoramento de Funções:** Monitorar chamadas de funções críticas e seus resultados.
*   **Alertas de Segurança:** Detectar padrões de transação incomuns que possam indicar um ataque ou exploração.

## 4.4. Dashboards e Visualização

As métricas coletadas pelo Prometheus podem ser visualizadas em dashboards interativos usando ferramentas como Grafana. Isso permite que a equipe de operações e a comunidade monitorem a saúde do protocolo em tempo real, identifiquem tendências e tomem decisões informadas.
