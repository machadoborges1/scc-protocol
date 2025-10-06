# Arquitetura de Testes (Off-chain com Jest)

**Status:** Revisado e Estabilizado

## 1. Visão Geral

Este documento descreve a arquitetura de testes para o projeto `offchain`, que utiliza **Jest** como framework de teste e **Anvil** como blockchain de desenvolvimento local. A arquitetura foi projetada para ser estável, rápida e para delinear uma clara separação entre testes unitários e testes de integração.

---

## 2. Gerenciamento do Ambiente de Teste (Anvil)

Um dos principais desafios enfrentados foi a instabilidade do ambiente de teste, causada por processos "zumbis" do Anvil que não eram finalizados corretamente, levando a erros de `Address already in use`.

### 2.1. Ciclo de Vida do Anvil

-   **`jest.globalSetup.ts`**: Um script executado **uma única vez** antes de todos os testes. Ele possui múltiplas responsabilidades para garantir a robustez:
    1.  **Limpeza de Porta:** Força a finalização de qualquer processo que esteja ocupando a porta 8545 para evitar conflitos.
    2.  **Inicialização do Anvil:** Inicia um único processo do Anvil em background.
    3.  **Verificação de Prontidão:** Entra em um loop de espera, verificando ativamente se o nó Anvil está pronto para aceitar conexões RPC antes de permitir que os testes comecem.

-   **`jest.globalTeardown.ts`**: Executado **uma única vez** após todos os testes, garantindo que o processo do Anvil seja devidamente encerrado.

### 2.2. Cliente Viem Compartilhado

-   **`lib/viem.ts`**: Este arquivo cria e exporta uma **única instância** do cliente `viem` (`testClient`).
-   **Regra:** **Todos** os testes (unitários e de integração) **devem** importar e utilizar esta instância compartilhada para garantir consistência.

---

## 3. Arquitetura de Testes Unitários

Os testes unitários (`src/**/*.test.ts`) são projetados para serem rápidos e independentes de estado.

-   **Isolamento:** Eles **não** devem fazer chamadas RPC reais. Todas as interações com a blockchain são simuladas (mocked).
-   **Padrão de Mocking:** O padrão adotado é o uso de `jest.spyOn(testClient, 'methodName')` para interceptar e simular as respostas das funções do `testClient`.
-   **Limpeza:** Um hook `afterEach` em cada arquivo de teste garante a chamada de `jest.restoreAllMocks()` para limpar as simulações entre os testes.

## 4. Arquitetura de Testes de Integração

Os testes de integração (`test/integration/**/*.test.ts`) são projetados para testar o fluxo completo de interação com uma blockchain real (Anvil).

-   **Gerenciamento de Estado:** Como estes testes modificam o estado da blockchain (ex: criando contratos, enviando transações), eles precisam de um mecanismo de isolamento.
-   **Implementação Local:** A lógica de isolamento é implementada **localmente** dentro de cada arquivo de teste de integração, usando os hooks do Jest:
    -   **`beforeEach`**: Antes de cada teste, uma chamada `testClient.snapshot()` é feita para salvar o estado atual da blockchain.
    -   **`afterEach`**: Após cada teste, uma chamada `testClient.revert()` é feita para restaurar a blockchain instantaneamente ao estado salvo, garantindo que cada teste comece com um ambiente limpo e idêntico.
