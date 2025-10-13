# Arquitetura do Keeper Bot Off-chain (Nível de Produção)

**Status:** Revisado e Atualizado

## 1. Introdução

Este documento descreve a arquitetura de nível de produção para o Keeper Bot. O design evolui de um script de loop simples para um sistema robusto, escalável e lucrativo, separando claramente as responsabilidades de descoberta, monitoramento, estratégia e execução. Toda a interação com a blockchain é feita utilizando a biblioteca `viem` para garantir performance e manutenibilidade.

## 2. Estrutura de Diretórios (Proposta)

A estrutura de serviços será mais granular para refletir a separação de responsabilidades.

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
│   └── logger.ts               # Módulo de logging
└── docs/
```

## 3. Componentes e Responsabilidades

Os componentes `config`, `rpc`, `contracts` e `logger` mantêm suas responsabilidades originais.

### 3.1. `services/vaultDiscovery.ts` - Descoberta de Vaults

-   **Responsabilidade:** Atuar como o **Produtor** de dados. Descobre todos os `Vaults` existentes e futuros e os adiciona a uma fila de processamento.
-   **Estratégia:**
    -   Na inicialização, busca todos os eventos `VaultCreated` para popular a lista inicial.
    -   Escuta continuamente por novos eventos `VaultCreated` para adicionar novos `Vaults` à fila.
    -   Escuta por eventos que alteram a saúde de um `Vault` (ex: `CollateralDeposited`) para adicionar o `Vault` correspondente a uma fila de alta prioridade.

### 3.2. `services/vaultMonitor.ts` - Monitoramento de Saúde

-   **Responsabilidade:** Atuar como o **Consumidor** da fila. Processa `Vaults` para verificar sua saúde.
-   **Estratégia:**
    -   Consome endereços de `Vault` da fila de trabalho.
    -   Calcula o Índice de Colateralização (CR) de cada `Vault`.
    -   Se um `Vault` estiver abaixo do MCR, ele não é liquidado imediatamente. Em vez disso, é passado para o próximo estágio como um "candidato à liquidação".

### 3.3. `services/liquidationStrategy.ts` - Estratégia de Liquidação

-   **Responsabilidade:** O **cérebro** do bot. Decide se uma liquidação é lucrativa e estratégica no momento atual.
-   **Estratégia:**
    -   Recebe um "candidato à liquidação" do `vaultMonitor`.
    -   Executa uma **análise de lucratividade**: `(Benefício da Liquidação) > (Custo de Gás Estimado)`.
    -   Estima as taxas de gás da rede (EIP-1559) para a análise de custo vs. benefício.
    -   Pode incluir lógicas adicionais (ex: não liquidar se a rede estiver extremamente congestionada, mesmo que seja lucrativo).
    -   **Gerencia uma fila interna de liquidação para processar os candidatos um a um (throttling), evitando o envio de transações concorrentes.**
    -   Se a decisão for positiva, envia uma ordem de liquidação para o `transactionManager`.

### 3.4. `services/transactionManager.ts` - Gerenciador de Transações

-   **Responsabilidade:** O **músculo** do bot. Garante que as transações sejam executadas de forma confiável.
-   **Estratégia:**
    -   Recebe ordens de execução do `liquidationStrategy`.
    -   Gerencia o **nonce** da conta do Keeper de forma explícita.
    -   Implementa uma **estratégia de gás dinâmica** (EIP-1559) para otimizar a inclusão da transação em bloco.
    -   **Monitora transações enviadas:** Se uma transação ficar "presa" (stuck) na mempool, ele a reenviará com um preço de gás maior, usando o mesmo nonce.
    -   Gerencia tentativas e tratamento de erros de baixo nível (ex: falha de RPC).

### 3.5. `index.ts` - Orquestrador Principal

-   **Responsabilidade:** Inicializar todos os módulos e orquestrar o fluxo de dados entre eles.
-   **Estratégia:**
    -   Configura todos os componentes.
    -   Gerencia a fila de trabalho entre o `vaultDiscovery` (produtor) e o `vaultMonitor` (consumidor).
    -   Garante que os candidatos à liquidação do `vaultMonitor` sejam passados para o `liquidationStrategy`.
    -   Garante que as ordens de liquidação do `liquidationStrategy` sejam enviadas ao `transactionManager`.

## 4. Fluxo de Execução (Nível de Produção)

1.  `index.ts` inicializa todos os módulos e a fila de trabalho.
2.  `vaultDiscovery` popula a fila com todos os `Vaults` e começa a escutar por novos eventos.
3.  `vaultMonitor` consome `Vaults` da fila, calcula sua saúde e envia os candidatos à liquidação para o `liquidationStrategy`.
4.  `liquidationStrategy` analisa cada candidato, verifica a lucratividade com base no gás atual e, se aprovado, envia uma ordem de liquidação para o `transactionManager`.
5.  `transactionManager` recebe a ordem, gerencia o nonce e o gás, envia a transação e a monitora até a confirmação, reenviando-a se necessário.
6.  `logger` registra todas as decisões, ações e erros em cada estágio do processo.

## 5. Evolução Pós-MVP: Escalando para Múltiplos Keepers

O design atual funciona como um modelo "single-worker". Para escalar o sistema e aumentar sua resiliência, podemos evoluir para uma arquitetura "multi-worker".

### 5.1. Desafios

-   **Trabalho Redundante:** Múltiplos keepers independentes iriam monitorar os mesmos vaults e tentar liquidar a mesma posição simultaneamente.
-   **Colisão de Nonce:** Se todos os keepers usassem a mesma chave privada, eles criariam uma corrida caótica para usar o mesmo nonce, onde apenas uma transação teria sucesso.

### 5.2. Solução Proposta: Fila Centralizada e Workers

Uma arquitetura mais robusta separaria os papéis de forma mais clara, usando uma fila de mensagens externa (ex: Redis) para coordenação.

```mermaid
graph TD
    subgraph Produtor
        A[Vault Discovery Service]
    end
    subgraph Fila
        B[Fila de Vaults (Redis)]
    end
    subgraph Consumidores
        C1[Keeper Worker 1]
        C2[Keeper Worker 2]
        C3[Keeper Worker N...]
    end
    subgraph ServicoSingleton
        D[Transaction Signer Service]
    end

    A -- "Adiciona Vaults" --> B
    C1 -- "Pega Vault" --> B
    C2 -- "Pega Vault" --> B
    C3 -- "Pega Vault" --> B
    C1 -- "Envia Ordem de Liquidação" --> D
    C2 -- "Envia Ordem de Liquidação" --> D
    C3 -- "Envia Ordem de Liquidação" --> D
    D -- "Envia Transação (Nonce Gerenciado)" --> E[Blockchain]
```

-   **Produtor (`Vault Discovery Service`):** Um único serviço continua responsável por encontrar vaults e adicioná-los à fila centralizada no Redis.
-   **Workers (`Keeper Worker`):** Múltiplas instâncias do keeper atuam como workers. Cada um pega um trabalho (um endereço de vault) da fila. O sistema de fila garante que um trabalho só seja entregue a um worker por vez, eliminando o trabalho redundante.
-   **Transaction Signer (Opcional, mas ideal):** Para resolver a colisão de nonce, os workers não teriam chaves privadas. Ao decidir liquidar, eles submeteriam uma "ordem de liquidação" a um único serviço centralizador, o `Transaction Signer`. Este seria o único componente com acesso à chave privada, responsável por gerenciar o nonce e enviar as transações em série para a blockchain.