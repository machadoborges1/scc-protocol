# Documento de Arquitetura: Mecanismo de Governança

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
Status: Implementado

## 1. Introdução

Este documento descreve a arquitetura do sistema de governança on-chain do protocolo SCC. O objetivo é transferir o controle administrativo do protocolo dos desenvolvedores para os detentores do token de governança (`SCC_GOV`), garantindo um processo de tomada de decisão descentralizado, transparente e seguro.

O modelo é baseado na comprovada e segura implementação de governança do OpenZeppelin.

## 2. Diagrama da Arquitetura

O fluxo de uma proposta de governança seguirá o seguinte caminho:

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

## 3. Componentes Principais

O sistema é composto por três contratos principais que trabalham em conjunto.

### 3.1. Token de Governança (`SCC_GOV`)

- **Padrão:** `ERC20Votes` (extensão do ERC20).
- **Responsabilidade:** O token `SCC_GOV` será atualizado para incluir a funcionalidade de votação. A principal característica do `ERC20Votes` é a capacidade de registrar "checkpoints" do histórico de saldos. Isso permite que o sistema verifique o poder de voto de um usuário em um bloco específico no passado (o momento em que a proposta foi criada), prevenindo que usuários comprem tokens para votar em propostas já existentes.
- **Delegação:** Os usuários precisam delegar seu poder de voto a si mesmos ou a outro endereço para que seus tokens sejam contados nas votações.

### 3.2. Timelock (`TimelockController`)

- **Padrão:** `TimelockController` do OpenZeppelin.
- **Responsabilidade:** Este contrato será o **proprietário (owner)** de todos os contratos do protocolo que possuem funções administrativas (ex: `LiquidationManager`, `VaultFactory`).
- **Fluxo:** Ele funciona como um cofre com trava de tempo. Nenhuma mudança é instantânea. Uma transação (uma proposta de governança aprovada) deve primeiro ser "enfileirada" no Timelock. Somente após um período de tempo de segurança (o "delay", ex: 2 dias), a transação pode ser "executada". Esse delay é a principal característica de segurança, pois dá à comunidade tempo para auditar a mudança e tomar medidas de emergência (como retirar fundos) se a proposta for maliciosa.

### 3.3. Contrato Governor (`SCC_Governor`)

- **Padrão:** `Governor` do OpenZeppelin (com extensões).
- **Responsabilidade:** Este é o contrato central que orquestra o processo de votação.
- **Funcionalidades:**
    - **Criação de Propostas:** Define quem pode criar propostas (geralmente, detentores de uma quantidade mínima de `SCC_GOV`).
    - **Período de Votação:** Define por quanto tempo uma proposta fica aberta para votação (ex: 3 dias).
    - **Quórum:** Define a porcentagem mínima de tokens `SCC_GOV` que precisam participar da votação para que ela seja válida.
    - **Contagem de Votos:** Conta os votos "A Favor", "Contra" e "Abstenção".
    - **Execução:** Se uma proposta é aprovada, o `SCC_Governor` tem a permissão exclusiva para enfileirar a proposta no `TimelockController`.

## 4. Ciclo de Vida de uma Proposta

1.  **Criação:** Um usuário com poder de voto suficiente cria uma proposta, especificando as ações a serem executadas (ex: chamar a função `setStartPriceMultiplier(160)` no `LiquidationManager`).
2.  **Votação:** A proposta entra em um período de votação. Os detentores de `SCC_GOV` (que delegaram seus votos) votam.
3.  **Sucesso/Falha:** Ao final do período, se o quórum foi atingido e os votos "A Favor" superam os "Contra", a proposta é bem-sucedida.
4.  **Enfileiramento (Queue):** Qualquer pessoa pode chamar a função `queue` no `SCC_Governor`, que por sua vez envia a proposta para o `TimelockController`.
5.  **Execução (Execute):** Após o término do delay de segurança do Timelock, qualquer pessoa pode chamar a função `execute` no `SCC_Governor`, que comanda o Timelock a finalmente executar a transação original da proposta.
