#!/bin/bash

# Garante que o script pare se algum comando falhar
set -e

echo "🚀 CONFIGURAÇÃO DINÂMICA DO PROTOCOLO SCC"
echo "=========================================="

# --- 1. LENDO ENDEREÇOS DO DEPLOY ---
ARTIFACT_PATH="./contracts/broadcast/Deploy.s.sol/31337/run-latest.json"

if [ ! -f "$ARTIFACT_PATH" ]; then
    echo "❌ Erro: Arquivo de artefato não encontrado em $ARTIFACT_PATH"
    echo "   Por favor, execute o script de deploy primeiro (ex: pnpm setup:local)"
    exit 1
fi

echo "🔎 Lendo endereços do artefato: $ARTIFACT_PATH"

# Extrai os endereços usando jq
VAULT_FACTORY_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "VaultFactory") | .contractAddress' $ARTIFACT_PATH)
WETH_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MockERC20") | .contractAddress' $ARTIFACT_PATH)

# Valida se os endereços foram encontrados
if [ -z "$VAULT_FACTORY_ADDRESS" ] || [ "$VAULT_FACTORY_ADDRESS" == "null" ]; then
    echo "❌ Não foi possível encontrar o endereço do VaultFactory no artefato."
    exit 1
fi
if [ -z "$WETH_ADDRESS" ] || [ "$WETH_ADDRESS" == "null" ]; then
    echo "❌ Não foi possível encontrar o endereço do WETH (MockERC20) no artefato."
    exit 1
fi

echo "✅ Endereço do VaultFactory: $VAULT_FACTORY_ADDRESS"
echo "✅ Endereço do WETH: $WETH_ADDRESS"


# --- 2. CRIANDO NOVO VAULT ---
echo ""
echo "--- 2. CRIANDO NOVO VAULT ---"
# Usamos `cast send --json` para capturar o output e extrair o blockNumber de forma confiável
TX_OUTPUT=$(cast send $VAULT_FACTORY_ADDRESS "createNewVault()" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 --json)
TX_BLOCK_NUMBER=$(echo $TX_OUTPUT | jq -r .blockNumber)

if [ -z "$TX_BLOCK_NUMBER" ]; then
    echo "❌ Erro ao criar vault. Output do cast:"
    echo $TX_OUTPUT
    exit 1
fi

echo "✅ Transação de criação de vault enviada no bloco: $TX_BLOCK_NUMBER"
echo "⏳ Aguardando a mineração do bloco..."
sleep 3


# --- 3. OBTENDO ENDEREÇO DO NOVO VAULT ---
echo ""
echo "--- 3. OBTENDO ENDEREÇO DO NOVO VAULT ---"
# Método mais robusto para pegar o endereço a partir do bloco da transação
LOG_OUTPUT=$(cast logs --from-block $TX_BLOCK_NUMBER --to-block $TX_BLOCK_NUMBER --rpc-url http://localhost:8545)

# Extrair endereço do vault do evento VaultCreated
# O endereço do dono é o topic 2, o do vault é o topic 1
NEW_VAULT=$(echo "$LOG_OUTPUT" | grep "VaultCreated" | head -1 | awk '{print $6}')

if [ -z "$NEW_VAULT" ]; then
    echo "❌ Não encontrou evento VaultCreated nos logs do bloco $TX_BLOCK_NUMBER."
    exit 1
fi

echo "✅ Novo Vault: $NEW_VAULT"


# --- 4. MINTANDO WETH PARA O DONO ---
echo ""
echo "--- 4. MINTANDO WETH PARA O DONO (100 WETH) ---"
cast send $WETH_ADDRESS "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 100000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ WETH mintado."


# --- 5. APROVANDO WETH PARA O VAULT ---
echo ""
echo "--- 5. APROVANDO WETH PARA O VAULT (10 WETH) ---"
cast send $WETH_ADDRESS "approve(address,uint256)" $NEW_VAULT 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ WETH aprovado para o vault."


# --- 6. DEPOSITANDO 10 WETH COMO COLATERAL ---
echo ""
echo "--- 6. DEPOSITANDO 10 WETH COMO COLATERAL ---"
cast send $NEW_VAULT "depositCollateral(uint256)" 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ Colateral depositado."


# --- 7. GERANDO 5000 SCC-USD DE DÍVIDA ---
echo ""
echo "--- 7. GERANDO 5000 SCC-USD DE DÍVIDA ---"
cast send $NEW_VAULT "mint(uint256)" 5000000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ Dívida gerada."


# --- 8. VERIFICANDO DADOS DO VAULT ---
echo ""
echo "--- 8. VERIFICANDO DADOS DO VAULT ---"
COLLATERAL=$(cast call $NEW_VAULT "collateralAmount()" --rpc-url http://localhost:8545)
DEBT=$(cast call $NEW_VAULT "debtAmount()" --rpc-url http://localhost:8545)
echo "💰 Colateral no vault (em wei): $COLLATERAL"
echo "💳 Dívida do vault (em wei): $DEBT"

echo ""
echo "=========================================="
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "💰 PROTOCOLO OPERACIONAL! 🚀"