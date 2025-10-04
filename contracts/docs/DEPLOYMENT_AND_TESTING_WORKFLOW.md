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

---

## 5. Nota de Segurança Crítica: Endereços Hardcoded

**Status:** Identificado

-   **Arquivo:** `script/Deploy.s.sol`
-   **Linha de Código:** `oracleManager.setAuthorization(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, true);`
-   **Descrição do Problema:** O script de deploy autoriza um endereço Ethereum hardcoded (o endereço padrão de teste do Anvil/Foundry) a usar o `OracleManager`. Esta linha foi adicionada para conveniência em testes locais.
-   **Impacto:** **Médio a Alto.** Se este script for executado em uma rede pública (mainnet ou testnet) sem modificação, uma conta de teste conhecida publicamente terá permissão para executar uma função privilegiada (consultar preços), o que representa um risco de segurança e de abuso.
-   **Ação Requerida (Correção):**
    1.  Antes de qualquer deploy em ambiente não-local, esta linha **deve ser removida**.
    2.  Para implantações reais, a autorização de endereços de keepers ou outros bots deve ser feita através de uma transação de governança separada e segura, ou o script deve ser parametrizado para aceitar os endereços corretos como argumentos, em vez de usar valores hardcoded.
