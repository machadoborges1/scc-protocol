# Fluxo de Deploy e Testes

**Status:** Documentado

## 1. Visão Geral

Este documento descreve os processos padrão para a implantação (deploy) e teste dos smart contracts do protocolo SCC, cobrindo tanto o deploy via scripts do Foundry quanto a arquitetura de testes de integração off-chain com Jest.

---

## 2. Implantação via Foundry Scripts

Este método é ideal para deploys manuais em redes de teste ou para a implantação inicial do ambiente de desenvolvimento.

### Passo 1: Verificar o Ambiente

-   **Ação:** Garantir que um nó de blockchain (Anvil para desenvolvimento local, ou um nó de testnet/mainnet) está ativo e acessível.

### Passo 2: Localizar ou Criar o Script de Deploy

-   **Ação:** Inspecionar o diretório `contracts/script/` em busca de um script de deploy (ex: `Deploy.s.sol`).
-   **Detalhes:** Um script de deploy em Foundry automatiza a implantação e configuração de todos os contratos do protocolo na ordem correta de dependência.

### Passo 3: Executar o Script de Deploy

-   **Ação:** Utilizar o comando `forge script` para executar o script.
-   **Comando Exemplo:** `forge script <NomeDoScript> --rpc-url <URL_DO_RPC> --private-key <CHAVE_PRIVADA> --broadcast`
-   **Resultado:** As transações de criação dos contratos são enviadas, e o estado do blockchain é atualizado.

### Passo 4: Coletar e Utilizar os Endereços

-   **Ação:** A saída do script de deploy fornecerá os endereços dos contratos recém-criados.
-   **Utilidade:** Estes endereços são cruciais para configurar os serviços off-chain (ex: no arquivo `.env` do Keeper Bot).