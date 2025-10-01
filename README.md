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

## Como Começar

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/machadoborges1/scc-protocol.git
    cd scc-protocol
    ```

2.  **Instale as Dependências:**
    Rode o seguinte comando na raiz do projeto. O `pnpm` irá instalar as dependências para todos os pacotes do monorepo.
    ```bash
    pnpm install
    ```

3.  **Inicie o Ambiente de Desenvolvimento:**
    Este comando usará o `docker-compose` para iniciar um nó de blockchain local (`anvil`) e outros serviços definidos.
    ```bash
    docker-compose up -d
    ```

## Comandos Comuns

- **Testar os Contratos:**
  ```bash
  pnpm contracts:test
  ```
