# Fluxo de Deploy Local e Testes de Integração

**Status:** Documentado

## 1. Propósito

Este documento descreve o processo e a finalidade de implantar (fazer o deploy) os smart contracts do protocolo em um ambiente de blockchain local (Anvil). O objetivo principal não é testar os contratos de forma isolada (isso é feito pelos testes unitários com `forge test`), mas sim criar um **ambiente de integração funcional**.

Este ambiente é um pré-requisito para:

1.  **Desenvolvimento de Serviços Off-chain:** Permitir que serviços como o Keeper Bot possam ser desenvolvidos e testados contra uma versão real e funcional dos contratos.
2.  **Testes de Integração de Ponta a Ponta:** Validar a interação correta entre os componentes on-chain (contratos) e off-chain (bots, scripts, etc.).
3.  **Simulação de Cenários Reais:** Criar estados específicos no blockchain (ex: um Vault prestes a ser liquidado) para testar a reação dos serviços off-chain em um ambiente controlado.
4.  **Depuração (Debugging):** Facilitar a investigação de problemas que ocorrem na interação entre os diferentes componentes do sistema.

## 2. Plano de Execução

O processo de deploy local segue os seguintes passos:

### Passo 1: Verificar o Ambiente

-   **Ação:** Garantir que o nó local Anvil está ativo e acessível, geralmente gerenciado via `docker-compose`.

### Passo 2: Localizar ou Criar o Script de Deploy

-   **Ação:** Inspecionar o diretório `contracts/script/` em busca de um script de deploy (ex: `Deploy.s.sol`).
-   **Detalhes:** Um script de deploy em Foundry é um contrato Solidity que automatiza a implantação e configuração de todos os contratos do protocolo na ordem correta de dependência.

### Passo 3: Executar o Script de Deploy

-   **Ação:** Utilizar o comando `forge script` para executar o script encontrado ou criado.
-   **Comando Exemplo:** `forge script <NomeDoScript> --rpc-url http://localhost:8545 --private-key <CHAVE_PRIVADA_ANVIL> --broadcast`
-   **Resultado:** As transações de criação dos contratos são enviadas ao Anvil, e o estado do blockchain local é atualizado.

### Passo 4: Coletar e Utilizar os Endereços

-   **Ação:** A saída do script de deploy fornecerá os endereços dos contratos recém-criados.
-   **Utilidade:** Estes endereços são cruciais e serão usados para configurar os serviços off-chain (ex: no arquivo `.env` do Keeper Bot), informando-os onde encontrar os contratos com os quais precisam interagir.
