# Plano de Desenvolvimento - Off-chain Keeper Bot (Revisado)

Este documento rastreia o progresso do desenvolvimento dos serviços off-chain do protocolo SCC, começando pelo bot de liquidação (Keeper).

## Milestone 1: Configuração do Projeto TypeScript e Ferramentas de Qualidade

**Status:** Concluído

-   [x] **Tarefa 1.1:** Adicionar dependências de desenvolvimento (`typescript`, `ts-node`, `nodemon`, `@types/node`, `jest` ou `mocha` para testes).
-   [x] **Tarefa 1.2:** Adicionar dependências de produção (`viem`, `dotenv`, `pino` ou `winston` para logging avançado).
-   [x] **Tarefa 1.3:** Criar e configurar o arquivo `tsconfig.json`.
-   [x] **Tarefa 1.4:** Adicionar scripts (`start`, `build`, `dev`, `test`, `lint`) ao `package.json`.
-   [x] **Tarefa 1.5:** Configurar linter (ESLint) e formatter (Prettier) para garantir a qualidade e consistência do código.

## Milestone 2: Conexão com a Blockchain, Estrutura Principal e Robustez (usando ethers.js)

**Status:** Concluído

-   [x] **Tarefa 2.1:** Criar o diretório `src` e o arquivo principal `index.ts`.
-   [x] **Tarefa 2.2:** Implementar a lógica de conexão com um nó Ethereum usando `ethers.js`. A URL do RPC será lida de variáveis de ambiente (`.env`).
-   [x] **Tarefa 2.3:** Implementar um loop principal (`setInterval` ou `setTimeout` recursivo) que executará a lógica de monitoramento periodicamente (ex: a cada 15 segundos).
-   [x] **Tarefa 2.4:** Adicionar um sistema de logging estruturado (ex: `pino`) para exibir o status do bot, eventos e erros.
-   [x] **Tarefa 2.5:** Implementar tratamento de erros robusto para chamadas RPC, incluindo mecanismos de retry com backoff exponencial para falhas temporárias.
-   [x] **Tarefa 2.6:** Implementar gerenciamento de gás (monitoramento de `gasPrice`/`maxFeePerGas`) para otimizar custos e garantir a inclusão de transações.
-   [x] **Tarefa 2.7:** Adicionar lógica para um desligamento gracioso do bot (`SIGINT`/`SIGTERM`), garantindo que transações pendentes sejam finalizadas ou o estado seja salvo.
-   [x] **Tarefa 2.8:** **Documentação de Código:** Garantir que todo o código seja bem documentado com comentários claros e JSDoc/TSDoc quando apropriado, seguindo o padrão do projeto.
-   [x] **Tarefa 2.9:** **Documento de Arquitetura Off-chain:** Criar `offchain/docs/ARCHITECTURE.md` detalhando a arquitetura geral do bot, seus componentes e fluxo de dados.

## Milestone 3: Monitoramento Eficiente de Vaults (usando ethers.js)

**Status:** Em Andamento

-   [x] **Tarefa 3.1:** Carregar as ABIs dos contratos `VaultFactory`, `Vault`, `OracleManager` e `LiquidationManager`.
-   [x] **Tarefa 3.2:** Implementar a lógica para buscar todos os `Vaults` criados. **Melhoria:** Utilizar eventos `VaultCreated` do `VaultFactory` para descobrir novos Vaults. O bot deve ser capaz de buscar eventos históricos desde o bloco de deploy do `VaultFactory`.
-   [x] **Tarefa 3.3:** Para cada `Vault`, implementar a lógica para ler seu estado (`collateralAmount`, `debtAmount`, `collateralToken`). **Melhoria:** Considerar o uso de `ethers.js` para buscar dados de múltiplos Vaults ou múltiplos parâmetros de um Vault em uma única chamada RPC, otimizando o desempenho.
-   [x] **Tarefa 3.4:** Implementar o cálculo do Índice de Colateralização (CR) de cada `Vault`, buscando o preço do colateral no `OracleManager`.
-   [ ] **Tarefa 3.5:** Implementar um cache local para estados de Vaults e preços de oráculos para reduzir chamadas RPC redundantes e melhorar a reatividade.
-   [ ] **Tarefa 3.6:** Considerar a assinatura de eventos de Vaults (ex: `CollateralDeposited`, `DebtMinted`) para atualizar o estado do Vault de forma reativa, em vez de apenas polling periódico.
-   [ ] **Tarefa 3.7:** **Documento de Mecanismo de Monitoramento:** Criar `offchain/docs/MONITORING_MECHANISM.md` detalhando como os Vaults são descobertos, seu estado é monitorado e atualizado.

## Milestone 4: Lógica de Liquidação Segura e Otimizada

**Status:** Em Andamento

-   [x] **Tarefa 4.1:** Identificar os `Vaults` cujo CR está abaixo do `MIN_COLLATERALIZATION_RATIO`.
-   [x] **Tarefa 4.2:** Para cada `Vault` não saudável, chamar a função `startAuction` no contrato `LiquidationManager`.
-   [x] **Tarefa 4.3:** Implementar o gerenciamento de chave privada para assinar a transação de liquidação (lendo a `PRIVATE_KEY` de um arquivo `.env`).
-   [x] **Tarefa 4.4:** Adicionar tratamento de erros robusto e logs para a submissão da transação (sucesso, falha, problemas de gás, etc.).
-   [x] **Tarefa 4.5:** **Melhoria:** Antes de enviar uma transação de liquidação, simular a transação localmente (ex: `viem.simulateContract`) para prever falhas e estimar o gás.
-   [x] **Tarefa 4.6:** **Melhoria:** Implementar gerenciamento de nonce transacional para evitar erros de nonce e garantir a ordem correta das transações.
-   [x] **Tarefa 4.8:** **Melhoria:** Monitorar o status das transações de liquidação enviadas e o progresso dos leilões.
-   [ ] **Tarefa 4.7:** **Melhoria:** Adicionar um mecanismo de throttling ou fila para liquidações, evitando o envio excessivo de transações em caso de múltiplos Vaults não saudáveis simultaneamente.
-   [ ] **Tarefa 4.9:** **Melhoria:** Integrar com um sistema de alerta (ex: Telegram, Discord) para notificar sobre liquidações bem-sucedidas, falhas críticas ou anomalias.
-   [ ] **Tarefa 4.10:** **Documento de Mecanismo de Liquidação:** Criar `offchain/docs/LIQUIDATION_MECHANISM.md` detalhando a estratégia de liquidação, tratamento de transações e mitigação de riscos.

## Milestone 5: Testes e Observabilidade

**Status:** Pendente

-   [ ] **Tarefa 5.1:** Escrever testes unitários para as funções críticas do bot (cálculo de CR, lógica de decisão de liquidação, gerenciamento de gás/nonce).
-   [ ] **Tarefa 5.2:** Escrever testes de integração para simular a interação do bot com uma blockchain local (Hardhat/Anvil).
-   [ ] **Tarefa 5.3:** Configurar métricas de observabilidade (ex: Prometheus) para monitorar o desempenho do bot (número de Vaults monitorados, liquidações iniciadas, taxa de sucesso de transações, custos de gás).
-   [ ] **Tarefa 5.4:** Documentar o processo de deploy do bot (ex: via Docker, Kubernetes).
-   [ ] **Tarefa 5.5:** **Documento de Estratégia de Testes e Observabilidade:** Criar `offchain/docs/TESTING_AND_OBSERVABILITY.md` detalhando a abordagem de testes e as ferramentas de monitoramento.

## Milestone 6: Repositórios GitHub de Referência

Use estes projetos como base de pesquisa para arquitetura, padrões de código e estratégias de monitoramento:

-   **MakerDAO Keepers**
    -   **Link:** `https://github.com/makerdao/auction-keeper`
    -   **Inspiração:** Robustez em leilões e automação de liquidações.

-   **Yearn Keeper Bots**
    -   **Link:** `https://github.com/yearn/brownie-strategy-mix`
    -   **Inspiração:** Exemplos de estratégias DeFi e automação com Brownie/ethers.

-   **Keeper Network (estilo Chainlink)**
    -   **Link:** `https://github.com/keep3r-network/keep3r.network`
    -   **Inspiração:** Infraestrutura descentralizada de keepers.

-   **Gelato Network Automations**
    -   **Link:** `https://github.com/gelatodigital/ops`
    -   **Inspiração:** Infraestrutura moderna para automações on-chain e off-chain.

---

## Análise de Repositórios de Referência e Recomendações Arquiteturais para o Bot Keeper Off-chain

### 1. Introdução

Este documento detalha a análise de quatro repositórios GitHub de referência no contexto do desenvolvimento do bot keeper off-chain do protocolo SCC. O objetivo é extrair insights sobre arquitetura, padrões de código, estratégias de monitoramento e melhores práticas para informar e aprimorar o plano de desenvolvimento existente. As informações aqui contidas servem como um guia para qualquer desenvolvedor ou IA que venha a trabalhar neste projeto.

### 2. Resumo dos Insights por Repositório

#### 2.1. MakerDAO Keepers (`makerdao/auction-keeper`)
*   **Foco:** Automação de leilões e liquidações para o protocolo MakerDAO.
*   **Principais Aprendizados:**
    *   **Descoberta de Vaults:** Utiliza um mecanismo eficiente baseado em eventos (`Vat.LogFrob`, `Vat.LogFork`) e raspagem de logs históricos com `chunk_size` para gerenciar a carga RPC.
    *   **Gerenciamento de Gás:** Implementa uma estratégia robusta (`DynamicGasPrice`) que combina oráculos de gás, preços fixos e fallback para o nó, com multiplicadores dinâmicos e um limite máximo para garantir a inclusão de transações.
    *   **Gerenciamento de Transações:** Lógica sofisticada para lidar com nonces, substituição de transações presas e limpeza de transações pendentes na inicialização.
    *   **Modularidade:** Separação da lógica principal do keeper de "modelos de lance" externos, permitindo diferentes estratégias de bidding.
    *   **Precisão Numérica:** Uso de tipos `Wad`, `Ray`, `Rad` para aritmética de ponto fixo.

#### 2.2. Yearn Keeper Bots (`yearn/brownie-strategy-mix`)
*   **Foco:** Desenvolvimento e teste de estratégias DeFi para Yearn Vaults usando o framework Brownie.
*   **Principais Aprendizados:**
    *   **Ambiente de Teste:** Demonstra o valor de ambientes de mainnet forked local (Ganache com Brownie) para testes de integração e desenvolvimento rápido.
    *   **Estrutura de Estratégia:** O contrato `Strategy.sol` define uma interface clara para estratégias, encapsulando a lógica de interação com protocolos DeFi.
    *   **Ferramentas de Desenvolvimento:** Uso de Brownie para interação com contratos, deploy e depuração.

#### 2.3. Keeper Network (`keep3r-network/keep3r.network`)
*   **Foco:** Infraestrutura descentralizada para conectar "jobs" (contratos que precisam de execução externa) com "keepers" (entidades que realizam o trabalho).
*   **Principais Aprendizados:**
    *   **Incentivos Descentralizados:** Modelo de incentivo baseado em tokens (KP3R) e liquidez (LP tokens) para recompensar keepers.
    *   **Controle de Acesso:** O padrão `isKeeper(msg.sender)` para verificar a autorização de um keeper em funções críticas de contratos de "job" é um excelente exemplo de controle de acesso.
    *   **Gerenciamento de Keepers:** Funções para `bond`, `activate`, `unbond`, `slash` e `revoke` keepers, demonstrando um ciclo de vida completo.
    *   **Segurança:** Uso de `SafeMath`, `ReentrancyGuard` e `SafeERC20` em contratos Solidity.

#### 2.4. Gelato Network Automations (`gelatodigital/ops`)
*   **Foco:** Plataforma para automação generalizada de execução de contratos inteligentes ("Gelato Functions").
*   **Principais Aprendizados:**
    *   **Desenvolvimento com Hardhat:** Confirma o uso de Hardhat (TypeScript) para desenvolvimento local e deploy, alinhando-se com a stack tecnológica do nosso projeto off-chain.
    *   **Conteinerização:** Uso de `Dockerfile` para empacotamento e deploy da aplicação, promovendo consistência e escalabilidade.
    *   **Configuração Segura:** Gerenciamento de variáveis de ambiente para chaves privadas e chaves de API.

### 3. Recomendações por Marco do Plano de Desenvolvimento

#### **Marco 1: Configuração do Projeto TypeScript e Ferramentas de Qualidade**
*   **Recomendação:** Manter o foco na qualidade do código. Implementar ferramentas de linting (ESLint), formatação (Prettier) e análise estática para garantir a consistência e identificar problemas precocemente. O tratamento seguro de variáveis de ambiente para dados sensíveis (chaves privadas, chaves de API) é uma prioridade, seguindo os exemplos de Yearn e Gelato.

#### **Marco 2: Conexão com a Blockchain, Estrutura Principal e Robustez**
*   **Gerenciamento de Gás (Tarefa 2.6):**
    *   **Aprimoramento:** Implementar uma estratégia de gerenciamento de gás inspirada no `DynamicGasPrice` do MakerDAO. Isso deve incluir:
        *   Obtenção de preços de gás de múltiplas fontes confiáveis (oráculos de gás, se disponíveis para `viem`/`ethers.js`).
        *   Ajuste dinâmico dos preços do gás para transações pendentes, com multiplicadores iniciais e reativos.
        *   Um limite máximo de preço de gás configurável para evitar gastos excessivos.
*   **Tratamento de Erros (Tarefa 2.5):**
    *   **Aprimoramento:** Implementar mecanismos de retry com backoff exponencial para todas as chamadas externas (RPC, APIs externas). Registrar informações detalhadas de erro para facilitar a depuração e o monitoramento.
*   **Gerenciamento de Transações:**
    *   **Adição:** Incorporar lógica robusta de gerenciamento de nonce e substituição de transações (aceleração) para garantir o envio confiável de transações, inspirando-se na classe `Auction` do MakerDAO.
*   **Logging Estruturado (Tarefa 2.4):**
    *   **Confirmação:** Continuar com `pino` ou `winston` conforme planejado, garantindo que os logs sejam detalhados o suficiente para depuração e monitoramento de produção.

#### **Marco 3: Monitoramento Eficiente de Vaults**
*   **Descoberta de Vaults (Tarefa 3.2):**
    *   **Aprimoramento:** Implementar um mecanismo de descoberta de Vaults orientado a eventos, similar ao `ChainUrnHistoryProvider` do MakerDAO. Isso deve envolver:
        *   Assinar eventos `VaultCreated` do `VaultFactory` para atualizações em tempo real.
        *   Raspar eventos `VaultCreated` históricos desde o bloco de deploy do `VaultFactory` para inicializar o estado do bot. Utilizar `chunking` para a busca de logs históricos para gerenciar a carga RPC.
        *   Considerar um mecanismo `cache_lookback` para contabilizar reorganizações de bloco e garantir a robustez.
*   **Monitoramento do Estado do Vault (Tarefa 3.3):**
    *   **Aprimoramento:** Implementar um mecanismo de polling periódico para ler o estado dos Vaults descobertos. Otimizar chamadas RPC agrupando solicitações para múltiplos Vaults ou múltiplos parâmetros de um único Vault (multi-calls).
*   **Cache Local (Tarefa 3.5):**
    *   **Confirmação:** Implementar um cache local em memória para estados de Vaults e preços de oráculos para minimizar chamadas RPC redundantes e melhorar a capacidade de resposta.

#### **Marco 4: Lógica de Liquidação Segura e Otimizada**
*   **Estratégia de Liquidação Modular (Tarefa 4.1, 4.2):**
    *   **Aprimoramento:** Implementar uma classe `LiquidationStrategy` que encapsule a lógica para:
        *   Calcular a taxa de colateralização (CR) e identificar Vaults abaixo do `MIN_COLLATERALIZATION_RATIO`.
        *   Construir a transação para chamar a função `startAuction` no contrato `LiquidationManager`.
*   **Simulação de Transações (Tarefa 4.5):**
    *   **Aprimoramento:** Integrar `viem.simulateContract` (ou equivalente `ethers.js`) para simular transações de liquidação antes de enviá-las. Isso ajudará a prever falhas, estimar o gás com precisão e evitar o envio de transações que certamente falharão.
*   **Gerenciamento de Nonce (Tarefa 4.6):**
    *   **Aprimoramento:** Implementar gerenciamento robusto de nonce, incluindo o rastreamento de transações pendentes e a substituição delas com preços de gás mais altos se ficarem presas.
*   **Throttling/Gerenciamento de Recursos (Tarefa 4.7):**
    *   **Aprimoramento:** Implementar um mecanismo para limitar a taxa de transações de liquidação e gerenciar o capital disponível do bot para liquidações, similar ao conceito de `Reservoir` do MakerDAO, para evitar gastos excessivos e congestionamento da rede.
*   **Controle de Acesso:**
    *   **Adição:** Garantir que o contrato `LiquidationManager` tenha controle de acesso apropriado (por exemplo, usando um padrão `onlyAuthorizedKeeper` inspirado no `isKeeper` do Keep3r) para restringir quem pode chamar `startAuction`.
*   **Alertas (Tarefa 4.9):**
    *   **Confirmação:** Integrar com um sistema de alerta robusto (Telegram, Discord, PagerDuty) para notificar sobre eventos críticos (liquidações bem-sucedidas, transações falhas, fundos baixos, anomalias).

#### **Marco 5: Testes e Observabilidade**
*   **Testes de Integração (Tarefa 5.2):**
    *   **Aprimoramento:** Priorizar testes de integração em uma blockchain forked local (Hardhat/Anvil). Isso permite simular interações complexas com os contratos SCC em um ambiente realista e isolado.
*   **Observabilidade (Tarefa 5.3):**
    *   **Aprimoramento:** Planejar métricas abrangentes (por exemplo, número de Vaults monitorados, tentativas de liquidação, taxa de sucesso de transações, custos de gás, erros, latência de RPC) e integrar com um sistema de monitoramento como Prometheus e Grafana.
*   **Conteinerização (Tarefa 5.4):**
    *   **Aprimoramento:** Desenvolver um `Dockerfile` para o bot keeper para facilitar o deploy consistente em diferentes ambientes (desenvolvimento, staging, produção) e integrar com orquestradores como Kubernetes.

#### **Marco 6: Repositórios GitHub de Referência**
*   **Confirmação:** Manter este marco como um registro da pesquisa realizada, servindo como ponto de partida para futuras análises.

### 4. Decisões Arquiteturais Propostas

Com base na análise dos repositórios de referência e nas necessidades do bot keeper SCC, as seguintes decisões arquiteturais guiarão o desenvolvimento:

1.  **Design Modular:** O bot keeper será projetado com uma arquitetura modular, separando preocupações como conexão com a blockchain, monitoramento de Vaults, lógica de liquidação, gerenciamento de gás e envio de transações. Isso aumentará a manutenibilidade, testabilidade e permitirá futuras extensões (por exemplo, diferentes estratégias de liquidação).
2.  **Descoberta de Vaults Orientada a Eventos:** A descoberta de Vaults será principalmente orientada a eventos, ouvindo eventos `VaultCreated` do contrato `VaultFactory`. Eventos históricos serão raspados do bloco de deploy para garantir a sincronização completa do estado.
3.  **Monitoramento Híbrido (Polling + Eventos):** Embora orientado a eventos para descoberta, o monitoramento do estado do Vault envolverá uma abordagem híbrida de polling periódico (para o estado atual e cálculo de CR) e, potencialmente, assinaturas de eventos para atualizações reativas de parâmetros críticos do Vault.
4.  **Gerenciamento Robusto de Gás:** O bot implementará uma estratégia sofisticada de gerenciamento de gás, incluindo:
    *   Obtenção de preços de gás de múltiplas fontes confiáveis (oráculos).
    *   Ajuste dinâmico dos preços do gás para transações pendentes com multiplicadores iniciais e reativos.
    *   Um limite máximo de preço de gás configurável.
5.  **Envio Confiável de Transações:** O bot incorporará um gerenciamento robusto de transações, incluindo:
    *   Gerenciamento de nonce para evitar falhas de transação.
    *   Substituição de transações (aceleração) para transações presas.
    *   Simulação de transações pré-envio para prever falhas e estimar limites de gás.
6.  **Cache Local:** Um cache em memória será usado para armazenar estados de Vaults e preços de oráculos para minimizar chamadas RPC redundantes e melhorar o desempenho.
7.  **Configuração Segura:** Todas as informações sensíveis (chaves privadas, chaves de API) serão gerenciadas por meio de variáveis de ambiente.
8.  **Conteinerização:** O bot keeper será conteinerizado usando Docker para deploy consistente e escalável.
9.  **Testes Abrangentes:** O desenvolvimento será guiado por testes unitários e de integração abrangentes, com testes de integração executados em uma blockchain forked local (Hardhat/Anvil).
10. **Observabilidade:** O bot exporá métricas para monitorar sua saúde e desempenho, integrado a um sistema de monitoramento.

### 5. "Verdades" (Principais Aprendizados dos Projetos de Referência)

Estes são os princípios e melhores práticas extraídos da análise dos repositórios de referência, que devem ser considerados como verdades fundamentais para o desenvolvimento do bot keeper SCC:

*   **Verdade 1: A descoberta orientada a eventos é crucial para o monitoramento eficiente de Vaults.** (Inspirado no `ChainUrnHistoryProvider` do MakerDAO, que usa eventos para descobrir e atualizar o estado dos Vaults).
*   **Verdade 2: O gerenciamento robusto de gás é primordial para o envio confiável de transações em um ambiente de rede volátil.** (Inspirado na estratégia `DynamicGasPrice` do MakerDAO, que ajusta dinamicamente os preços do gás).
*   **Verdade 3: A substituição de transações e o gerenciamento de nonce são essenciais para lidar com transações presas.** (Inspirado na classe `Auction` do MakerDAO, que gerencia o ciclo de vida das transações).
*   **Verdade 4: A modularização da lógica de liquidação em "estratégias" aumenta a flexibilidade e a manutenibilidade.** (Inspirado nas classes `Strategy` do MakerDAO, que separam a lógica de bidding por tipo de leilão).
*   **Verdade 5: Ambientes de blockchain forked local (Hardhat/Anvil) são indispensáveis para testes de integração eficazes de interações on-chain.** (Confirmado por Yearn e Gelato, que utilizam esses ambientes para desenvolvimento e teste).
*   **Verdade 6: Mecanismos de controle de acesso são vitais para proteger funções críticas de contrato (por exemplo, `startAuction` no `LiquidationManager`).** (Inspirado no padrão `isKeeper` do Keep3r, que verifica a autorização do chamador).
*   **Verdade 7: O tratamento seguro de chaves privadas e chaves de API por meio de variáveis de ambiente é uma prática de segurança inegociável.** (Observado em Yearn e Gelato, que utilizam variáveis de ambiente para credenciais sensíveis).
*   **Verdade 8: A conteinerização (Docker) simplifica o deploy e garante a consistência entre os ambientes.** (Confirmado por Gelato, que fornece um `Dockerfile` para sua aplicação).
*   **Verdade 9: Bibliotecas de aritmética de ponto fixo são necessárias para cálculos financeiros on-chain precisos.** (Inspirado no uso de `Wad`, `Ray`, `Rad` pelo MakerDAO para evitar imprecisões em cálculos financeiros).
