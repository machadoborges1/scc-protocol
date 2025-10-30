# Subgraph do Protocolo SCC

Este Subgraph é responsável por indexar os eventos e estados dos contratos inteligentes do Protocolo SCC, transformando os dados brutos da blockchain em uma API GraphQL facilmente consultável. Ele serve como a principal fonte de dados para o frontend (DApp) e para análises.

## Visão Geral

O Subgraph monitora os contratos principais do protocolo SCC (como `VaultFactory`, `SCC_USD`, `LiquidationManager`, etc.). Ao escutar eventos emitidos por esses contratos, ele persiste os dados relevantes em um banco de dados, que pode ser acessado via queries GraphQL. Isso permite que o frontend exiba informações atualizadas e históricas do protocolo de forma eficiente.

## Componentes Principais

Um Subgraph é definido por três arquivos principais:

*   **`subgraph.yaml` (Manifesto):** Configura quais contratos monitorar, quais eventos escutar e quais funções de mapeamento executar.
*   **`schema.graphql` (Esquema de Dados):** Define o modelo de dados (entidades) que serão armazenadas e consultadas via GraphQL.
*   **`src/mappings/*.ts` (Arquivos de Mapeamento):** Contêm a lógica em TypeScript que processa os eventos da blockchain e os transforma em entidades definidas no `schema.graphql`.

## Desenvolvimento Local

Para configurar e rodar o Subgraph localmente:

1.  **Pré-requisitos:** Node.js, pnpm, The Graph CLI e Docker/Docker Compose (para Anvil).
2.  **Instalar dependências:**
    ```bash
    pnpm install
    ```
3.  **Gerar código e construir:**
    ```bash
    graph codegen
    graph build
    ```
4.  **Deploy local (com Graph Node local):**
    ```bash
    graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001/ --output-dir build scc-protocol-subgraph
    ```

## Consultando o Subgraph

Após o deploy e a sincronização, você pode consultar seu Subgraph localmente via GraphQL em `http://localhost:8000/subgraphs/name/scc-protocol-subgraph/graphql`.

## Aprofunde-se na Documentação

Para uma análise detalhada da arquitetura do Subgraph, seu modelo de dados, melhores práticas e fluxo de desenvolvimento, consulte a [documentação completa do projeto](../docs/README.md).
