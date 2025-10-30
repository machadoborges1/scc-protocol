# Serviços Off-chain do Protocolo SCC

Este diretório contém todos os serviços e bots que operam fora da blockchain (off-chain) para dar suporte ao protocolo SCC. O principal componente é o **Keeper Bot**, responsável por monitorar a saúde dos Vaults e iniciar leilões de liquidação.

## Visão Geral

Os serviços off-chain são cruciais para a automação e monitoramento do protocolo. O Keeper Bot, desenvolvido em TypeScript/Node.js, interage com a blockchain para:

*   **Monitorar Vaults:** Acompanha o rácio de colateralização dos Vaults.
*   **Iniciar Liquidações:** Chama a função `startAuction` no `LiquidationManager` quando um Vault se torna sub-colateralizado.
*   **Gerenciar Transações:** Lida com nonces, preços de gás e reenvio de transações.
*   **Expor Métricas:** Fornece dados para monitoramento via Prometheus.
*   **Alertas:** (Em desenvolvimento) Envia notificações sobre eventos críticos.

## Arquitetura

O Keeper Bot é estruturado em módulos como `VaultDiscoveryService`, `VaultMonitorService`, `LiquidationStrategy`, `TransactionManager`, `Alerter` e `Metrics`, garantindo uma separação clara de responsabilidades e robustez.

## Desenvolvimento Local

A forma mais fácil de rodar o Keeper Bot é através do ambiente Docker Compose na raiz do monorepo:

```bash
# Na raiz do projeto
docker compose up -d
```

Para rodar testes:

```bash
pnpm --filter=@scc/offchain test
```

## Aprofunde-se na Documentação

Para uma análise detalhada da arquitetura do Keeper Bot, seus componentes, fluxo de execução e estratégias de escalabilidade, consulte a [documentação completa do projeto](../docs/README.md).