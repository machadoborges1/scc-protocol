# Arquitetura e Requisitos do Ambiente de Produção

Este documento descreve os componentes e a arquitetura necessários para implantar e operar o protocolo SCC em um ambiente de produção (mainnet).

## Visão Geral

A transição de um ambiente de desenvolvimento local para produção envolve a substituição de componentes simulados (como Anvil) por serviços reais e a adição de camadas robustas de segurança, monitoramento e infraestrutura.

---

### 1. Acesso ao Blockchain (Nós)

Em produção, o acesso à rede blockchain é feito através de provedores de nós como serviço (Node-as-a-Service).

-   **Serviços Recomendados:**
    -   [Infura](https://infura.io/)
    -   [Alchemy](https://www.alchemy.com/)
    -   [QuickNode](https://www.quicknode.com/)
-   **Função:** Fornecem a interface RPC (`RPC_URL`) para a rede principal (ex: Ethereum Mainnet). Eles garantem acesso confiável e escalável, eliminando a necessidade de manter um nó próprio.
-   **Observação:** Projetos com alto volume de transações exigirão um plano pago para garantir a performance e a estabilidade da conexão.

### 2. Infraestrutura para Serviços Off-chain

O Keeper Bot e outros possíveis serviços de backend precisam rodar em servidores com alta disponibilidade.

-   **Provedor de Cloud:**
    -   **Plataformas:** AWS (Amazon Web Services), GCP (Google Cloud Platform), Azure.
-   **Hospedagem de Serviços (Keeper Bot):**
    -   **Opção 1 (Simples):** Uma máquina virtual (ex: **AWS EC2**) com Docker, para replicar o ambiente do `docker-compose` de forma mais robusta.
    -   **Opção 2 (Avançada):** Um serviço de orquestração de contêineres como **Kubernetes (EKS na AWS)** ou **AWS Fargate**. Esta opção oferece resiliência superior, reiniciando automaticamente os serviços em caso de falha.

### 3. Segurança

Esta é a área mais crítica em um ambiente de produção.

-   **Auditoria de Smart Contracts:**
    -   **Ação:** **OBRIGATÓRIO**. Antes do deploy, os contratos devem ser auditados por uma ou mais firmas de segurança independentes e respeitadas (ex: Trail of Bits, ConsenSys Diligence, OpenZeppelin).
-   **Gerenciamento de Chaves (Secrets Management):**
    -   **Chave do Deployer/Administrador:** Deve ser uma carteira multi-assinatura (**Gnosis Safe**). Isso distribui o controle e evita um ponto único de falha.
    -   **Chave do Keeper Bot:** A chave privada do bot, que assina transações de manutenção (como liquidações), precisa ser uma "hot wallet". Ela **NUNCA** deve ser armazenada em texto plano.
        -   **Solução:** Utilizar um cofre de segredos como **AWS Secrets Manager** ou **HashiCorp Vault**. O bot recebe permissão para acessar a chave dinamicamente, sem que ela seja exposta.
-   **Monitoramento de Segurança On-chain:**
    -   **Serviços:** **Forta**, **OpenZeppelin Defender**.
    -   **Função:** Monitoram a atividade dos seus contratos em tempo real e disparam alertas sobre transações suspeitas que possam indicar um ataque.

### 4. Monitoramento e Operações (DevOps)

É crucial saber o que está acontecendo com o sistema em todos os momentos.

-   **Logging e Alertas:**
    -   **Ferramentas:** Datadog, Grafana, PagerDuty, Slack.
    -   **Função:** Centralizar logs dos serviços off-chain e criar alertas automáticos para eventos críticos, como:
        -   O Keeper Bot está inativo.
        -   O saldo de gás da carteira do Keeper está baixo.
        -   Ocorreu uma taxa de erro elevada.
-   **Dashboards de Dados:**
    -   **Ferramentas:** **Dune Analytics**, **The Graph**.
    -   **Função:** Criar painéis para visualizar a saúde do protocolo (TVL, índices de colateralização, número de usuários, etc.).

### 5. Frontend (Interface do Usuário)

-   **Hospedagem:**
    -   **Serviços:** **Vercel**, **Netlify**, **AWS S3 + CloudFront**.
    -   **Função:** Publicam a aplicação web (React, Vue, etc.) que os usuários finais utilizarão para interagir com o protocolo.
