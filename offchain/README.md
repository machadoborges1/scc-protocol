# Serviços Off-chain do Protocolo SCC

Este pacote contém todos os serviços e bots que operam fora da blockchain (off-chain) para dar suporte ao protocolo SCC. O principal componente atualmente é o **Keeper Bot**, responsável por monitorar a saúde dos Vaults e iniciar leilões de liquidação.

## Arquitetura

O Keeper Bot é estruturado em torno de um conjunto de serviços modulares que trabalham em conjunto:

-   **`VaultDiscoveryService`**: Descobre todos os Vaults existentes no protocolo e escuta por novos Vaults que sejam criados.
-   **`VaultMonitorService`**: Recebe os Vaults do `VaultDiscoveryService` e monitora continuamente o rácio de colateralização de cada um.
-   **`LiquidationStrategy`**: Define a lógica para quando um Vault deve ser liquidado. Atualmente, a estratégia é liquidar qualquer Vault que esteja abaixo do rácio mínimo de colateralização.
-   **`TransactionManager`**: Gerencia o envio de transações para a blockchain, incluindo o tratamento de nonces, preços de gás e a submissão da transação de `startAuction` no contrato `LiquidationManager`.
-   **`Alerter`**: (Placeholder) Um serviço para enviar alertas (ex: para o Telegram, Discord) quando liquidações ocorrem ou quando o bot encontra erros.
-   **`Metrics`**: Expõe métricas no formato Prometheus para monitoramento da saúde e performance do bot.

## Configuração

As variáveis de ambiente necessárias para rodar os serviços estão definidas em `.env.example`. Para desenvolvimento, você pode criar um arquivo `.env` baseado no exemplo.

Principais variáveis:

-   `RPC_URL`: Endpoint RPC da blockchain a ser monitorada.
-   `KEEPER_PRIVATE_KEY`: Chave privada da conta que irá executar as transações de liquidação.
-   `LIQUIDATION_MANAGER_ADDRESS`: Endereço do contrato `LiquidationManager`.
-   `VAULT_FACTORY_ADDRESS`: Endereço do contrato `VaultFactory`.

**Nota:** Ao rodar através do Docker Compose principal, a variável `RPC_URL` é sobrescrita para apontar para o serviço `anvil` interno.

## Como Executar

### Ambiente Integrado (Recomendado)

A forma mais fácil de rodar o keeper é através do ambiente Docker Compose na raiz do monorepo.

```bash
# Na raiz do projeto
docker compose up -d
```

Este comando irá iniciar o keeper junto com todos os outros serviços do protocolo (blockchain, subgraph, etc.).

### Rodando Isoladamente (Para Desenvolvimento)

Para depurar ou desenvolver o keeper de forma isolada, você pode rodá-lo diretamente:

1.  Certifique-se de que há uma blockchain rodando e que o seu arquivo `.env` está configurado com a `RPC_URL` e a chave privada corretas.
2.  Instale as dependências e rode o script `dev`:

```bash
# Na raiz do projeto
pnpm --filter=@scc/offchain install
pnpm --filter=@scc/offchain dev
```

## Testes

Para rodar os testes unitários e de integração do keeper:

```bash
# Na raiz do projeto
pnpm --filter=@scc/offchain test
```
