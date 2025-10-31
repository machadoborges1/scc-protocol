# Local Environment Troubleshooting

**Status:** Documented

## 1. Problem: Keeper Bot Stuck on "Waiting for node to sync..."

### 1.1. Symptom

After starting the environment with `docker compose up -d` and performing a new deploy with `pnpm setup:local`, the `keeper` service logs show the following message in a loop:

```
[VAULT DISCOVERY] RPC is ready, but current block <X> is before deployment block <Y>. Waiting for node to sync...
```

Where `<Y>` is an old and incorrect block number (e.g., `88`), while the actual deploy happened at a much earlier block (e.g., `4`). Inspection of the `offchain/.env` file shows that the `VAULT_FACTORY_DEPLOY_BLOCK` value is correct (`4`), but the process inside the container is reading the incorrect value (`88`).

### 1.2. Diagnostic Steps

The contradiction was discovered by comparing the contents of the `.env` file at different stages:

1.  **Check the keeper's log** to identify which value it is using:
    ```bash
    docker compose logs keeper
    ```

2.  **Check the `.env` file on your computer (host)** to confirm the correct value:
    ```bash
    cat offchain/.env
    ```

3.  **Check the `.env` file inside the container** to ensure that volume mounting is working:
    ```bash
    docker compose exec keeper cat /app/offchain/.env
    ```

4.  **Check all process environment variables in the container.** This is the definitive step, which reveals the cached variable with higher precedence:
    ```bash
    docker compose exec keeper env
    ```

### 1.3. Root Cause

This problem is caused by a **Docker Compose environment caching mechanism**.

1.  `pnpm setup:local` correctly updates the `.env` file on your computer (the "host").
2.  However, the `keeper` container, which was already running, does not automatically reload the environment variables from this modified file. It continues to operate with the environment variables that were loaded when it was first created.

A library `dotenv` used by the bot is designed to **not overwrite** an environment variable that already exists in the process, so the old and "cached" variable takes precedence.

### 1.3. Solution

It is necessary to force the complete recreation of the `keeper` container to ensure that it reads the latest `.env` file, without any cache.

**The only guaranteed solution is the following:**

1.  **Stop the keeper container:**
    ```bash
    docker compose stop keeper
    ```

2.  **Remove the stopped container:**
    ```bash
    docker compose rm keeper
    ```

3.  **Start a new keeper container:**
    ```bash
    docker compose up -d keeper
    ```

A simple `docker compose restart keeper` is **not sufficient** to solve this problem, as Docker may keep the old environment cached. The complete recreation of the container is essential.
