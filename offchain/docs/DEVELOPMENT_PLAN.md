# Plano de Desenvolvimento - Off-chain Keeper Bot (Revisado)

Este documento rastreia o progresso do desenvolvimento dos serviços off-chain do protocolo SCC, começando pelo bot de liquidação (Keeper).

## Milestone 1: Configuração do Projeto TypeScript e Ferramentas de Qualidade

**Status:** Concluído

-   [x] **Tarefa 1.1:** Adicionar dependências de desenvolvimento.
-   [x] **Tarefa 1.2:** Adicionar dependências de produção.
-   [x] **Tarefa 1.3:** Criar e configurar o arquivo `tsconfig.json`.
-   [x] **Tarefa 1.4:** Adicionar scripts ao `package.json`.
-   [x] **Tarefa 1.5:** Configurar linter (ESLint) e formatter (Prettier).

## Milestone 2: Conexão com a Blockchain, Estrutura Principal e Robustez

**Status:** Concluído

-   [x] **Tarefa 2.1:** Criar a estrutura de diretórios `src` e o arquivo principal `index.ts`.
-   [x] **Tarefa 2.2:** Implementar a lógica de conexão com um nó Ethereum.
-   [x] **Tarefa 2.3:** Implementar um loop principal de monitoramento.
-   [x] **Tarefa 2.4:** Adicionar um sistema de logging estruturado (`pino`).
-   [x] **Tarefa 2.5:** Implementar tratamento de erros com **backoff exponencial** para chamadas RPC.
-   [x] **Tarefa 2.6:** Implementar gerenciamento básico de gás.
-   [x] **Tarefa 2.7:** Adicionar lógica para desligamento gracioso (`SIGINT`/`SIGTERM`).
-   [x] **Tarefa 2.8:** Documentação de Código (JSDoc/TSDoc).
-   [x] **Tarefa 2.9:** Criar `offchain/docs/ARCHITECTURE.md`.

## Milestone 3: Monitoramento Eficiente de Vaults

**Status:** Em Andamento

-   [x] **Tarefa 3.1:** Carregar as ABIs dos contratos.
-   [x] **Tarefa 3.2:** Implementar a descoberta de Vaults via eventos `VaultCreated`.
-   [x] **Tarefa 3.3:** Implementar a leitura de estado dos Vaults (`collateralAmount`, `debtAmount`).
-   [x] **Tarefa 3.4:** Implementar o cálculo do Índice de Colateralização (CR).
-   [ ] **Tarefa 3.5:** Implementar um cache local para estados de Vaults e preços para otimizar chamadas RPC.
-   [ ] **Tarefa 3.6:** (Opcional) Considerar a assinatura de eventos de Vaults (ex: `CollateralDeposited`) para atualização reativa do estado.
-   [ ] **Tarefa 3.7:** Implementar a remoção de vaults inativos da lista de monitoramento (escutar por eventos como `AuctionClosed`).
-   [ ] **Tarefa 3.8:** Criar `offchain/docs/MONITORING_MECHANISM.md`.

## Milestone 4: Lógica de Liquidação Segura e Otimizada

**Status:** Em Andamento

-   [x] **Tarefa 4.1:** Identificar os `Vaults` abaixo do `MIN_COLLATERALIZATION_RATIO`.
-   [x] **Tarefa 4.2:** Chamar a função `startAuction` para vaults não saudáveis.
-   [x] **Tarefa 4.3:** Implementar o gerenciamento de chave privada via `.env`.
-   [x] **Tarefa 4.4:** Adicionar tratamento de erros e logs para a submissão da transação.
-   [x] **Tarefa 4.5:** Simular a transação localmente (`staticCall`) antes de enviar.
-   [x] **Tarefa 4.6:** Gerenciamento de nonce (atualmente implícito pelo `ethers.js`).
-   [x] **Tarefa 4.7:** Monitorar o status da transação enviada (`tx.wait()`).
-   [ ] **Tarefa 4.8:** **NOVO:** Refatorar a lógica de liquidação para separar a **Estratégia** (decidir se e quando liquidar) da **Execução** (enviar a transação), inspirado no MakerDAO.
-   [ ] **Tarefa 4.9:** **NOVO:** Implementar análise de lucratividade (custo de gás vs. valor do colateral) como parte da Estratégia.
-   [ ] **Tarefa 4.10:** **NOVO:** Implementar gerenciamento de nonce explícito para aumentar a robustez em redes congestionadas.
-   [ ] **Tarefa 4.11:** **NOVO:** Implementar uma estratégia de preço de gás dinâmica (ex: EIP-1559 com `maxFeePerGas` e `maxPriorityFeePerGas` ajustáveis).
-   [ ] **Tarefa 4.12:** **NOVO:** Implementar monitoramento de transação "presa" (stuck) com lógica para reenviar com gás maior.
-   [ ] **Tarefa 4.13:** Adicionar um mecanismo de throttling ou fila para liquidações.
-   [ ] **Tarefa 4.14:** Adicionar verificação de leilão ativo para evitar chamadas duplicadas a `startAuction`.
-   [ ] **Tarefa 4.15:** Criar `offchain/docs/LIQUIDATION_MECHANISM.md`.

## Milestone 5: Testes, Observabilidade e Deploy

**Status:** Em Andamento

-   [x] **Tarefa 5.1:** Escrever testes unitários para as funções críticas do bot.
-   [x] **Tarefa 5.2:** Escrever e corrigir teste de integração para o fluxo de liquidação em blockchain local (Anvil).
-   [ ] **Tarefa 5.3:** Configurar um endpoint de métricas (Prometheus) para observabilidade.
-   [ ] **Tarefa 5.4:** **NOVO:** Definir e expor métricas chave (ex: # de vaults monitorados, liquidações/falhas, latência RPC, saldo do keeper).
-   [ ] **Tarefa 5.5:** Integrar com um sistema de alerta (ex: Telegram, Discord) para eventos críticos.
-   [ ] **Tarefa 5.6:** Documentar o processo de deploy do bot (Docker).
-   [ ] **Tarefa 5.7:** Criar `offchain/docs/TESTING_AND_OBSERVABILITY.md`.
