# Mecanismo de Oracle Manager

**Status:** Rascunho

## 1. Introdução

Este documento descreve o design e a implementação do contrato `OracleManager.sol`, responsável por agregar e fornecer preços confiáveis e descentralizados para os ativos de colateral utilizados no protocolo SCC. O objetivo é abstrair a complexidade das fontes de dados externas e fornecer uma interface segura e padronizada para outros contratos do protocolo.

## 2. Fontes de Dados (Chainlink)

O `OracleManager` inicialmente se integrará com os Price Feeds da Chainlink, que são a solução padrão da indústria para dados de preços on-chain. Cada par de ativos (ex: ETH/USD, BTC/USD) terá um feed de preço Chainlink correspondente.

## 3. Funcionalidades Principais

### 3.1. Obtenção de Preços

Contratos autorizados poderão consultar o `OracleManager` para obter o preço mais recente de um ativo específico. O preço será retornado em um formato padronizado (ex: com 8 casas decimais).

### 3.2. Gerenciamento de Feeds de Preço

O `OracleManager` permitirá que a governança adicione, remova ou atualize os endereços dos feeds de preço da Chainlink para diferentes ativos. Isso garante flexibilidade e capacidade de adaptação a novas fontes ou mudanças nas existentes.

### 3.3. Validação e Fallback (Futuro)

Em futuras iterações, o `OracleManager` poderá incorporar lógica de validação de preços (ex: verificar desvios significativos) ou mecanismos de fallback para fontes de dados secundárias, aumentando a robustez.

## 4. Controle de Acesso

O `OracleManager` será de propriedade do `TimelockController`, permitindo que a governança gerencie os feeds de preço. A função de obtenção de preços será acessível publicamente ou por contratos autorizados (ex: `Vault`, `LiquidationManager`).
