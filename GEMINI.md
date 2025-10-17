⚙️ Prompt de Inicialização e Monitoramento do SCC Protocol (Non-Interactive Health Check) - REVISADO

[Instrução para a IA]: Assuma o papel de um Engenheiro de DevOps e Web3. O objetivo é realizar um Health Check completo do sistema SCC Protocol em um ambiente de desenvolvimento local, sem interrupção. Encaminhe as etapas na ordem sequencial, simulando a execução de comandos e a análise de dados.

Fase 1: Inicialização do Ambiente, Deployment e Configuração

    Start Local EVM: Simule o comando para ligar o nó EVM local (anvil).

    Deployment: Simule a execução do script de deployment Foundry, pois é um ambiente de teste local limpo. Assuma que os endereços são gerados.

    Verificação de ABIs e Endereços: Simule a verificação cruzada (ex: Vault.json ABI vs. contrato no endereço 0x...) e confirme que os arquivos de configuração (ex: subgraph.yaml, .env do bot) foram atualizados com os novos endereços e ABIs corretas após o deployment.

    Start Subgraph Node: Simule o comando para ligar o nó local do Subgraph, usando os endereços e ABIs verificados.

    Start Keeper Bot: Simule o comando para inicializar o serviço off-chain (keeper-bot) e, em seguida, simule a exibição de 5 linhas de log que indicam que o bot está ativo, com a configuração de endereços correta, e em modo de vigilância/teste.

Fase 2: Análise de Integridade do Subgraph (Debugging)

    Diagnóstico: Após o startup, simule uma análise de integridade no Subgraph rodando em http://127.0.0.1:8000/subgraphs.

    Identificação de Problema: Assuma que a análise encontra um erro comum que pode "estragar" o código (ex: um erro de mapping que não lida corretamente com um novo evento Transfer ou um missing handler). Descreva este problema.

    Ação de Correção: Descreva a ação técnica imediata para corrigir o problema no arquivo de mapping (stablecoin.ts) ou no subgraph.yaml.

Fase 3: Simulação de Consultas de Dados (Health Check)

Após a "correção", simule a execução das 6 consultas GraphQL fornecidas.

Tarefa de Simulação de Dados: Gere os valores de retorno para cada consulta, assumindo um estado saudável e ativo do protocolo após o startup e a correção do Subgraph. Os valores devem ser realistas para um ambiente de teste local com interações simuladas:

    TotalDebtUSD: ~$1,000,000

    TotalCollateralValueUSD: ~$1,500,000

    CollateralizationRatio: ~150% (para cofres saudáveis)

    LiquidationAuctions: 1-2 leilões ativos ou recentes.

    Staking: Pelo menos 2 posições de staking.

Formato de Retorno:

    Lista de comandos e logs simulados (Fases 1 e 2).

    O resultado formatado das 6 consultas GraphQL com os dados simulados (Fase 3).