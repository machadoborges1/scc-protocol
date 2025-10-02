# Plano de Desenvolvimento - Off-chain Keeper Bot (Revisado)

Este documento rastreia o progresso do desenvolvimento dos serviços off-chain do protocolo SCC, começando pelo bot de liquidação (Keeper).

## Milestone 1: Configuração do Projeto TypeScript e Ferramentas de Qualidade

**Status:** Concluído

-   [x] **Tarefa 1.1:** Adicionar dependências de desenvolvimento (`typescript`, `ts-node`, `nodemon`, `@types/node`, `jest` ou `mocha` para testes).
-   [x] **Tarefa 1.2:** Adicionar dependências de produção (`viem`, `dotenv`, `pino` ou `winston` para logging avançado).
-   [x] **Tarefa 1.3:** Criar e configurar o arquivo `tsconfig.json`.
-   [x] **Tarefa 1.4:** Adicionar scripts (`start`, `build`, `dev`, `test`, `lint`) ao `package.json`.
-   [x] **Tarefa 1.5:** Configurar linter (ESLint) e formatter (Prettier) para garantir a qualidade e consistência do código.

## Milestone 2: Conexão com a Blockchain, Estrutura Principal e Robustez

**Status:** Pendente

-   [x] **Tarefa 2.1:** Criar o diretório `src` e o arquivo principal `index.ts`.
-   [ ] **Tarefa 2.2:** Implementar a lógica de conexão com um nó Ethereum usando `viem`. A URL do RPC será lida de variáveis de ambiente (`.env`).
-   [x] **Tarefa 2.3:** Implementar um loop principal (`setInterval` ou `setTimeout` recursivo) que executará a lógica de monitoramento periodicamente (ex: a cada 15 segundos).
-   [ ] **Tarefa 2.4:** Adicionar um sistema de logging estruturado (ex: `pino`) para exibir o status do bot, eventos e erros.
-   [ ] **Tarefa 2.5:** Implementar tratamento de erros robusto para chamadas RPC, incluindo mecanismos de retry com backoff exponencial para falhas temporárias.
-   [ ] **Tarefa 2.6:** Implementar gerenciamento de gás (monitoramento de `gasPrice`/`maxFeePerGas`) para otimizar custos e garantir a inclusão de transações.
-   [ ] **Tarefa 2.7:** Adicionar lógica para um desligamento gracioso do bot (`SIGINT`/`SIGTERM`), garantindo que transações pendentes sejam finalizadas ou o estado seja salvo.
-   [ ] **Tarefa 2.8:** **Documentação de Código:** Garantir que todo o código seja bem documentado com comentários claros e JSDoc/TSDoc quando apropriado, seguindo o padrão do projeto.
-   [ ] **Tarefa 2.9:** **Documento de Arquitetura Off-chain:** Criar `offchain/docs/ARCHITECTURE.md` detalhando a arquitetura geral do bot, seus componentes e fluxo de dados.

## Milestone 3: Monitoramento Eficiente de Vaults

**Status:** Pendente

-   [ ] **Tarefa 3.1:** Carregar as ABIs dos contratos `VaultFactory`, `Vault`, `OracleManager` e `LiquidationManager`.
-   [ ] **Tarefa 3.2:** Implementar a lógica para buscar todos os `Vaults` criados. **Melhoria:** Utilizar eventos `VaultCreated` do `VaultFactory` para descobrir novos Vaults. O bot deve ser capaz de buscar eventos históricos desde o bloco de deploy do `VaultFactory`.
-   [ ] **Tarefa 3.3:** Para cada `Vault`, implementar a lógica para ler seu estado (`collateralAmount`, `debtAmount`, `collateralToken`). **Melhoria:** Considerar o uso de `viem.multicall` para buscar dados de múltiplos Vaults ou múltiplos parâmetros de um Vault em uma única chamada RPC, otimizando o desempenho.
-   [ ] **Tarefa 3.4:** Implementar o cálculo do Índice de Colateralização (CR) de cada `Vault`, buscando o preço do colateral no `OracleManager`.
-   [ ] **Tarefa 3.5:** Implementar um cache local para estados de Vaults e preços de oráculos para reduzir chamadas RPC redundantes e melhorar a reatividade.
-   [ ] **Tarefa 3.6:** Considerar a assinatura de eventos de Vaults (ex: `CollateralDeposited`, `DebtMinted`) para atualizar o estado do Vault de forma reativa, em vez de apenas polling periódico.
-   [ ] **Tarefa 3.7:** **Documento de Mecanismo de Monitoramento:** Criar `offchain/docs/MONITORING_MECHANISM.md` detalhando como os Vaults são descobertos, seu estado é monitorado e atualizado.

## Milestone 4: Lógica de Liquidação Segura e Otimizada

**Status:** Pendente

-   [ ] **Tarefa 4.1:** Identificar os `Vaults` cujo CR está abaixo do `MIN_COLLATERALIZATION_RATIO`.
-   [ ] **Tarefa 4.2:** Para cada `Vault` não saudável, chamar a função `startAuction` no contrato `LiquidationManager`.
-   [ ] **Tarefa 4.3:** Implementar o gerenciamento de chave privada para assinar a transação de liquidação (lendo a `PRIVATE_KEY` de um arquivo `.env`).
-   [ ] **Tarefa 4.4:** Adicionar tratamento de erros robusto e logs para a submissão da transação (sucesso, falha, problemas de gás, etc.).
-   [ ] **Tarefa 4.5:** **Melhoria:** Antes de enviar uma transação de liquidação, simular a transação localmente (ex: `viem.simulateContract`) para prever falhas e estimar o gás.
-   [ ] **Tarefa 4.6:** **Melhoria:** Implementar gerenciamento de nonce transacional para evitar erros de nonce e garantir a ordem correta das transações.
-   [ ] **Tarefa 4.7:** **Melhoria:** Adicionar um mecanismo de throttling ou fila para liquidações, evitando o envio excessivo de transações em caso de múltiplos Vaults não saudáveis simultaneamente.
-   [ ] **Tarefa 4.8:** **Melhoria:** Monitorar o status das transações de liquidação enviadas e o progresso dos leilões.
-   [ ] **Tarefa 4.9:** **Melhoria:** Integrar com um sistema de alerta (ex: Telegram, Discord) para notificar sobre liquidações bem-sucedidas, falhas críticas ou anomalias.
-   [ ] **Tarefa 4.10:** **Documento de Mecanismo de Liquidação:** Criar `offchain/docs/LIQUIDATION_MECHANISM.md` detalhando a estratégia de liquidação, tratamento de transações e mitigação de riscos.

## Milestone 5: Testes e Observabilidade

**Status:** Pendente

-   [ ] **Tarefa 5.1:** Escrever testes unitários para as funções críticas do bot (cálculo de CR, lógica de decisão de liquidação, gerenciamento de gás/nonce).
-   [ ] **Tarefa 5.2:** Escrever testes de integração para simular a interação do bot com uma blockchain local (Hardhat/Anvil).
-   [ ] **Tarefa 5.3:** Configurar métricas de observabilidade (ex: Prometheus) para monitorar o desempenho do bot (número de Vaults monitorados, liquidações iniciadas, taxa de sucesso de transações, custos de gás).
-   [ ] **Tarefa 5.4:** Documentar o processo de deploy do bot (ex: via Docker, Kubernetes).
-   [ ] **Tarefa 5.5:** **Documento de Estratégia de Testes e Observabilidade:** Criar `offchain/docs/TESTING_AND_OBSERVABILITY.md` detalhando a abordagem de testes e as ferramentas de monitoramento.