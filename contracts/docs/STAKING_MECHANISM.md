# Mecanismo de Staking e Compartilhamento de Receita

**Status:** Rascunho

## 1. Introdução

Este documento detalha o mecanismo de staking para o token SCC-GOV e o processo de compartilhamento de receita do protocolo SCC. O objetivo é incentivar a participação na governança e alinhar os interesses dos detentores de SCC-GOV com o sucesso do protocolo.

## 2. Conceitos Fundamentais

- **Token de Staking:** SCC-GOV
- **Token de Recompensa:** SCC-USD (proveniente das taxas de estabilidade e outras receitas do protocolo)
- **Staker:** Usuário que deposita SCC-GOV no Staking Pool.

## 3. Lógica de Staking

### 3.1. Depósito (Stake)

Os usuários poderão depositar seus tokens SCC-GOV no contrato `StakingPool`. Ao fazer isso, eles começarão a acumular poder de voto e elegibilidade para recompensas.

### 3.2. Retirada (Unstake)

Os usuários poderão retirar seus tokens SCC-GOV do contrato `StakingPool`. Isso encerrará o acúmulo de novas recompensas e removerá seu poder de voto.

## 4. Lógica de Recompensas e Compartilhamento de Receita

### 4.1. Depósito de Recompensas

O contrato `StakingPool` receberá depósitos de `SCC-USD` (provenientes das taxas de estabilidade do protocolo) de uma entidade autorizada (ex: o `TimelockController` via governança).

### 4.2. Cálculo de Recompensas

As recompensas serão calculadas com base na quantidade de SCC-GOV em stake e no tempo que os tokens permaneceram no pool. Será utilizado um padrão de acumulador de recompensas para garantir uma distribuição justa e eficiente.

### 4.3. Resgate de Recompensas (Claim)

Os stakers poderão resgatar suas recompensas acumuladas em `SCC-USD` a qualquer momento, sem afetar seu stake de SCC-GOV.

## 5. Governança e Parâmetros

O contrato `StakingPool` será de propriedade do `TimelockController`, permitindo que a governança do protocolo (detentores de SCC-GOV) gerencie e atualize parâmetros críticos, como o endereço autorizado para depositar recompensas ou quaisquer outros parâmetros de tempo/taxa que possam ser introduzidos.
