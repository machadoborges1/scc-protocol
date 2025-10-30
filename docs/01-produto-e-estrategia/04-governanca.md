# 4. Governança do Protocolo SCC

Este documento descreve a arquitetura e o funcionamento do sistema de governança on-chain do protocolo SCC. O objetivo é garantir um processo de tomada de decisão descentralizado, transparente e seguro, transferindo o controle administrativo dos desenvolvedores para os detentores do token de governança (`SCC-GOV`).

O modelo de governança é baseado nas implementações robustas e seguras da biblioteca OpenZeppelin Contracts.

## 4.1. Diagrama da Arquitetura de Governança

O fluxo de uma proposta de governança segue um ciclo bem definido, garantindo segurança e tempo para revisão pela comunidade:

```mermaid
graph TD
    A[Proponente] -- cria --> B(Proposta no SCC_Governor);
    C{Detentores de SCC_GOV} -- votam --> B;
    B -- se aprovada --> D{Fila no TimelockController};
    subgraph Período de Votação
        C
    end
    subgraph Delay de Segurança
        D
    end
    D -- após delay --> E[Execução da Proposta];
    E -- modifica --> F[Contratos do Protocolo (ex: LiquidationManager)];
```

## 4.2. Componentes Principais

O sistema de governança é composto por três contratos principais que interagem para orquestrar o processo de votação e execução de propostas.

### 4.2.1. Token de Governança (`SCC-GOV`)

*   **Padrão:** `ERC20Votes` (uma extensão do ERC20).
*   **Funcionalidade:** O `SCC-GOV` incorpora a funcionalidade de votação, permitindo registrar "checkpoints" do histórico de saldos. Isso é crucial para determinar o poder de voto de um usuário em um bloco específico (geralmente, o bloco em que a proposta foi criada), prevenindo manipulações de voto.
*   **Delegação:** Para que seus tokens sejam contados nas votações, os usuários devem delegar seu poder de voto a si mesmos ou a outro endereço.

### 4.2.2. Timelock (`TimelockController`)

*   **Padrão:** `TimelockController` do OpenZeppelin.
*   **Função:** Atua como o **proprietário (owner)** de todos os contratos do protocolo que possuem funções administrativas (ex: `LiquidationManager`, `VaultFactory`).
*   **Segurança:** Nenhuma mudança administrativa é instantânea. Uma proposta de governança aprovada deve ser "enfileirada" no `TimelockController`. Somente após um período de segurança (`minDelay`), a transação pode ser "executada". Este delay oferece à comunidade tempo para auditar a mudança e reagir a propostas maliciosas.

### 4.2.3. Contrato Governor (`SCC_Governor`)

*   **Padrão:** `Governor` do OpenZeppelin, com extensões como `GovernorCountingSimple`, `GovernorVotes`, `GovernorVotesQuorumFraction` e `GovernorTimelockControl`.
*   **Função:** É o contrato central que orquestra todo o processo de votação e interação com o `TimelockController`.
*   **Parâmetros de Configuração (definidos em `SCC_Governor.sol`):
    *   `INITIAL_VOTING_DELAY`: 1 bloco (o voto começa 1 bloco após a criação da proposta).
    *   `INITIAL_VOTING_PERIOD`: 45818 blocos (aproximadamente 1 semana, considerando um tempo de bloco de 12 segundos).
    *   `INITIAL_PROPOSAL_THRESHOLD`: 0 (qualquer detentor de `SCC-GOV` pode criar uma proposta, embora isso possa ser alterado via governança).
    *   `INITIAL_QUORUM_PERCENT`: 4% (4% do total de votos devem participar para que a votação seja válida).
*   **Funcionalidades:**
    *   **Criação de Propostas:** Gerencia a criação de propostas, que especificam as ações a serem executadas (ex: alterar um parâmetro em outro contrato).
    *   **Período de Votação:** Controla o tempo durante o qual os detentores de `SCC-GOV` podem votar.
    *   **Quórum e Contagem de Votos:** Garante que a votação atinja o quórum mínimo e contabiliza os votos "A Favor", "Contra" e "Abstenção".
    *   **Execução:** Se uma proposta é aprovada, o `SCC_Governor` tem a permissão exclusiva para enfileirar a proposta no `TimelockController` e, após o delay, comandar sua execução.

## 4.3. Ciclo de Vida de uma Proposta

1.  **Criação:** Um usuário com poder de voto suficiente cria uma proposta, detalhando as ações a serem executadas (ex: `setMinimumCollateralizationRatio(160)` no `SCC_Parameters`).
2.  **Votação:** A proposta entra em um período de votação. Os detentores de `SCC-GOV` (que delegaram seus votos) votam.
3.  **Sucesso/Falha:** Ao final do período de votação, se o quórum foi atingido e os votos "A Favor" superam os "Contra", a proposta é considerada bem-sucedida.
4.  **Enfileiramento (`queue`):** Qualquer pessoa pode chamar a função `queue` no `SCC_Governor`, que então envia a proposta para o `TimelockController`.
5.  **Execução (`execute`):** Após o término do delay de segurança do `TimelockController`, qualquer pessoa pode chamar a função `execute` no `SCC_Governor`, que instrui o `TimelockController` a executar a transação original da proposta, aplicando as mudanças no protocolo.
