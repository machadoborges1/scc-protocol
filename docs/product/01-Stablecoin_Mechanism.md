# Documento de Mecanismos da Stablecoin (SCC-USD)

**Projeto:** Stablecoin Cripto-Colateralizada (SCC)
**Versão:** 0.1
**Status:** Rascunho

## 1. Introdução

Este documento detalha os mecanismos centrais que governam a emissão (minting), queima (burning), e a estabilidade da stablecoin SCC-USD. O sistema é projetado para garantir que toda SCC-USD em circulação seja sempre super-colateralizada, mantendo a confiança e a paridade com o dólar americano.

## 2. Conceitos Fundamentais

- **Vault:** Um smart contract individual onde um usuário deposita seu colateral e gera dívida na forma de SCC-USD. Cada Vault é um NFT (ERC721) que representa a posse da posição.

- **Taxa de Colateralização (Collateralization Ratio - CR):** A razão entre o valor do colateral depositado no Vault (em USD) e a quantidade de SCC-USD emitida (dívida).
  - `CR = (Valor do Colateral em USD) / (Dívida em SCC-USD)`

- **Taxa Mínima de Colateralização (Minimum Collateralization Ratio - MCR):** O CR mais baixo que um Vault pode ter para ser considerado solvente. Se o CR de um Vault cair abaixo do MCR, ele se torna elegível para liquidação. Este é um parâmetro de governança (ex: 150%).

- **Taxa de Estabilidade (Stability Fee):** Uma taxa de juros anualizada, paga na stablecoin do protocolo, sobre a dívida emitida. Esta taxa é um mecanismo para controlar a oferta/demanda da SCC-USD e é uma fonte de receita para o protocolo. É um parâmetro de governança.

## 3. Processo de Minting (Criação de SCC-USD)

Um usuário pode criar SCC-USD seguindo estes passos:

1.  **Criar um Vault:** O usuário interage com a fábrica de Vaults para criar seu próprio Vault, recebendo um NFT que representa sua posição.
2.  **Depositar Colateral:** O usuário deposita um ativo de colateral aprovado (ex: ETH) no seu Vault.
3.  **Emitir SCC-USD:** O usuário especifica a quantidade de SCC-USD que deseja emitir. O sistema verifica se, após a emissão, o CR do Vault permanecerá acima da Taxa Mínima de Colateralização (MCR).
4.  **Receber SCC-USD:** Se a verificação for bem-sucedida, a quantidade solicitada de SCC-USD é criada e transferida para a carteira do usuário. A dívida é registrada no Vault.

## 4. Processo de Burning (Pagamento da Dívida)

Para recuperar seu colateral, o usuário precisa pagar sua dívida:

1.  **Aprovar e Depositar SCC-USD:** O usuário aprova o contrato do Vault para gastar sua SCC-USD e chama uma função para pagar a dívida. 
2.  **Queimar SCC-USD:** O montante é transferido para o contrato e queimado (removido de circulação), e a dívida do Vault é reduzida.
3.  **Retirar Colateral:** O usuário pode agora retirar uma parte ou todo o seu colateral, desde que o CR do Vault não caia abaixo do MCR após a retirada (ou que a dívida seja totalmente paga).

## 5. Mecanismo de Liquidação

A liquidação é o processo que garante a solvência do sistema quando o valor do colateral cai.

1.  **Gatilho:** Um Vault se torna elegível para liquidação quando seu CR cai abaixo da Taxa Mínima de Colateralização (MCR). Qualquer pessoa (um "keeper" ou "liquidator bot") pode iniciar o processo de liquidação para um Vault nessas condições.
2.  **Tomada do Colateral:** O sistema assume o controle do colateral no Vault liquidado.
3.  **Cobertura da Dívida:** Uma parte do colateral é vendida para cobrir a dívida pendente em SCC-USD, mais uma taxa de penalidade de liquidação.
4.  **Leilões (Mecanismo Proposto):**
    - **Leilões (Mecanismo Implementado):** O protocolo utiliza **Leilões Holandeses (Dutch Auctions)** para vender o colateral.
    - O preço do colateral começa alto (acima do valor de mercado) e decai linearmente com o tempo.
    - O primeiro participante a chamar a função de compra (`buy`) com um preço que considera aceitável, adquire o colateral.
    - Isso cria uma demanda por SCC-USD e remove a dívida "ruim" do sistema. O valor arrecadado acima da dívida é devolvido ao dono original do Vault.
    - *Para detalhes técnicos da implementação, veja o documento `/contracts/docs/LIQUIDATION_MECHANISM_V2.md`.*
