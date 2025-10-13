#!/bin/bash

echo "🚀 CONFIGURAÇÃO CORRETA DO PROTOCOLO SCC"
echo "========================================"

echo ""
echo "--- 1. CRIANDO NOVO VAULT ---"
cast send 0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9 "createNewVault()" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar vault"
    exit 1
fi

echo ""
echo "⏳ Aguardando criação do vault..."
sleep 5

echo ""
echo "--- 2. OBTENDO ENDEREÇO DO NOVO VAULT ---"
# Método mais robusto para pegar o endereço
LOG_OUTPUT=$(cast logs --from-block latest --rpc-url http://localhost:8545)
echo "$LOG_OUTPUT"

# Extrair endereço do vault
NEW_VAULT=$(echo "$LOG_OUTPUT" | grep "VaultCreated" | head -1 | awk '{print $7}')
if [ -z "$NEW_VAULT" ]; then
    echo "❌ Não encontrou evento VaultCreated"
    NEW_VAULT=$(echo "$LOG_OUTPUT" | grep "topic1" | head -1 | awk '{print $2}' | sed 's/000000000000000000000000//')
fi

FULL_VAULT_ADDRESS="0x${NEW_VAULT}"

if [ "$FULL_VAULT_ADDRESS" == "0x" ] || [ ${#FULL_VAULT_ADDRESS} -ne 42 ]; then
    echo "❌ Não foi possível extrair o endereço do vault"
    echo "📋 Por favor, copie manualmente o endereço do vault dos logs acima:"
    echo "   Procure por 'VaultCreated' e copie o endereço (topic 1)"
    read -p "📍 Cole o endereço do vault aqui: " FULL_VAULT_ADDRESS
fi

echo "✅ Novo Vault: $FULL_VAULT_ADDRESS"

echo ""
echo "--- 3. MINTANDO WETH PARA O DONO ---"
cast send 0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141 "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 100000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

echo ""
echo "--- 4. APROVANDO WETH PARA O VAULT ---"
cast send 0xC7f2Cf4845C6db0e1a1e91ED41Bcd0FcC1b0E141 "approve(address,uint256)" $FULL_VAULT_ADDRESS 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

echo ""
echo "--- 5. DEPOSITANDO 10 WETH COMO COLATERAL ---"
cast send $FULL_VAULT_ADDRESS "depositCollateral(uint256)" 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

echo ""
echo "--- 6. GERANDO 5000 SCC-USD DE DÍVIDA ---"
cast send $FULL_VAULT_ADDRESS "mint(uint256)" 5000000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545

echo ""
echo "--- 7. VERIFICANDO DADOS DO VAULT ---"
COLLATERAL=$(cast call $FULL_VAULT_ADDRESS "collateralAmount()" --rpc-url http://localhost:8545)
DEBT=$(cast call $FULL_VAULT_ADDRESS "debtAmount()" --rpc-url http://localhost:8545)
echo "💰 Colateral no vault: $COLLATERAL"
echo "💳 Dívida do vault: $DEBT"

echo ""
echo "========================================"
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "💰 PROTOCOLO OPERACIONAL! 🚀"
