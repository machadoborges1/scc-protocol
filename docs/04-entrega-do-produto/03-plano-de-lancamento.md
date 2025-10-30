# 3. Plano de Lançamento do Protocolo SCC

Este documento descreve o plano de lançamento do Protocolo SCC, focando nas etapas essenciais para um lançamento seguro e bem-sucedido do Produto Mínimo Viável (MVP) e nas estratégias iniciais para impulsionar a liquidez e a adoção da `SCC-USD`.

## 3.1. Fase 0: Pré-Lançamento (Conclusão do MVP e Auditorias)

Esta fase é focada na finalização do desenvolvimento do MVP e na garantia de sua segurança e robustez.

*   **Conclusão do Desenvolvimento do MVP:**
    *   Finalização de todos os contratos inteligentes (`VaultFactory`, `Vault`, `SCC_USD`, `SCC_GOV`, `OracleManager`, `LiquidationManager`, `SCC_Governor`, `TimelockController`, `StakingPool`).
    *   Implementação completa dos serviços off-chain (Keeper Bot, Subgraph).
    *   Desenvolvimento do Frontend (DApp) para todas as funcionalidades do MVP.
*   **Testes Exaustivos:**
    *   Execução completa da suíte de testes de smart contracts (unitários, integração, forking, fuzzing).
    *   Execução completa dos testes de integração dos serviços off-chain e do Subgraph.
    *   Testes de segurança adicionais (reentrância, ataques de governança simulados).
*   **Auditorias de Segurança:**
    *   Conclusão de, no mínimo, duas auditorias independentes por firmas de segurança respeitáveis.
    *   Resolução de todas as vulnerabilidades críticas e de alta severidade identificadas.
*   **Configuração de Governança:**
    *   Implantação e configuração do `TimelockController` e `SCC_Governor`.
    *   Configuração do `Gnosis Safe (Multisig)` como administrador do `Timelock`.
    *   Transferência de propriedade de todos os contratos críticos para o `Timelock`.
*   **Documentação:**
    *   Finalização de toda a documentação técnica, de produto e de negócios (conforme este plano).

## 3.2. Fase 1: Lançamento do MVP e Bootstrap de Liquidez

Esta fase foca na implantação do protocolo em mainnet e na criação de liquidez inicial para a `SCC-USD`.

*   **Implantação em Mainnet:**
    *   Deploy de todos os contratos inteligentes do MVP na rede principal (Ethereum ou L2 compatível).
    *   Implantação dos serviços off-chain (Keeper Bot, Subgraph) em infraestrutura de produção.
    *   Lançamento do Frontend (DApp) acessível ao público.
*   **Criação de Liquidez Primária:**
    *   **Pool de Liquidez na Curve Finance:** Criação de um metapool `SCC-USD`/`3CRV` na Curve Finance para garantir liquidez profunda e baixo slippage para a `SCC-USD`.
    *   **Programas de Incentivo (Liquidity Mining):** Lançamento de programas de incentivo com emissões de `SCC-GOV` para atrair provedores de liquidez para o pool da Curve.
*   **Monitoramento Ativo:**
    *   Ativação do monitoramento 24/7 com Prometheus, Grafana, Tenderly/Forta para detecção de anomalias e alertas.
*   **Programa de Bug Bounty:** Lançamento de um programa de bug bounty para incentivar a descoberta e o relato responsável de vulnerabilidades pós-lançamento.

## 3.3. Fase 2: Expansão e Utilidade (Curto a Médio Prazo)

Após a estabilização do MVP e a criação de liquidez inicial, o foco se volta para a expansão da utilidade e adoção da `SCC-USD`.

*   **Expansão de Colaterais:**
    *   Propostas de governança para adicionar suporte a novos ativos de colateral (ex: `wBTC`, Liquid Staking Tokens - `LSTs`).
    *   Integração de novos feeds de preço no `OracleManager` para os novos colaterais.
*   **Integração com o Ecossistema DeFi:**
    *   Início de conversas e submissão de propostas de governança para listar a `SCC-USD` em mercados monetários (ex: Aave, Compound, Euler).
    *   Exploração de parcerias com outros protocolos DeFi para aumentar os casos de uso da `SCC-USD`.

## 3.4. Fase 3: Evolução do Protocolo (Longo Prazo)

Esta fase visa solidificar a posição do protocolo no mercado e explorar inovações de longo prazo.

*   **Módulo de Estabilidade de Peg (PSM):** Implementação de um PSM para fortalecer a paridade da `SCC-USD` com o dólar, criando um mecanismo de arbitragem robusto.
*   **Ativos do Mundo Real (RWA):** Pesquisa e desenvolvimento para a integração de RWA como colateral, diversificando o risco e escalando a emissão de `SCC-USD`.
*   **Protocol Owned Liquidity (POL):** Utilização da receita do protocolo para adquirir e possuir permanentemente tokens LP, garantindo um nível mínimo de liquidez.
*   **Vaults de Estratégia:** Criação de contratos que implementam estratégias de yield farming automatizadas para os usuários, aumentando a utilidade da `SCC-USD` dentro do próprio ecossistema.
