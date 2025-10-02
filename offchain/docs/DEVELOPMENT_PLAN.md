# Plano de Desenvolvimento - Off-chain Keeper Bot

Este documento rastreia o progresso do desenvolvimento dos serviços off-chain do protocolo SCC, começando pelo bot de liquidação (Keeper).

## Milestone 1: Configuração do Projeto TypeScript

**Status:** Pendente

- [ ] **Tarefa 1.1:** Adicionar dependências de desenvolvimento (`typescript`, `ts-node`, `nodemon`, `@types/node`).
- [ ] **Tarefa 1.2:** Adicionar dependências de produção (`viem`, `dotenv`).
- [ ] **Tarefa 1.3:** Criar e configurar o arquivo `tsconfig.json`.
- [ ] **Tarefa 1.4:** Adicionar scripts (`start`, `build`, `dev`) ao `package.json`.

## Milestone 2: Conexão com a Blockchain e Estrutura Principal

**Status:** Pendente

- [ ] **Tarefa 2.1:** Criar o diretório `src` e o arquivo principal `index.ts`.
- [ ] **Tarefa 2.2:** Implementar a lógica de conexão com um nó Ethereum usando `viem`. A URL do RPC será lida de variáveis de ambiente (`.env`).
- [ ] **Tarefa 2.3:** Implementar um loop principal (`setInterval`) que executará a lógica de monitoramento periodicamente (ex: a cada 15 segundos).
- [ ] **Tarefa 2.4:** Adicionar um sistema de logging básico para exibir o status do bot (ex: "Running...", "Checking vaults...").

## Milestone 3: Monitoramento de Vaults

**Status:** Pendente

- [ ] **Tarefa 3.1:** Carregar as ABIs dos contratos `VaultFactory`, `Vault`, e `OracleManager`.
- [ ] **Tarefa 3.2:** Implementar a lógica para buscar todos os `Vaults` criados. **Nota:** Como a `VaultFactory` não armazena uma lista, teremos que buscar os eventos `VaultCreated` para obter os endereços.
- [ ] **Tarefa 3.3:** Para cada `Vault`, implementar a lógica para ler seu estado (`collateralAmount`, `debtAmount`, `collateralToken`).
- [ ] **Tarefa 3.4:** Implementar o cálculo do Índice de Colateralização (CR) de cada `Vault`, buscando o preço do colateral no `OracleManager`.

## Milestone 4: Lógica de Liquidação

**Status:** Pendente

- [ ] **Tarefa 4.1:** Identificar os `Vaults` cujo CR está abaixo do `MIN_COLLATERALIZATION_RATIO`.
- [ ] **Tarefa 4.2:** Para cada `Vault` não saudável, chamar a função `startAuction` no contrato `LiquidationManager`.
- [ ] **Tarefa 4.3:** Implementar o gerenciamento de chave privada para assinar a transação de liquidação (lendo a `PRIVATE_KEY` de um arquivo `.env`).
- [ ] **Tarefa 4.4:** Adicionar tratamento de erros robusto e logs para a submissão da transação (sucesso, falha, problemas de gás, etc.).
