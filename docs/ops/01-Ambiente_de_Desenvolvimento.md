# Documento de Operações: Ambiente de Desenvolvimento

## 1. Visão Geral

Este projeto utiliza `pnpm workspaces` para gerenciar o monorepo e `Docker Compose` para orquestrar um ambiente de desenvolvimento local, consistente e isolado.

O ambiente padrão definido em `docker-compose.yml` consiste em dois serviços principais: `anvil` e `keeper`.

## 2. Serviços do Docker Compose

### Serviço: `anvil`

- **O que é?** É um nó de blockchain local extremamente rápido, parte da toolchain do Foundry.
- **Propósito:** Simular a rede Ethereum na sua máquina para testes, desenvolvimento e depuração. Nossos smart contracts são deployados e testados contra esta instância.
- **Acesso:** O nó fica acessível na sua máquina através da porta `8545`. O RPC URL é `http://localhost:8545`.

### Serviço: `keeper`

- **O que é?** É o container Docker que roda nosso serviço off-chain (o bot liquidador).
- **Propósito:** Executar tarefas que monitoram a blockchain e interagem com nossos smart contracts. A primeira tarefa deste serviço será monitorar `Vaults` e chamar a função `liquidate` quando necessário.
- **Configuração:** Ele é construído a partir do `offchain/Dockerfile` e se conecta ao serviço `anvil` através da rede interna do Docker no endereço `http://anvil:8545`.

## 3. Comandos Úteis

Todos os comandos devem ser executados a partir da raiz do projeto.

- **Iniciar todo o ambiente (em background):**
  ```bash
  docker-compose up -d
  ```

- **Parar todo o ambiente:**
  ```bash
  docker-compose down
  ```

- **Ver os logs de um serviço (ex: o keeper):**
  ```bash
  docker-compose logs -f keeper
  ```

- **Instalar todas as dependências do monorepo:**
  ```bash
  pnpm install
  ```

- **Adicionar uma dependência a um pacote específico (ex: `ethers` ao `offchain`):**
  ```bash
  pnpm --filter @scc/offchain add ethers
  ```

- **Rodar um script de um pacote específico (ex: testes dos contratos):**
  ```bash
  pnpm contracts:test
  ```
