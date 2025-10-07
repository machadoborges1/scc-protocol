# Subgraph do Protocolo SCC

Este Subgraph é responsável por indexar os eventos e estados dos contratos inteligentes do protocolo SCC, transformando os dados brutos da blockchain em uma API GraphQL facilmente consultável. Ele serve como a principal fonte de dados para o frontend (DApp) e para análises.

## 1. Visão Geral

O Subgraph monitora os contratos principais do protocolo SCC, como `VaultFactory`, `SCC_USD`, `SCC_GOV`, `LiquidationManager` e `StakingPool`. Ao escutar eventos emitidos por esses contratos, ele persiste os dados relevantes em um banco de dados, que pode ser acessado via queries GraphQL.

## 2. Componentes do Subgraph

Um Subgraph é definido por três arquivos principais:

*   **`subgraph.yaml` (Manifesto do Subgraph):** O arquivo de configuração central. Ele define quais contratos monitorar, quais eventos escutar, quais arquivos ABI usar e quais funções de mapeamento (`mapping handlers`) executar para cada evento.
*   **`schema.graphql` (Definição do Esquema de Dados):** Define o modelo de dados (entidades) que serão armazenadas e consultadas. Cada entidade corresponde a uma tabela no banco de dados do Subgraph.
*   **`src/mappings/*.ts` (Arquivos de Mapeamento):** Contêm a lógica em TypeScript (compilada para WebAssembly) que processa os eventos da blockchain e os transforma em entidades definidas no `schema.graphql`.

## 3. Configuração e Desenvolvimento Local

### Pré-requisitos

Antes de iniciar, certifique-se de ter:

*   **Node.js e npm/pnpm:** Para gerenciar dependências.
*   **The Graph CLI:** Instalado globalmente (`npm install -g @graphprotocol/graph-cli`).
*   **Docker e Docker Compose:** Para rodar o ambiente de desenvolvimento local (Anvil).

### Inicialização do Projeto (Scaffolding)

Para criar a estrutura básica do Subgraph, use o comando `graph init`. Este comando é interativo. Para desenvolvimento local com Anvil, você pode usar um endereço de contrato placeholder e a rede `localhost`.

```bash
# A partir da raiz do projeto scc-protocol
cd subgraph
graph init \
  --from-contract 0x0000000000000000000000000000000000000000 \
  --abi ../offchain/src/contracts/abis/VaultFactory.json \
  --network localhost \
  scc-protocol-subgraph
```

**Nota:** Após a inicialização, você precisará editar o `subgraph.yaml` para configurar corretamente a rede `localhost` e o endpoint RPC do Anvil (`http://localhost:8545`).

### Edição do `subgraph.yaml` para `localhost`

No arquivo `subgraph/subgraph.yaml`, localize a seção `dataSources` e ajuste a configuração da rede e do endpoint RPC:

```yaml
dataSources:
  - kind: ethereum/contract
    name: VaultFactory
    network: localhost # Altere de 'mainnet' para 'localhost'
    source:
      address: "0x0000000000000000000000000000000000000000" # Endereço do contrato VaultFactory no Anvil
      abi: VaultFactory
      startBlock: 0 # Comece a indexar desde o bloco 0 para desenvolvimento local
    mapping:
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Vault
      abis:
        - name: VaultFactory
          file: ./abis/VaultFactory.json
      eventHandlers:
        - event: VaultCreated(indexed address,indexed address,uint256)
          handler: handleVaultCreated
      file: ./src/vault-factory.ts
```

### Geração de Código e Construção

Após definir seu `schema.graphql` e `subgraph.yaml`, e antes de escrever os mapeamentos, você precisa gerar o código e construir o Subgraph:

```bash
# A partir da pasta 'subgraph'
pnpm install # Instala as dependências do Subgraph
graph codegen # Gera classes TypeScript a partir do schema e ABIs
graph build   # Compila o Subgraph para WebAssembly
```

### Deploy Local (para Anvil)

Para fazer o deploy do Subgraph em seu ambiente local (Anvil), você precisará de um Graph Node local. Assumindo que você tem um Graph Node rodando (ex: via Docker Compose), use:

```bash
# A partir da pasta 'subgraph'
graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001/ --output-dir build scc-protocol-subgraph
```

**Nota:** O `http://localhost:8020/` é o endpoint padrão para o Graph Node local e `http://localhost:5001/` para o IPFS local.

## 4. Melhores Práticas

*   **Otimização de Entidades:** Mantenha as entidades o mais enxutas possível. Evite armazenar dados que podem ser calculados ou derivados de outros campos.
*   **`@derivedFrom`:** Use esta diretiva no `schema.graphql` para criar campos virtuais que resolvem para uma lista de entidades relacionadas, evitando armazenar grandes arrays diretamente nas entidades.
*   **Mapeamentos Eficientes:** Otimize a lógica nos arquivos de mapeamento para minimizar operações de leitura/escrita no banco de dados do Subgraph.
*   **`startBlock`:** Para produção, defina um `startBlock` o mais alto possível (o bloco de deploy do contrato) para acelerar a sincronização inicial.
*   **Testes:** Escreva testes para seus mapeamentos para garantir que eles processem os eventos corretamente.

## 5. Consultando o Subgraph

Após o deploy e a sincronização, você pode consultar seu Subgraph localmente via GraphQL em `http://localhost:8000/subgraphs/name/scc-protocol-subgraph/graphql`.

Exemplo de Query:

```graphql
{
  vaults(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    owner
    collateralAmount
    debtAmount
    createdAt
  }
}
```