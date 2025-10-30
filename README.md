# Protocolo de Stablecoin SCC

Este é o monorepo para o desenvolvimento do **SCC (Stablecoin Cripto-Colateralizada)**, uma stablecoin descentralizada atrelada ao dólar e super-colateralizada por criptoativos.

## Visão Geral

O Protocolo SCC permite que usuários depositem criptoativos como colateral em `Vaults` para emitir a stablecoin `SCC-USD`. O sistema inclui mecanismos de liquidação via Leilões Holandeses, um token de governança (`SCC-GOV`) para participação da comunidade e serviços off-chain (Keeper Bot, Subgraph) para automação e indexação de dados.

## Estrutura do Monorepo

O projeto é organizado com `pnpm workspaces` e inclui os seguintes componentes principais:

*   `/contracts`: Smart contracts em Solidity (Foundry).
*   `/offchain`: Serviços off-chain (bots, keepers) em TypeScript/Node.js.
*   `/frontend`: Interface de usuário (DApp) para interagir com o protocolo.
*   `/subgraph`: Serviço de indexação de dados da blockchain (The Graph).
*   `/docs`: Documentação completa do projeto.

## Ambiente de Desenvolvimento Local

Utilizamos Docker Compose para orquestrar um ambiente de desenvolvimento completo e integrado, incluindo uma blockchain local (Anvil), o indexador (The Graph) e todos os serviços de suporte.

Para iniciar o ambiente:

```bash
docker compose up -d
```

Para verificar e testar o ambiente (deploy de contratos, subgraph e execução de testes de integração):

```bash
pnpm test:integration
```

Para parar o ambiente:

```bash
docker compose down
```

## Aprofunde-se na Documentação

Para uma compreensão detalhada da arquitetura, mecanismos, tokenomics, fluxo de testes e muito mais, consulte a [documentação completa do projeto](./docs/README.md).