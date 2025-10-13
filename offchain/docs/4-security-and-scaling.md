# 4. Segurança e Escalabilidade (Pós-MVP)

**Status:** Proposto

Este documento descreve futuras melhorias de arquitetura para aumentar a segurança, eficiência e escalabilidade do Keeper Bot, focando em tópicos de nível de produção.

## 1. MEV Awareness: Proteção Contra Front-Running

### 1.1. O Risco Atual

O `TransactionManager` atual envia as transações de `startAuction` para a mempool pública. Isso expõe o bot a estratégias de MEV (Maximal Extractable Value), principalmente **front-running**. Um bot "searcher" pode detectar nossa transação, copiá-la com uma taxa de gás maior e iniciar o leilão antes de nós, capturando qualquer oportunidade de lucro associada.

### 1.2. Solução Proposta: Transações Privadas

Para mitigar este risco, o `TransactionManager` deve ser modificado para suportar o envio de transações através de um **relay privado**, como o [Flashbots](https://docs.flashbots.net/).

-   **Fluxo de Implementação:**
    1.  Integrar um cliente de relay privado (ex: `flashbots-ethers-provider-bundle` ou uma implementação customizada com `viem`).
    2.  Modificar a função `startAuction` no `TransactionManager` para, em vez de `walletClient.writeContract`, construir e enviar um "bundle" de transações para o endpoint do Flashbots.
    3.  O bundle conteria a nossa transação de liquidação e uma transação de gorjeta para o minerador.
    4.  Isso garante que nossa transação não seja visível na mempool pública, tornando o front-running impossível.

## 2. Key Management: Gerenciamento Seguro de Chaves

### 2.1. O Risco Atual

Atualmente, a chave privada do keeper é lida de um arquivo `.env`. Em um ambiente de produção, se o servidor for comprometido, a chave é instantaneamente roubada, dando ao atacante controle total sobre os fundos e as funções do keeper.

### 2.2. Solução Proposta: Cofre de Segredos (Secrets Vault)

A prática correta é que a chave privada **nunca** esteja em texto plano no mesmo ambiente que a aplicação.

-   **Arquitetura Recomendada:**
    1.  **Armazenamento:** A chave privada deve ser armazenada em um serviço de cofre centralizado e seguro, como **AWS KMS**, **Azure Key Vault** ou **HashiCorp Vault**.
    2.  **Lógica de Assinatura:** O `TransactionManager` deve ser refatorado. Em vez de usar `privateKeyToAccount` para carregar a chave em memória, ele usaria o SDK do serviço de cofre para **solicitar uma assinatura de transação**.
    3.  O `TransactionManager` construiria a transação não assinada, a enviaria para o serviço de cofre, e o serviço a devolveria assinada, sem nunca expor a chave privada à aplicação.

-   **Vantagens:**
    -   **Segurança Máxima:** A chave privada nunca sai do ambiente seguro do cofre.
    -   **Auditoria:** Todas as tentativas de acesso e uso da chave são registradas e auditáveis no serviço de cofre.

## 3. Alternativas Descentralizadas para Key Management (Pós-MVP Avançado)

Embora um cofre centralizado seja o padrão da indústria para proteger operadores de bots, o ecossistema Web3 oferece soluções descentralizadas para o gerenciamento de chaves, adequadas para os mais altos níveis de segurança.

### 3.1. MPC (Multi-Party Computation)

-   **O que é?** MPC é uma técnica criptográfica onde uma única chave privada é dividida em múltiplos "pedaços" (shards), e cada pedaço é armazenado por um computador diferente. Para assinar uma transação, um quórum pré-definido desses computadores precisa cooperar em um protocolo de comunicação **off-chain**. O ponto crucial é que a chave privada completa **nunca** é reconstruída em um único lugar.
-   **Quem Usa?** Custodiantes institucionais (Fireblocks, Copper), provedores de carteira (ZenGo, Coinbase WaaS) e pontes (bridges) cross-chain.
-   **Aplicação no Projeto:** Poderíamos substituir a única chave do keeper por um "anel" de múltiplos servidores rodando um nó MPC. Uma liquidação só seria assinada se, por exemplo, 3 de 5 servidores concordassem, eliminando o risco de um único servidor ser comprometido.

### 3.2. DVT (Distributed Validator Technology)

-   **O que é?** DVT é uma tecnologia focada em resolver um problema similar para validadores de Proof-of-Stake. Ela distribui as responsabilidades e a chave de um único validador entre um cluster de nós que devem chegar a um consenso antes de assinar uma mensagem. É uma solução híbrida, com contratos **on-chain** para gerenciar os clusters e comunicação **off-chain** entre os nós.
-   **Quem Usa?** Protocolos de Liquid Staking (Lido) e projetos de infraestrutura focados em DVT (SSV Network, Obol Network).
-   **Aplicação no Projeto:** Embora seja mais focada em validadores, os princípios do DVT poderiam ser adaptados para criar um comitê descentralizado de keepers, onde as ações são coordenadas e validadas on-chain antes da execução. É uma abordagem mais complexa, mas totalmente alinhada com a filosofia de descentralização.
