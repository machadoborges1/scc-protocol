# Documento de Tokenomics (SCC-GOV)

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
**Status:** Ativo

## 1. Introdução

Este documento descreve a tokenomics do **SCC-GOV**, o token de governança e utilidade do protocolo SCC. O SCC-GOV foi projetado para facilitar a governança descentralizada, alinhar incentivos entre os participantes do ecossistema e capturar o valor gerado pelo protocolo.

## 2. Utilidade do Token

O SCC-GOV terá as seguintes utilidades principais:

1.  **Governança:**
    - Detentores de SCC-GOV poderão votar em propostas que alteram parâmetros do sistema.
    - Exemplos de parâmetros governáveis: Taxa Mínima de Colateralização (MCR), Taxa de Estabilidade, adição de novos tipos de colateral, alocação de fundos da tesouraria.
    - O poder de voto será proporcional à quantidade de tokens em staking ou delegados.

2.  **Staking e Compartilhamento de Receita (Revenue Share):**
    - Usuários poderão fazer staking de seus SCC-GOV em um módulo específico.
    - Uma porção das Taxas de Estabilidade e outras receitas geradas pelo protocolo (ex: taxas de liquidação) será distribuída aos stakers de SCC-GOV. Isso cria um incentivo direto para manter o token e participar da governança segura do protocolo.

3.  **Incentivos de Ecossistema (Liquidity Mining):**
    - SCC-GOV será usado para recompensar usuários que realizam ações benéficas para o protocolo, como:
        - Fornecer liquidez para pools de SCC-USD em AMMs (ex: Curve, Balancer).
        - Manter Vaults abertos e saudáveis (potencialmente, como um bônus de uso).

## 3. Fornecimento Total e Alocação

**Fornecimento Total (Max Supply):** 100,000,000 SCC-GOV

A alocação será distribuída da seguinte forma, com foco em controle comunitário a longo prazo:

| Categoria                 | Porcentagem | Quantidade      | Detalhes de Vesting/Liberação                               | Propósito                                                 |
| ------------------------- | ----------- | --------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| **Tesouraria da Comunidade**  | 40%         | 40,000,000      | Liberados gradualmente ao longo de 4 anos. Controlado pela governança. | Financiar o desenvolvimento futuro, grants, parcerias.     |
| **Incentivos (Liquidity Mining)** | 30%         | 30,000,000      | Distribuídos via programas de incentivo ao longo de 3-4 anos. | Bootstrap de liquidez e adoção inicial do protocolo.      |
| **Equipe e Conselheiros**     | 20%         | 20,000,000      | Cliff (bloqueio total) de 1 ano, seguido por vesting linear de 3 anos.       | Incentivo de longo prazo para a equipe principal.         |
| **Investidores (Seed/Strategic)** | 10%         | 10,000,000      | Cliff de 6 meses, seguido por vesting linear de 2 anos.     | Capital inicial para desenvolvimento e auditorias.        |
| **Total**                 | **100%**    | **100,000,000** |                                                             |                                                           |

## 4. Cronograma de Emissão

O fornecimento circulante de SCC-GOV será cuidadosamente gerenciado para evitar pressão vendedora excessiva no início do projeto. A maior parte da emissão inicial virá dos programas de Liquidity Mining, projetados para bootstrap a liquidez e o uso da stablecoin SCC-USD.

A tabela abaixo detalha o cronograma de liberação de tokens (vesting) para cada categoria ao longo de 48 meses.

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
- **Incentivos:** Uma parte é liberada no lançamento para o bootstrap inicial, com o restante distribuído ao longo de 42 meses.
- **Investidores:** Cliff de 6 meses, seguido de vesting linear por 18 meses (total de 24 meses).
- **Equipe:** Cliff de 12 meses, seguido de vesting linear por 24 meses (total de 36 meses).
- **Tesouraria:** Vesting linear ao longo de 48 meses.
