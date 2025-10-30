# 3. Serviços Off-Chain do Protocolo SCC

Os serviços off-chain são componentes cruciais que operam fora da blockchain, mas interagem diretamente com ela para garantir a funcionalidade, monitoramento e usabilidade do Protocolo SCC. Eles são desenvolvidos em TypeScript/Node.js e utilizam a biblioteca `viem` para interações eficientes com a blockchain.

## 3.1. Keeper Bot (Liquidações)

O Keeper Bot é um sistema robusto e escalável responsável por monitorar a saúde dos `Vaults` e iniciar liquidações quando necessário. Sua arquitetura é projetada para separar responsabilidades e garantir a execução confiável de transações.

### 3.1.1. Estrutura de Diretórios (`offchain/src/`)

A estrutura do Keeper Bot reflete a separação de responsabilidades:

```
offchain/
├── src/
│   ├── index.ts                # Orquestrador principal do bot
│   ├── config/                 # Módulo de configuração
│   ├── rpc/                    # Módulo de cliente RPC
│   ├── contracts/              # Módulo de serviços de contrato
│   ├── services/               # Módulos de lógica de negócio
│   │   ├── vaultDiscovery.ts     # Lógica para descobrir todos os Vaults (Produtor)
│   │   ├── vaultMonitor.ts       # Lógica para monitorar a saúde de Vaults (Consumidor)
│   │   ├── liquidationStrategy.ts # Lógica para decidir SE e QUANDO liquidar (Cérebro)
│   │   └── transactionManager.ts   # Lógica para executar transações de forma robusta (Músculo)
│   ├── alerter.ts              # Módulo para envio de alertas
│   ├── logger.ts               # Módulo de logging
│   ├── metrics.ts              # Módulo para coleta de métricas
│   └── queue.ts                # Módulo para gerenciamento de filas internas
└── docs/
```

### 3.1.2. Componentes e Responsabilidades

*   **`index.ts` (Orquestrador Principal):** Inicializa todos os módulos e orquestra o fluxo de dados entre eles, gerenciando as filas de trabalho.
*   **`config/`:** Módulo para gerenciar as configurações do bot.
*   **`rpc/`:** Módulo para gerenciar a conexão e chamadas RPC à blockchain.
*   **`contracts/`:** Módulo para interagir com os contratos inteligentes do protocolo.
*   **`logger.ts`:** Módulo centralizado para logging de eventos e erros.
*   **`metrics.ts`:** Módulo para coleta e exposição de métricas de desempenho do bot (ex: para Prometheus).
*   **`alerter.ts`:** Módulo para enviar alertas em caso de eventos críticos ou erros.
*   **`queue.ts`:** Módulo para gerenciar filas internas, como a fila de `Vaults` a serem monitorados.

#### Módulos de Serviço (`services/`)

*   **`vaultDiscovery.ts` (Produtor):** Responsável por descobrir todos os `Vaults` existentes e futuros. Na inicialização, busca eventos `VaultCreated` e, continuamente, escuta por novos eventos para adicionar `Vaults` a uma fila de processamento.
*   **`vaultMonitor.ts` (Consumidor):** Processa `Vaults` da fila de trabalho, calcula seu Índice de Colateralização (CR) e identifica candidatos à liquidação, passando-os para o próximo estágio.
*   **`liquidationStrategy.ts` (Cérebro):** Recebe candidatos à liquidação e decide se uma liquidação é lucrativa e estratégica no momento. Realiza análises de lucratividade (benefício vs. custo de gás) e gerencia uma fila interna para evitar transações concorrentes.
*   **`transactionManager.ts` (Músculo):** Garante a execução confiável das transações. Gerencia o `nonce` da conta do Keeper, implementa uma estratégia de gás dinâmica (EIP-1559) e monitora transações, reenviando-as com gás maior se ficarem presas na mempool.

### 3.1.3. Fluxo de Execução

1.  `index.ts` inicializa todos os módulos e a fila de trabalho.
2.  `vaultDiscovery` popula a fila com `Vaults` e escuta por novos eventos.
3.  `vaultMonitor` consome `Vaults` da fila, verifica sua saúde e envia candidatos à liquidação para `liquidationStrategy`.
4.  `liquidationStrategy` analisa cada candidato, verifica a lucratividade e, se aprovado, envia uma ordem de liquidação para `transactionManager`.
5.  `transactionManager` gerencia o `nonce` e o gás, envia a transação e a monitora até a confirmação.
6.  `logger` e `metrics` registram todas as ações e o `alerter` notifica sobre eventos críticos.

### 3.1.4. Escalabilidade (Pós-MVP)

Para escalar, o sistema pode evoluir para uma arquitetura multi-worker com uma fila centralizada (ex: Redis) e um `Transaction Signer` centralizado para gerenciar o `nonce` e as chaves privadas, permitindo que múltiplos keepers operem sem colisão.

## 3.2. Serviço de Indexação (The Graph)

*   **Propósito:** Fornecer uma maneira rápida e eficiente de consultar dados históricos e em tempo real do protocolo.
*   **Funcionamento:** O Subgraph escuta eventos emitidos pelos contratos inteligentes do protocolo (ex: `VaultCreated`, `CollateralDeposited`, `Liquidated`) e os armazena em um banco de dados. Esses dados são então expostos através de uma API GraphQL, que pode ser consultada por aplicações como o frontend.
*   **Tecnologia:** The Graph Protocol, GraphQL, AssemblyScript (para mappings).
*   **Localização:** Os arquivos do Subgraph estão localizados no diretório `/subgraph/`.

## 3.3. Frontend (DApp)

*   **Propósito:** Interface de usuário para interagir com o protocolo SCC.
*   **Funcionamento:** O frontend permite que os usuários criem `Vaults`, depositem colateral, mintem `SCC-USD`, participem de leilões, façam staking de `SCC-GOV` e votem em propostas de governança.
*   **Interações:**
    *   **Leitura de Dados:** Consulta o Serviço de Indexação (The Graph) via GraphQL para exibir o estado atual do protocolo e o histórico de transações.
    *   **Envio de Transações:** Permite que o usuário envie transações (mint, stake, etc.) diretamente para a blockchain via um nó RPC, utilizando sua carteira (ex: MetaMask).
*   **Tecnologia:** React/Next.js, Viem.
*   **Localização:** Os arquivos do Frontend estão localizados no diretório `/frontend/`.
