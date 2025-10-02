# Arquitetura do Keeper Bot Off-chain

**Status:** Em Desenvolvimento

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
│   │   ├── vaultMonitor.ts  # Lógica para descobrir e monitorar Vaults
│   │   └── liquidationAgent.ts # Lógica para identificar e executar liquidações
│   ├── utils/               # Funções utilitárias
│   │   └── index.ts
│   └── logger.ts            # Módulo de logging (já existente)
└── docs/                    # Documentação (já existente)
```

## 3. Componentes e Responsabilidades

### 3.1. `config/index.ts` - Configuração

*   **Responsabilidade:** Carregar e validar variáveis de ambiente (`RPC_URL`, `KEEPER_PRIVATE_KEY`, endereços de contrato).
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

### 3.5. `services/vaultMonitor.ts` - Monitoramento de Vaults

*   **Responsabilidade:** Descobrir, monitorar e identificar Vaults não saudáveis.
*   **Detalhes:**
    *   Usa `vaultFactoryContract` e `oracleManagerContract`.
    *   Busca eventos `VaultCreated` (passados e novos).
    *   Calcula o Índice de Colateralização (CR).
    *   Expõe métodos para Vaults saudáveis/não saudáveis.

### 3.6. `services/liquidationAgent.ts` - Agente de Liquidação

*   **Responsabilidade:** Executar transações de liquidação para Vaults não saudáveis.
*   **Detalhes:**
    *   Usa `liquidationManagerContract` e `Signer`.
    *   Simula transações antes de enviar.
    *   Gerencia `nonce` e gás.

### 3.7. `index.ts` - Orquestrador Principal

*   **Responsabilidade:** Inicializar módulos, orquestrar o loop principal e gerenciar o ciclo de vida do bot.
*   **Detalhes:** Configura `config`, `rpc`, `contracts`, `logger`, `vaultMonitor` e `liquidationAgent`.

## 4. Fluxo de Execução (Loop Principal)

1.  `index.ts` inicializa `config`, `logger`, `rpc`, `contracts`.
2.  `vaultMonitor.init()` descobre Vaults existentes e inicia a escuta por novos.
3.  Em um loop periódico, `vaultMonitor.getUnhealthyVaults()` é chamado.
4.  Para cada Vault não saudável, `liquidationAgent.liquidateVault()` é chamado.
5.  `liquidationAgent` simula, envia a transação e loga o resultado.
6.  `logger` registra todas as ações e erros.

