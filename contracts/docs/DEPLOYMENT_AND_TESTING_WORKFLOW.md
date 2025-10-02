# Fluxo de Deploy Local e Testes de Integração

**Status:** Documentado

## 1. Propósito

Este documento descreve o processo padrão para a implantação (deploy) dos smart contracts do protocolo SCC em um ambiente de blockchain local (Anvil).

A finalidade é estabelecer um fluxo de trabalho consistente para criar uma instância funcional do protocolo, cujos endereços de contrato podem ser utilizados para configurar serviços off-chain e para interação direta.

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
