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

---

## 3. Arquitetura de Testes de Integração (Off-chain com Jest)

Esta arquitetura, implementada no diretório `offchain/`, garante um ambiente de teste rápido, estável e atômico para os serviços que interagem com os contratos.

### 3.1. Gerenciamento do Ciclo de Vida do Anvil

-   **Problema Resolvido:** Evita a criação de múltiplos processos do Anvil, o que causa conflitos de porta e instabilidade.
-   **Implementação:**
    -   **`jest.globalSetup.ts`**: Um script que é executado **uma única vez** antes de todos os testes. Ele inicia um único processo do Anvil em background.
    -   **`jest.globalTeardown.ts`**: Executado **uma única vez** após todos os testes, garantindo que o processo do Anvil seja devidamente encerrado.

### 3.2. Isolamento e Atomicidade dos Testes

-   **Problema Resolvido:** Garante que o estado da blockchain modificado por um teste não interfira no próximo, tornando os testes independentes e determinísticos.
-   **Implementação:**
    -   **`jest.setup.ts`**: Este arquivo configura ganchos (`hooks`) globais do Jest.
    -   **`beforeEach`**: Antes de **cada** teste (`it` block), uma chamada `evm_snapshot` é feita para salvar o estado atual da blockchain.
    -   **`afterEach`**: Após **cada** teste, uma chamada `evm_revert` é feita para restaurar a blockchain instantaneamente ao estado salvo antes do teste, descartando todas as modificações.

### 3.3. Padrão de Deploy de Contratos nos Testes

-   **Problema Resolvido:** Evita erros de deploy causados por uma má interpretação do retorno das funções do `viem` e garante que as dependências de endereço entre contratos sejam resolvidas corretamente.
-   **Implementação (dentro de um gancho `beforeAll` no arquivo de teste):**
    1.  **Deploy:** Chame `testClient.deployContract()` para enviar a transação de deploy. Esta função retorna um **hash** da transação.
    2.  **Aguardar Recibo:** Chame `testClient.waitForTransactionReceipt({ hash })` para pausar a execução até que a transação seja minerada.
    3.  **Extrair Endereço:** Obtenha o endereço do contrato recém-criado a partir da propriedade `receipt.contractAddress`.
    4.  **Repetir:** Use o endereço obtido como argumento para o deploy do próximo contrato na cadeia de dependências.

Este fluxo garante que os testes de integração sejam executados em um ambiente limpo, controlado e confiável.