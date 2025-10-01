# Documento de Visão e Escopo do Projeto

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
Status: Ativo

## 1. Visão Geral

Este documento descreve o projeto de uma stablecoin descentralizada, a **SCC-USD**, atrelada ao dólar americano e super-colateralizada por ativos cripto. O objetivo é criar um ativo estável, resistente à censura e transparente, que sirva como pilar fundamental para um ecossistema DeFi.

O sistema permitirá que usuários depositem ativos voláteis aprovados (como ETH, wBTC) em "Vaults" para emitir (mint) SCC-USD. O sistema será governado por um token secundário, o **SCC-GOV**, que incentivará a participação e a gestão segura do protocolo.

## 2. Princípios Fundamentais

- **Segurança:** A segurança dos fundos dos usuários é a prioridade máxima. O design do protocolo, a implementação e os processos operacionais refletirão isso.
- **Descentralização:** O protocolo será projetado para operar de forma autônoma, com a governança transferida para os detentores do token SCC-GOV ao longo do tempo.
- **Transparência:** Todas as operações, colaterais e o estado do sistema serão verificáveis publicamente na blockchain.
- **Escalabilidade:** A arquitetura visará a eficiência de gás e a capacidade de se integrar com outras redes e protocolos DeFi.

## 3. Componentes Principais

1.  **Stablecoin (SCC-USD):** O token ERC20 que representa o ativo estável.
2.  **Token de Governança (SCC-GOV):** O token ERC20 usado para governança do protocolo e como incentivo.
3.  **Vaults:** Contratos inteligentes onde os usuários depositam seu colateral e gerenciam suas dívidas em SCC-USD.
4.  **Módulo de Oráculo:** Um sistema para alimentar preços confiáveis e descentralizados dos ativos de colateral. Inicialmente, integrará com o Chainlink.
5.  **Módulo de Liquidação:** O mecanismo que garante a solvência do sistema, leiloando colateral de Vaults que se tornam sub-colateralizados.
6.  **Tesouraria e Governança:** Contratos que gerenciam as taxas do protocolo e permitem que os detentores de SCC-GOV votem em propostas de mudança.

## 4. Próximos Passos da Documentação

A seguir, detalharemos cada um dos componentes nos seguintes documentos:

- `01-Stablecoin_Mechanism.md`: Detalhes sobre mint, burn, taxas de estabilidade e o processo de liquidação.
- `02-Tokenomics.md`: Detalhes sobre o token SCC-GOV, sua distribuição e utilidade.
- `03-System_Architecture.md`: Diagramas e descrição da arquitetura técnica on-chain e off-chain.
- `04-Security_Plan.md`: Abordagem para testes, auditoria, e gestão de chaves.
- `05-DeFi_Strategies.md`: Planejamento para as primeiras estratégias de yield usando SCC-USD.
