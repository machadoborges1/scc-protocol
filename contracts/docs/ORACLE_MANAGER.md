# Mecanismo de Oracle Manager

**Status:** Detalhado

## 1. Introdução

Este documento descreve o design e a implementação do contrato `OracleManager.sol`, responsável por agregar e fornecer preços confiáveis e descentralizados para os ativos de colateral utilizados no protocolo SCC. O objetivo é abstrair a complexidade das fontes de dados externas e fornecer uma interface segura, padronizada e robusta para outros contratos do protocolo, como o `Vault` e o `LiquidationManager`.

## 2. Arquitetura Principal

O `OracleManager` é um contrato singular, projetado para ser o único ponto de verdade para os preços dos ativos dentro do protocolo.

- **Propriedade:** O contrato será de propriedade do `TimelockController`, garantindo que qualquer alteração em seus parâmetros críticos passe pelo processo de governança on-chain.
- **Mapeamento de Feeds:** O contrato manterá um mapeamento (`mapping`) do endereço de um ativo de colateral (ex: WETH) para o endereço do seu respectivo Price Feed da Chainlink (`AggregatorV3Interface`).
- **Padronização de Decimais:** Para garantir consistência em todo o protocolo, todos os preços retornados pelo `OracleManager` serão padronizados para **18 casas decimais**. O contrato lidará internamente com a conversão dos diferentes decimais que os feeds da Chainlink possam ter.

## 3. Funções Principais

### `getPrice(address _asset) external view returns (uint256)`

Esta é a principal função de leitura, usada por outros contratos para obter o preço de um ativo.

- **Lógica:**
    1. Busca o endereço do feed da Chainlink para o `_asset` solicitado.
    2. Chama a função `latestRoundData()` no feed.
    3. **Executa as validações de segurança (ver seção 4).**
    4. Converte o preço retornado para 18 casas decimais, se necessário.
    5. Retorna o preço padronizado.

### `setPriceFeed(address _asset, address _feed) external onlyOwner`

Função administrativa para a governança gerenciar os feeds de preço.

- **Lógica:**
    1. Requer que o chamador seja o `owner` (o `TimelockController`).
    2. Adiciona ou atualiza o endereço do feed (`_feed`) para o ativo (`_asset`) no mapeamento.
    3. Emite um evento `PriceFeedUpdated` para transparência off-chain.

## 4. Mecanismos de Segurança Críticos

A implementação deve seguir estritamente as seguintes práticas de segurança para mitigar os riscos associados a oráculos.

### 4.1. Verificação de Preço Desatualizado (Staleness Check)

- **Mecanismo:** A função `getPrice` **deve** verificar o timestamp da última atualização do preço.
- **Implementação:**
    - O contrato terá uma variável imutável `STALE_PRICE_TIMEOUT` (ex: 24 horas).
    - Ao chamar `latestRoundData()`, o valor `updatedAt` retornado será comparado com `block.timestamp`.
    - Se `block.timestamp - updatedAt > STALE_PRICE_TIMEOUT`, a transação **deve** reverter com um erro customizado: `StalePrice(asset, updatedAt)`.

### 4.2. Validação de Preço Inválido

- **Mecanismo:** A função `getPrice` **deve** validar o preço retornado pelo oráculo.
- **Implementação:**
    - O preço (`answer`) retornado por `latestRoundData()` deve ser estritamente maior que zero.
    - Se `answer <= 0`, a transação **deve** reverter com um erro customizado: `InvalidPrice(asset, answer)`.

### 4.3. Controle de Acesso

- **Mecanismo:** Apenas a governança pode alterar os endereços dos feeds.
- **Implementação:** A função `setPriceFeed` deve usar o modificador `onlyOwner` do OpenZeppelin.

## 5. Eventos

### `event PriceFeedUpdated(address indexed asset, address indexed feed)`

Emitido sempre que um feed de preço é adicionado ou atualizado, permitindo o monitoramento off-chain das atividades da governança.

## 6. Futuras Iterações

- **Fallback Oracles:** Uma futura versão poderá incluir um mecanismo de fallback. Se o feed primário da Chainlink estiver desatualizado, o contrato poderia tentar consultar um oráculo secundário (ex: um TWAP de um AMM) antes de reverter.
- **Validação de Desvio:** Poderia ser implementada uma verificação que impede atualizações de preço que se desviem mais do que uma certa porcentagem do preço anterior em um curto período, como uma proteção contra manipulação ou falhas do oráculo.