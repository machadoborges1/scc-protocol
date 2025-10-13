# Protocolo de Stablecoin SCC

Este é o monorepo para o desenvolvimento do **SCC (Stablecoin Cripto-Colateralizada)**, uma stablecoin descentralizada atrelada ao dólar e super-colateralizada por criptoativos.

## Estrutura do Monorepo

Este repositório usa `pnpm workspaces` para gerenciar múltiplos pacotes (sub-projetos) de forma eficiente.

- `/contracts`: Contém todos os smart contracts em Solidity desenvolvidos com Foundry.
- `/offchain`: Contém serviços off-chain, como bots e keepers, escritos em TypeScript/Node.js.
- `/backend`: (Placeholder) Futuro servidor de API para o protocolo.
- `/frontend`: (Placeholder) Futura interface de usuário para interagir com o protocolo.
- `/docs`: Contém toda a documentação do projeto, incluindo arquitetura, produto e operações.

## Pré-requisitos

Antes de começar, você precisa ter as seguintes ferramentas instaladas:

1.  **Git:** Para controle de versão.
2.  **Foundry:** Para desenvolvimento e teste dos smart contracts.
3.  **pnpm:** Para gerenciamento de dependências dos pacotes JavaScript/TypeScript.
4.  **Docker & Docker Compose:** Para orquestrar e rodar o ambiente de desenvolvimento local.

## Ambiente de Desenvolvimento Local

Este projeto utiliza Docker Compose para orquestrar um ambiente de desenvolvimento completo e integrado, incluindo uma blockchain local (Anvil), o indexador (The Graph) e todos os serviços de suporte.

### 1. Iniciar o Ambiente

Com todos os pré-requisitos instalados, inicie todos os serviços em segundo plano com um único comando a partir da raiz do projeto:

```bash
docker compose up -d
```

Este comando irá construir as imagens necessárias e iniciar os seguintes serviços:
- **Anvil:** Blockchain de teste local na porta `8545`.
- **Postgres:** Banco de dados para o Subgraph.
- **IPFS:** Nó IPFS para hospedar os metadados do Subgraph.
- **Graph Node:** O indexador que irá sincronizar com a blockchain.
- **Keeper:** O bot off-chain para liquidações.
- **Prometheus:** Para coleta de métricas.

### 2. Verificar e Testar o Ambiente

Após iniciar os serviços, você pode verificar a saúde de toda a stack, implantar os contratos, implantar o subgraph e rodar os testes de integração com um único comando:

```bash
pnpm test:integration
```

Este comando executa a seguinte sequência:
1.  **Aguarda** a inicialização dos serviços.
2.  **Implanta** os contratos na rede Anvil.
3.  **Prepara e implanta** o subgraph no Graph Node local.
4.  **Executa os testes** de integração em `subgraph/tests/integration` para garantir que os dados estão sendo indexados corretamente.

Um sucesso neste comando é a prova de que todo o ambiente está configurado e funcionando corretamente.

### 3. Acessando os Serviços

Com o ambiente no ar, você pode acessar os principais serviços:

- **GraphQL (Subgraph):** `http://localhost:8000/subgraphs/name/scc/scc-protocol`
- **Blockchain RPC (Anvil):** `http://localhost:8545`
- **Prometheus (Métricas):** `http://localhost:9090`

### 4. Parando o Ambiente

- Para parar todos os serviços:
  ```bash
  docker compose down
  ```

- Para parar os serviços e **remover todos os dados** (útil para um reinício limpo):
  ```bash
  docker compose down -v
  ```

## Comandos Úteis

- **Testar apenas os contratos:**
  ```bash
  pnpm contracts:test
  ```
- **Testar apenas os mapeamentos do subgraph (unitários):**
  ```bash
  pnpm test:subgraph
  ```
