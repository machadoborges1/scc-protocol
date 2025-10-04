# Arquitetura do Keeper Bot Off-chain

**Status:** Documentado (Atualizado)

## 1. Introdução

Este documento descreve a arquitetura do Keeper Bot, utilizando `ethers.js` para interação com o blockchain. O bot monitorará a saúde dos `Vaults` e iniciará leilões de liquidação para aqueles que se tornarem sub-colateralizados.

## 2. Estrutura de Diretórios

```
offchain/
├── src/
│   ├── index.ts             # Orquestrador principal do bot
│   ├── config/              # Módulo de configuração
│   │   └── index.ts         # Carrega e valida variáveis de ambiente
│   ├── rpc/                 # Módulo de cliente RPC (Provider/Signer)
│   │   └── index.ts         # Configura e exporta o Provider/Signer
│   ├── contracts/           # Módulo de serviços de contrato
│   │   ├── index.ts         # Carrega ABIs e cria instâncias de contrato (ethers.Contract)
│   │   └── abis.ts          # Define tipos para ABIs importadas
│   ├── services/            # Módulos de lógica de negócio
│   │   ├── vaultDiscovery.ts  # Lógica para descobrir todos os Vaults
│   │   ├── vaultMonitor.ts    # Lógica para monitorar a saúde de Vaults específicos
│   │   └── liquidationAgent.ts # Lógica para identificar e executar liquidações
│   └── logger.ts            # Módulo de logging
└── docs/                    # Documentação
```

## 3. Componentes e Responsabilidades

### 3.1. `config/index.ts` - Configuração

*   **Responsabilidade:** Carregar e validar variáveis de ambiente (`RPC_URL`, `KEEPER_PRIVATE_KEY`, endereços de contrato) usando `zod`.
*   **Detalhes:** Usa `dotenv`.

### 3.2. `rpc/index.ts` - Cliente RPC

*   **Responsabilidade:** Configurar e exportar `ethers.js Provider` (leitura) e `ethers.js Wallet/Signer` (escrita).
*   **Detalhes:** Recebe `RPC_URL` e `KEEPER_PRIVATE_KEY`.

### 3.3. `contracts/index.ts` - Serviços de Contrato

*   **Responsabilidade:** Carregar ABIs e criar instâncias de `ethers.Contract` usando `Provider` e `Signer`.
*   **Detalhes:** Recebe endereços de contrato e clientes RPC.

### 3.4. `logger.ts` - Logging

*   **Responsabilidade:** Fornecer uma instância de logger configurada (`pino`).
*   **Detalhes:** Já implementado.

### 3.5. `services/vaultDiscovery.ts` - Descoberta de Vaults

*   **Responsabilidade:** Descobrir todos os Vaults existentes e futuros.
*   **Detalhes:**
    *   Usa o `vaultFactoryContract`.
    *   Busca eventos `VaultCreated` passados para encontrar vaults históricos.
    *   Escuta por novos eventos `VaultCreated` para descobrir vaults em tempo real.
    *   Mantém uma lista atualizada de todos os endereços de Vaults conhecidos.

### 3.6. `services/vaultMonitor.ts` - Monitoramento de Saúde

*   **Responsabilidade:** Calcular o Índice de Colateralização (CR) para uma lista de Vaults fornecida.
*   **Detalhes:**
    *   Recebe uma lista de endereços de Vault.
    *   Para cada Vault, busca seu `collateralAmount`, `debtAmount` e o preço do colateral via `oracleManagerContract`.
    *   Retorna uma lista de objetos de Vault com seu CR calculado.

### 3.7. `services/liquidationAgent.ts` - Agente de Liquidação

*   **Responsabilidade:** Executar transações de liquidação para Vaults identificados como não saudáveis.
*   **Detalhes:**
    *   Recebe a lista de Vaults monitorados do `vaultMonitor`.
    *   Filtra os Vaults com CR abaixo do mínimo.
    *   Chama `startAuction` no `liquidationManagerContract` usando o `Signer`.
    *   Simula transações (`staticCall`) antes de enviar para segurança.
    *   Gerencia `nonce` e gás.

### 3.8. `index.ts` - Orquestrador Principal

*   **Responsabilidade:** Inicializar todos os módulos, orquestrar o loop principal e gerenciar o ciclo de vida do bot.
*   **Detalhes:**
    *   Configura `config`, `logger`, `rpc`, `contracts`.
    *   Instancia os serviços: `vaultDiscovery`, `vaultMonitor`, e `liquidationAgent`.
    *   Inicia a descoberta de vaults.
    *   Em um loop periódico, usa o `vaultDiscovery` para obter a lista de vaults, passa para o `vaultMonitor` para análise, e entrega o resultado para o `liquidationAgent` para ação.

## 4. Fluxo de Execução (Loop Principal)

1.  `index.ts` inicializa todos os módulos e serviços.
2.  `vaultDiscovery.start()` descobre Vaults existentes e inicia a escuta por novos.
3.  Em um loop periódico (`setInterval`):
    a. O orquestrador chama `vaultDiscovery.getVaults()` para obter a lista completa de endereços.
    b. A lista é passada para `vaultMonitor.monitorVaults()`, que retorna a lista enriquecida com o CR de cada um.
    c. A lista enriquecida é passada para `liquidationAgent.liquidateUnhealthyVaults()`.
4.  `liquidationAgent` filtra os vaults não saudáveis, simula e envia as transações de `startAuction`.
5.  `logger` registra todas as ações e erros.