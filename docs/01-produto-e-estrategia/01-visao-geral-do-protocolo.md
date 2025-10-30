# 1. Visão Geral do Protocolo SCC

Este documento apresenta uma visão geral do **SCC (Stablecoin Cripto-Colateralizada)**, um protocolo DeFi projetado para oferecer uma stablecoin descentralizada (`SCC-USD`) atrelada ao dólar americano e super-colateralizada por criptoativos. O objetivo principal é estabelecer um ativo estável, transparente e resistente à censura, que sirva como um pilar robusto para o ecossistema de finanças descentralizadas.

## 1.1. Propósito e Princípios Fundamentais

O Protocolo SCC visa permitir que usuários depositem ativos voláteis aprovados (como ETH, wBTC) em "Vaults" para emitir (`mint`) `SCC-USD`. A segurança e a descentralização são os pilares deste projeto, garantindo que os fundos dos usuários sejam protegidos e que o protocolo opere de forma autônoma, com a governança progressivamente transferida para os detentores do token `SCC-GOV`.

**Princípios Chave:**

*   **Segurança:** Prioridade máxima na proteção dos fundos, refletida no design, implementação e processos operacionais.
*   **Descentralização:** Operação autônoma do protocolo, com governança exercida pelos detentores de `SCC-GOV`.
*   **Transparência:** Todas as operações, colaterais e o estado do sistema são publicamente verificáveis na blockchain.
*   **Escalabilidade:** Arquitetura otimizada para eficiência de gás e integração com outros protocolos e redes DeFi.

## 1.2. Componentes Principais do Protocolo

O ecossistema SCC é composto por vários módulos interconectados, cada um desempenhando um papel crucial na funcionalidade e estabilidade do protocolo:

*   **Stablecoin (`SCC-USD`):** O token ERC20 que representa o ativo estável, atrelado ao dólar americano.
*   **Token de Governança (`SCC-GOV`):** Um token ERC20 secundário utilizado para a governança do protocolo, incentivando a participação e a gestão segura.
*   **Vaults:** Contratos inteligentes onde os usuários depositam seus ativos de colateral e gerenciam suas posições de dívida em `SCC-USD`.
*   **Módulo de Oráculo:** Um sistema robusto, inicialmente integrado com Chainlink, para fornecer preços confiáveis e descentralizados dos ativos de colateral.
*   **Módulo de Liquidação:** O mecanismo essencial que garante a solvência do sistema, leiloando colateral de Vaults que se tornam sub-colateralizados.
*   **Tesouraria e Governança:** Contratos que gerenciam as taxas do protocolo e permitem que os detentores de `SCC-GOV` votem em propostas de mudança.
*   **Serviços Off-chain:** Incluem bots como o `liquidation-keeper-bot` que monitoram a blockchain e executam ações automatizadas (ex: iniciar liquidações), e o **Subgraph** que indexa dados da blockchain para consultas eficientes via GraphQL.
*   **Frontend:** Uma interface de usuário intuitiva para interagir com o protocolo, permitindo a criação de Vaults, mint de `SCC-USD`, staking de `SCC-GOV`, participação em leilões e votação em propostas de governança.

## 1.3. Estrutura do Monorepo

O projeto é organizado como um monorepo utilizando `pnpm workspaces`, o que permite gerenciar múltiplos pacotes de forma eficiente:

*   **`/contracts`:** Contém todos os smart contracts em Solidity, desenvolvidos e testados com Foundry.
*   **`/offchain`:** Abriga serviços off-chain, como bots e keepers, implementados em TypeScript/Node.js.
*   **`/frontend`:** Contém a interface de usuário para interação com o protocolo.
*   **`/subgraph`:** Define e implementa o subgraph para indexação de dados da blockchain.
*   **`/docs`:** Contém toda a documentação do projeto, incluindo arquitetura, produto e operações.

## 1.4. Ambiente de Desenvolvimento Local

O projeto utiliza Docker Compose para orquestrar um ambiente de desenvolvimento completo e integrado, que inclui:

*   **Anvil:** Uma blockchain de teste local.
*   **Postgres:** Banco de dados para o Subgraph.
*   **IPFS:** Nó IPFS para hospedar metadados do Subgraph.
*   **Graph Node:** O indexador que sincroniza com a blockchain.
*   **Keeper:** O bot off-chain para liquidações.
*   **Prometheus:** Para coleta de métricas.

A inicialização e verificação do ambiente são simplificadas através de comandos `docker compose up -d` e `pnpm test:integration`, garantindo que todos os serviços estejam configurados e funcionando corretamente.

## 1.5. Interação entre Keeper e Subgraph

É importante notar a distinção e interação entre o **Keeper** e o **Subgraph**:

*   O **Keeper** atua como um serviço de **escrita**, monitorando ativamente os Vaults na blockchain e enviando transações para o contrato `LiquidationManager` quando necessário.
*   O **Subgraph** atua como um serviço de **leitura**, escutando eventos emitidos pelos contratos e indexando esses dados para consultas eficientes via API GraphQL, utilizada pelo frontend.

Em resumo, o Keeper **age** sobre o estado da blockchain, enquanto o Subgraph **lê** e organiza esse estado para consulta.
