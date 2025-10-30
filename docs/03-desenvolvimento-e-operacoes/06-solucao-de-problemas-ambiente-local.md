# Solução de Problemas do Ambiente Local

**Status:** Documentado

## 1. Problema: Keeper Bot Preso em "Waiting for node to sync..."

### 1.1. Sintoma

Após iniciar o ambiente com `docker compose up -d` e realizar um novo deploy com `pnpm setup:local`, os logs do serviço `keeper` mostram a seguinte mensagem em loop:

```
[VAULT DISCOVERY] RPC is ready, but current block <X> is before deployment block <Y>. Waiting for node to sync...
```

Onde `<Y>` é um número de bloco antigo e incorreto (ex: `88`), enquanto o deploy real aconteceu em um bloco muito anterior (ex: `4`). A inspeção do arquivo `offchain/.env` mostra que o valor de `VAULT_FACTORY_DEPLOY_BLOCK` está correto (`4`), mas o processo dentro do container está lendo o valor incorreto (`88`).

### 1.2. Passos de Diagnóstico

A contradição foi descoberta comparando o conteúdo do arquivo `.env` em diferentes estágios:

1.  **Verificar o log do keeper** para identificar qual valor ele está usando:
    ```bash
    docker compose logs keeper
    ```

2.  **Verificar o arquivo `.env` no seu computador (host)** para confirmar o valor correto:
    ```bash
    cat offchain/.env
    ```

3.  **Verificar o arquivo `.env` dentro do container** para garantir que a montagem do volume está funcionando:
    ```bash
    docker compose exec keeper cat /app/offchain/.env
    ```

4.  **Verificar todas as variáveis de ambiente do processo no container.** Este é o passo definitivo, que revela a variável em cache com maior precedência:
    ```bash
    docker compose exec keeper env
    ```

### 1.3. Causa Raiz

Este problema é causado por um **mecanismo de cache de ambiente do Docker Compose**.

1.  O `pnpm setup:local` atualiza corretamente o arquivo `.env` no seu computador (o "host").
2.  No entanto, o container do `keeper`, que já estava em execução, não recarrega automaticamente as variáveis de ambiente deste arquivo modificado. Ele continua operando com as variáveis de ambiente que foram carregadas quando ele foi criado pela primeira vez.

A biblioteca `dotenv` utilizada pelo bot é projetada para **não sobrescrever** uma variável de ambiente que já existe no processo, então a variável antiga e "cacheada" tem prioridade.

### 1.3. Solução

É necessário forçar a recriação completa do container do `keeper` para garantir que ele leia o arquivo `.env` mais recente, sem qualquer cache.

**A única solução garantida é a seguinte:**

1.  **Parar o container do keeper:**
    ```bash
    docker compose stop keeper
    ```

2.  **Remover o container parado:**
    ```bash
    docker compose rm keeper
    ```

3.  **Iniciar um novo container do keeper:**
    ```bash
    docker compose up -d keeper
    ```

Um simples `docker compose restart keeper` **não é suficiente** para resolver este problema, pois o Docker pode manter o ambiente antigo em cache. A recriação completa do container é essencial.
