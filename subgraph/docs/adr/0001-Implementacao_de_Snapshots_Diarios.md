# ADR 0001: Implementação de Snapshots Diários no Subgraph para Análise Histórica

**Status:** Proposto

**Data:** 2025-10-14

## Contexto

O frontend do protocolo necessita exibir dados históricos em forma de gráficos, como a evolução do Total Value Locked (TVL) e da taxa de colateralização média do sistema. O design atual do subgraph armazena apenas o estado mais recente dessas métricas na entidade `Protocol`, o que impossibilita a consulta de dados em séries temporais e a construção de gráficos históricos.

## Decisão

Para habilitar a análise histórica, adotaremos o padrão de "Daily Snapshots" (fotos diárias) no subgraph. Esta decisão consiste em:

1.  **Criação de Novas Entidades:** Para cada entidade principal que necessita de rastreamento histórico (ex: `Protocol`, `Vault`), será criada uma entidade de dados diários correspondente (ex: `ProtocolDayData`, `VaultDayData`).

2.  **Estrutura das Entidades de Snapshot:** Cada entidade de snapshot terá um ID composto, geralmente baseado no timestamp do dia (ex: `timestamp / 86400`), e armazenará as métricas agregadas para aquele período (TVL, volume, total de dívida, etc.).

3.  **Lógica de Agregação nos Mapeamentos:** Os handlers de eventos no subgraph (`mappings`) serão atualizados. Além de modificarem a entidade principal com o estado atual, eles também serão responsáveis por carregar ou criar o snapshot do dia corrente e atualizar suas métricas agregadas.

4.  **Consulta no Frontend:** O frontend passará a consultar essas entidades de snapshot em um intervalo de datas para obter os dados necessários para popular os componentes de gráfico.

## Consequências

### Positivas

-   **Capacidade de Análise Histórica:** Permite a visualização e análise da performance do protocolo ao longo do tempo, uma funcionalidade essencial para usuários e stakeholders.
-   **Alinhamento com Padrões de Mercado:** Esta é a abordagem padrão utilizada por grandes e bem-sucedidos protocolos DeFi (como Uniswap, Aave) para a exibição de dados em seus DApps.
-   **Performance no Frontend:** Os dados já chegam ao frontend pré-agregados por dia, simplificando a lógica de construção dos gráficos e melhorando a performance.

### Negativas

-   **Aumento da Complexidade do Subgraph:** A lógica nos mapeamentos se torna mais complexa, pois precisa lidar com a criação e atualização de entidades diárias.
-   **Maior Volume de Dados:** O subgraph armazenará um volume de dados significativamente maior, o que pode impactar os custos de infraestrutura e o tempo de sincronização em redes públicas.
-   **Esforço de Refatoração:** Exige um esforço de desenvolvimento considerável para modificar o schema e refatorar todos os mapeamentos relevantes.
