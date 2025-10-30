# 3. Tokenomics (SCC-GOV)

Este documento detalha a tokenomics do **SCC-GOV**, o token de governança e utilidade do protocolo SCC. O `SCC-GOV` é projetado para facilitar a governança descentralizada, alinhar incentivos entre os participantes do ecossistema e capturar o valor gerado pelo protocolo.

## 3.1. Utilidade do Token

O `SCC-GOV` possui as seguintes utilidades principais:

1.  **Governança:**
    *   Detentores de `SCC-GOV` podem votar em propostas que alteram parâmetros críticos do sistema, como a Taxa Mínima de Colateralização (MCR), Taxa de Estabilidade, adição de novos tipos de colateral e alocação de fundos da tesouraria.
    *   O poder de voto é proporcional à quantidade de tokens em staking ou delegados.

2.  **Staking e Compartilhamento de Receita (Revenue Share):**
    *   Usuários podem fazer staking de seus `SCC-GOV` no contrato `StakingPool` para ganhar recompensas em `SCC-USD`.
    *   Uma porção das Taxas de Estabilidade e outras receitas geradas pelo protocolo (ex: taxas de liquidação) é distribuída aos stakers de `SCC-GOV`, incentivando a retenção do token e a participação ativa na governança.

3.  **Incentivos de Ecossistema (Liquidity Mining):**
    *   `SCC-GOV` será utilizado para recompensar usuários que contribuem para a saúde e liquidez do protocolo, como provedores de liquidez para pools de `SCC-USD` em AMMs.

## 3.2. Implementação do Staking (`StakingPool.sol`)

O contrato `StakingPool.sol` gerencia o processo de staking de `SCC-GOV` e a distribuição de recompensas em `SCC-USD`.

### Variáveis de Estado Chave:

*   `stakingToken`: O token `SCC-GOV` que os usuários depositam.
*   `rewardsToken`: O token `SCC-USD` distribuído como recompensa.
*   `staked[address]`: Mapeia o endereço do staker para a quantidade de `SCC-GOV` que ele depositou.
*   `rewardPerTokenStored`: Recompensas totais por token acumuladas desde o início do contrato.
*   `rewardsDistribution`: Endereço autorizado para distribuir recompensas (geralmente um contrato de governança ou timelock).
*   `rewardRate`: Taxa na qual as recompensas são distribuídas por segundo.
*   `lastUpdateTime`: Última vez que as recompensas foram atualizadas.
*   `periodFinish`: Timestamp de quando o período de recompensa atual termina.

### Funções Principais:

*   **`stake(uint256 amount)`:** Permite que um usuário deposite `SCC-GOV` no pool. O `amount` é transferido do usuário para o contrato, e o `staked` do usuário é atualizado. A função `updateReward` é chamada para calcular as recompensas pendentes antes de qualquer alteração no stake.
*   **`unstake(uint256 amount)`:** Permite que um usuário retire seus `SCC-GOV` do pool. O `amount` é transferido de volta para o usuário, e o `staked` é atualizado. Também chama `updateReward`.
*   **`getReward()`:** Permite que um usuário reivindique suas recompensas acumuladas em `SCC-USD`. A função `earned(msg.sender)` calcula a recompensa, que é então transferida para o usuário. `userRewardPerTokenPaid` é atualizado para evitar que o usuário reivindique a mesma recompensa novamente.
*   **`notifyRewardAmount(uint256 reward, uint256 duration)`:** Função chamada pelo `rewardsDistribution` para adicionar novas recompensas ao pool. Ela ajusta `rewardRate` e `periodFinish` com base na nova recompensa e duração, garantindo uma distribuição contínua.
*   **`earned(address account)`:** Função `view` que calcula a quantidade de recompensas que uma conta ganhou, mas ainda não reivindicou.

## 3.3. Fornecimento Total e Alocação

**Fornecimento Total (Max Supply):** 100.000.000 SCC-GOV

A alocação do `SCC-GOV` é distribuída com foco no controle comunitário a longo prazo:

| Categoria                 | Porcentagem | Quantidade      | Detalhes de Vesting/Liberação                               | Propósito                                                 |
| :------------------------ | :---------- | :-------------- | :---------------------------------------------------------- | :-------------------------------------------------------- |
| **Tesouraria da Comunidade**  | 40%         | 40.000.000      | Liberados gradualmente ao longo de 4 anos. Controlado pela governança. | Financiar o desenvolvimento futuro, grants, parcerias.     |
| **Incentivos (Liquidity Mining)** | 30%         | 30.000.000      | Distribuídos via programas de incentivo ao longo de 3-4 anos. | Bootstrap de liquidez e adoção inicial do protocolo.      |
| **Equipe e Conselheiros**     | 20%         | 20.000.000      | Cliff (bloqueio total) de 1 ano, seguido por vesting linear de 3 anos.       | Incentivo de longo prazo para a equipe principal.         |
| **Investidores (Seed/Strategic)** | 10%         | 10.000.000      | Cliff de 6 meses, seguido por vesting linear de 2 anos.     | Capital inicial para desenvolvimento e auditorias.        |
| **Total**                 | **100%**    | **100.000.000** |                                                             |                                                           |

## 3.4. Cronograma de Emissão

O fornecimento circulante de `SCC-GOV` é gerenciado para evitar pressão vendedora excessiva. A maior parte da emissão inicial virá dos programas de Liquidity Mining. O cronograma de liberação de tokens (vesting) para cada categoria ao longo de 48 meses é detalhado na tabela abaixo:

| Mês | Tesouraria (40M) | Incentivos (30M) | Equipe (20M) | Investidores (10M) | Total Liberado | Fornecimento Circulante |
| :-- | :--- | :--- | :--- | :--- | :--- | :--- |
| 0   | 0    | 2.5M | 0    | 0    | 2.5M | 2.5M |
| 6   | 5M   | 6.25M| 0    | 2.08M| 13.33M | 15.83M |
| 12  | 10M  | 10M  | 0    | 4.17M| 24.17M | 26.67M |
| 18  | 15M  | 13.75M| 3.33M| 6.25M| 38.33M | 40.83M |
| 24  | 20M  | 17.5M| 6.67M| 8.33M| 52.5M  | 55M |
| 30  | 25M  | 21.25M| 10M  | 10M  | 66.25M | 68.75M |
| 36  | 30M  | 25M  | 13.33M| 10M  | 78.33M | 80.83M |
| 42  | 35M  | 28.75M| 16.67M| 10M  | 90.42M | 92.92M |
| 48  | 40M  | 30M  | 20M  | 10M  | 100M   | 100M |

**Notas:**
*   **Incentivos:** Uma parte é liberada no lançamento para o bootstrap inicial, com o restante distribuído ao longo de 42 meses.
*   **Investidores:** Cliff de 6 meses, seguido de vesting linear por 18 meses (total de 24 meses).
*   **Equipe:** Cliff de 12 meses, seguido de vesting linear por 24 meses (total de 36 meses).
*   **Tesouraria:** Vesting linear ao longo de 48 meses.
