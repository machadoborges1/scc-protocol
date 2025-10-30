# Smart Contracts do Protocolo SCC

Este diretório contém todos os smart contracts em Solidity que formam o núcleo do Protocolo SCC, desenvolvidos utilizando o framework Foundry.

## Visão Geral

Os contratos inteligentes gerenciam a lógica central do protocolo, incluindo:

*   **Vaults:** Criação e gerenciamento de posições de dívida colateralizada.
*   **Stablecoin (`SCC-USD`):** Emissão e queima da stablecoin.
*   **Token de Governança (`SCC-GOV`):** Habilita a governança descentralizada.
*   **Oráculos:** Gerenciamento de feeds de preço para ativos de colateral.
*   **Liquidações:** Mecanismo de Leilão Holandês para Vaults sub-colateralizados.
*   **Staking:** Pool para staking de `SCC-GOV` e distribuição de recompensas.
*   **Governança:** Contratos para votação e execução de propostas.

## Ferramentas Utilizadas (Foundry)

*   **Forge:** Framework de testes e desenvolvimento.
*   **Cast:** Ferramenta de linha de comando para interagir com EVM.
*   **Anvil:** Nó Ethereum local para desenvolvimento.

## Comandos Essenciais

*   **Compilar contratos:**
    ```bash
    forge build
    ```
*   **Executar testes:**
    ```bash
    forge test
    ```
*   **Deploy local (via monorepo):**
    ```bash
    pnpm deploy:contracts
    ```

## Aprofunde-se na Documentação

Para uma análise detalhada de cada contrato, sua arquitetura, mecanismos de segurança e fluxo de deploy, consulte a [documentação completa do projeto](../docs/README.md).