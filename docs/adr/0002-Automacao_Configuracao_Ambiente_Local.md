# ADR 0002: Automação da Configuração de Ambiente Local

**Status:** Aceito

**Contexto:**

O ecossistema do projeto é composto por múltiplos serviços (`contracts`, `subgraph`, `offchain`) que dependem de um estado coeso, principalmente os endereços dos contratos implantados. Em um ambiente de desenvolvimento local com Anvil, cada reinicialização da blockchain gera novos endereços para todos os contratos.

O processo anterior exigia que os desenvolvedores atualizassem manualmente os arquivos de configuração (`subgraph.yaml`, `offchain/.env`) após cada deploy, copiando e colando os novos endereços a partir do log do terminal. Este processo manual era lento, propenso a erros (como colar o endereço errado ou esquecer de atualizar um serviço) e criava uma experiência de desenvolvimento frustrante, como foi identificado durante as sessões de depuração.

**Decisão:**

Decidimos automatizar a atualização dos arquivos de configuração para todos os serviços que dependem dos endereços dos contratos. Esta decisão será implementada através de scripts de "preparação" dedicados em cada workspace relevante.

1.  **`@scc/subgraph`**: O script `prepare:subgraph` (já existente) lerá os artefatos de deploy e gerará o `subgraph.yaml` final a partir de um `subgraph.template.yaml`.

2.  **`@scc/offchain`**: Um novo script, `prepare:env`, será criado. Ele lerá os mesmos artefatos de deploy e gerará o arquivo `.env` local a partir do template `.env.example`, preenchendo as variáveis de endereço dos contratos.

O fluxo de trabalho de desenvolvimento local será padronizado para:
1.  Executar o deploy dos contratos (`pnpm deploy:contracts`).
2.  Executar os scripts de preparação (`pnpm prepare:subgraph`, `pnpm prepare:offchain`).
3.  Iniciar os serviços (`docker compose up`).

**Consequências:**

*   **Positivas:**
    *   **Redução de Erros:** Elimina a classe de erros causada por configurações de ambiente dessincronizadas.
    *   **Melhora na Experiência do Desenvolvedor (DX):** O processo de setup se torna mais rápido, determinístico e menos frustrante.
    *   **Fonte Única da Verdade:** O arquivo de artefatos do deploy (`run-latest.json`) se torna a fonte única da verdade para a configuração de todo o sistema local.

*   **Negativas:**
    *   **Pequena Complexidade Adicional:** Adiciona novos scripts ao projeto que precisam ser mantidos.
    *   **Dependência da Ferramenta:** O fluxo se torna mais dependente da estrutura do `run-latest.json` gerado pelo Foundry.

Consideramos que os benefícios em produtividade e estabilidade superam em muito as desvantagens.