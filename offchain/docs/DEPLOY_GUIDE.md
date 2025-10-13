# Guia de Deploy e Execução (Local com Docker)

**Status:** Ativo

## 1. Visão Geral

Este guia descreve como executar o ambiente de desenvolvimento e teste completo do bot `offchain` usando Docker Compose. O ambiente é totalmente autocontido e inclui a blockchain local (Anvil), o bot (Keeper) e um servidor de monitoramento (Prometheus).

## 2. Pré-requisitos

-   [Docker](https://www.docker.com/get-started/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## 3. Configuração

O bot `offchain` depende de um arquivo `.env` para obter os endereços dos contratos e outras configurações. Este arquivo é gerado automaticamente a partir do resultado de um deploy bem-sucedido.

O fluxo de trabalho para configurar o ambiente local é:

1.  **Implantar os Contratos:** Primeiro, execute o deploy dos contratos na raiz do projeto. Isso cria um arquivo com os endereços da nova implantação.
    ```bash
    # Na raiz do projeto
    pnpm deploy:contracts
    ```

2.  **Preparar o Ambiente Off-chain:** Em seguida, execute o novo script `prepare:env` para popular o arquivo `offchain/.env` com os endereços recém-implantados.
    ```bash
    # Na raiz do projeto
    pnpm --filter=@scc/offchain prepare:env
    ```

Após esses passos, o bot estará configurado e pronto para ser executado com os endereços corretos.

## 4. Executando o Ambiente

Com o Docker em execução, navegue até a raiz do projeto e execute o seguinte comando:

```bash
docker-compose up --build
```

-   `--build`: Força a reconstrução da imagem do bot se houver mudanças no código.

Este comando irá:
1.  Construir a imagem Docker para o serviço `keeper`.
2.  Iniciar os três serviços: `anvil`, `keeper` e `prometheus`.
3.  Exibir os logs de todos os serviços no seu terminal.

## 5. Verificando os Serviços

Após a inicialização, você pode verificar se cada serviço está funcionando:

-   **Keeper Bot:** Nos logs do `docker-compose`, você verá as mensagens do bot, como "TransactionManager initialized..." e "Watching for new vaults...".

-   **Métricas (Prometheus Endpoint):** Abra seu navegador e acesse [http://localhost:9091/metrics](http://localhost:9091/metrics). Você verá uma longa lista de métricas expostas pelo bot, como `keeper_eth_balance` e `keeper_vaults_discovered_total`.

-   **Servidor Prometheus:** Abra seu navegador e acesse [http://localhost:9090](http://localhost:9090). Este é o painel do Prometheus. Para verificar se ele está coletando dados do bot, vá para `Status -> Targets`. Você deve ver o endpoint `keeper-bot` com o estado "UP".

## 6. Visualizando os Logs

Se você iniciou o ambiente em modo "detached" (`-d`), pode visualizar os logs de um serviço específico a qualquer momento.

```bash
# Ver logs do bot
docker-compose logs -f keeper

# Ver logs da blockchain local
docker-compose logs -f anvil
```

## 7. Parando o Ambiente

Para parar todos os serviços e remover os containers, pressione `Ctrl+C` no terminal onde o `docker-compose` está rodando, ou execute o seguinte comando em um novo terminal (a partir da raiz do projeto):

```bash
docker-compose down
```
