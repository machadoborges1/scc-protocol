# ADR-0001: Estabilização do Ambiente de Teste Off-chain

**Status:** Aceito

## Contexto

A suíte de testes do projeto `offchain` sofria de instabilidade crônica e falhas não determinísticas. Os erros mais comuns eram `ResourceNotFoundRpcError` e `Block could not be found`, geralmente ocorrendo durante a execução de testes que interagiam com o cliente `viem`.

O diagnóstico inicial apontou para várias causas, como condições de corrida na inicialização do Anvil, configuração do Jest e inconsistências na criação de clientes `viem` nos arquivos de teste.

A investigação final, habilitando os logs do processo Anvil, revelou a causa raiz: um erro `Error: Address already in use (os error 98)`. Processos "zumbis" do Anvil, de execuções de teste anteriores que não foram terminadas corretamente, continuavam ocupando a porta 8545. Isso impedia que a nova instância do Anvil para a suíte de testes atual iniciasse corretamente, resultando em falhas de conexão RPC em cascata.

## Decisão

Para resolver a instabilidade de forma definitiva, foi implementada uma solução em três partes, focada em robustez e no isolamento correto dos diferentes tipos de teste:

1.  **Limpeza Preventiva da Porta:** O script `jest.globalSetup.ts` foi modificado para, antes de iniciar um novo processo Anvil, executar um comando (`lsof -t -i:8545 | xargs kill -9`) que identifica e força a finalização de qualquer processo que esteja ocupando a porta 8545. Isso garante que cada execução de teste comece com um ambiente limpo.

2.  **Refatoração e Isolamento dos Testes Unitários:** Todos os testes unitários (nos arquivos `*.test.ts` dentro de `src/`) foram refatorados para serem completamente independentes de estado. A nova arquitetura segue dois princípios:
    *   **Cliente Compartilhado:** Todos os testes agora importam e utilizam a mesma instância do `testClient` de `lib/viem.ts`.
    *   **Mocking com `jest.spyOn`:** As chamadas à blockchain (`multicall`, `readContract`, etc.) são interceptadas e simuladas usando `jest.spyOn()`. Isso impede que os testes unitários façam chamadas RPC reais, tornando-os mais rápidos e robustos.

3.  **Isolamento do Teste de Integração:** A lógica para gerenciar o estado da blockchain (`evm_snapshot` e `evm_revert`) foi removida da configuração global do Jest (`jest.setup.ts`) e movida para dentro do único arquivo que realmente necessita dela: `test/integration/liquidation.test.ts`. Isso contém a complexidade do gerenciamento de estado apenas onde é estritamente necessário.

## Consequências

### Positivas

*   **Estabilidade:** A suíte de testes agora é estável e determinística.
*   **Clareza:** A separação entre testes unitários (rápidos, com mocks) и testes de integração (lentos, com estado) está mais clara e reforçada.
*   **Depuração Facilitada:** Erros futuros serão mais provavelmente relacionados à lógica de negócio do que a problemas de ambiente.

### Negativas

*   **Dependência de SO:** A solução de limpeza de porta usa comandos `lsof` e `kill`, que são padrão em ambientes baseados em Unix (Linux, macOS). Desenvolvedores em Windows precisarão usar WSL ou ter implementações equivalentes desses comandos em seu PATH.
