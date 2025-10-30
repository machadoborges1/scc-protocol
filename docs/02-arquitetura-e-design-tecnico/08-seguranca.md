# 8. Plano de Segurança do Protocolo SCC

A segurança é a prioridade máxima e um processo contínuo no projeto SCC. Este documento descreve as práticas, ferramentas e procedimentos implementados para garantir a segurança dos fundos dos usuários e a robustez do protocolo.

## 8.1. Metodologia de Testes

O protocolo utiliza o framework Foundry para uma suíte de testes exaustiva, complementada por testes para serviços off-chain:

*   **Testes Unitários:** Verificam o comportamento isolado de cada função de contrato (Forge).
*   **Testes de Integração:** Avaliam as interações entre diferentes contratos (Forge).
*   **Testes de Forking:** Simulam a mainnet para testar interações com protocolos externos reais (Forge).
*   **Testes Baseados em Propriedades (Fuzzing):** Exploram casos extremos e inesperados para encontrar vulnerabilidades (Foundry Fuzzing Engine).
*   **Testes de Serviços Off-chain:** Garantem a robustez e a lógica de negócio dos keepers e bots, utilizando Jest para testes unitários e de integração (detalhado em `offchain/docs/TESTING_ARCHITECTURE.md`).

## 8.2. Análise de Código e Métricas

*   **Análise Estática:** Ferramentas como Slither são integradas ao CI/CD para detectar padrões de vulnerabilidade conhecidos.
*   **Cobertura de Código:** Mantém-se uma meta de cobertura de testes acima de 95%, com relatórios gerados por `forge coverage`.

## 8.3. Auditorias de Segurança

*   **Auditorias Externas:** O protocolo passará por, no mínimo, duas auditorias completas por firmas de segurança independentes e respeitáveis antes do lançamento em mainnet.
*   **Revisão por Pares (Peer Review):** Todo Pull Request exige a revisão e aprovação de pelo menos um outro membro da equipe de desenvolvimento.

## 8.4. Controle de Acesso e Gestão de Chaves (Pós-Deploy)

Para garantir a descentralização e a segurança pós-deploy, nenhuma conta de propriedade externa (EOA) terá controle direto sobre o protocolo:

*   **Propriedade dos Contratos:** Todos os contratos atualizáveis e com parâmetros críticos serão de propriedade de um contrato `TimelockController`.
*   **Administração do Timelock:** O único administrador do `TimelockController` será um `Gnosis Safe (Multisig)`.
*   **Configuração do Multisig:** A carteira multisig será configurada com um quorum de 3 de 5 signatários, compostos por membros chave da equipe e conselheiros de confiança.
*   **Gestão das Chaves:** Todos os signatários do multisig deverão usar hardware wallets e manter suas chaves de recuperação em locais seguros e offline.

## 8.5. Plano Pós-Lançamento

*   **Bug Bounty:** Lançamento de um programa de bug bounty em plataformas como Immunefi, com recompensas significativas para incentivar a descoberta e o relato responsável de vulnerabilidades.
*   **Monitoramento e Alertas:** Monitoramento 24/7 usando ferramentas como Tenderly e Forta para alertas em tempo real sobre atividades suspeitas ou anômalas nos contratos.
