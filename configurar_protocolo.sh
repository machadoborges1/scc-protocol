#!/bin/bash

# Ensures the script stops if any command fails
set -e

echo "🚀 SCC PROTOCOL DYNAMIC CONFIGURATION"
echo "=========================================="

# --- 1. READING DEPLOY ADDRESSES ---
ARTIFACT_PATH="./contracts/broadcast/Deploy.s.sol/31337/run-latest.json"

if [ ! -f "$ARTIFACT_PATH" ]; then
    echo "❌ Error: Artifact file not found at $ARTIFACT_PATH"
    echo "   Please run the deploy script first (e.g., pnpm setup:local)"
    exit 1
fi

echo "🔎 Reading addresses from artifact: $ARTIFACT_PATH"

# Extracts addresses using jq
VAULT_FACTORY_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "VaultFactory") | .contractAddress' $ARTIFACT_PATH)
WETH_ADDRESS=$(jq -r '.transactions[] | select(.contractName == "MockERC20") | .contractAddress' $ARTIFACT_PATH)

# Validates if addresses were found
if [ -z "$VAULT_FACTORY_ADDRESS" ] || [ "$VAULT_FACTORY_ADDRESS" == "null" ]; then
    echo "❌ Could not find VaultFactory address in artifact."
    exit 1
fi
if [ -z "$WETH_ADDRESS" ] || [ "$WETH_ADDRESS" == "null" ]; then
    echo "❌ Could not find WETH (MockERC20) address in artifact."
    exit 1
fi

echo "✅ VaultFactory Address: $VAULT_FACTORY_ADDRESS"
echo "✅ WETH Address: $WETH_ADDRESS"


# --- 2. CREATING NEW VAULT ---
echo ""
echo "--- 2. CREATING NEW VAULT ---"
# We use `cast send --json` to reliably capture the output and extract the blockNumber
TX_OUTPUT=$(cast send $VAULT_FACTORY_ADDRESS "createNewVault()" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 --json)
TX_BLOCK_NUMBER=$(echo $TX_OUTPUT | jq -r .blockNumber)

if [ -z "$TX_BLOCK_NUMBER" ]; then
    echo "❌ Error creating vault. Cast output:"
    echo $TX_OUTPUT
    exit 1
fi

echo "✅ Vault creation transaction sent in block: $TX_BLOCK_NUMBER"
echo "⏳ Waiting for block to be mined..."
sleep 3


# --- 3. GETTING NEW VAULT ADDRESS ---
echo ""
echo "--- 3. GETTING NEW VAULT ADDRESS ---"
# More robust method to get the address from the transaction block
LOG_OUTPUT=$(cast logs --from-block $TX_BLOCK_NUMBER --to-block $TX_BLOCK_NUMBER --rpc-url http://localhost:8545)

# Extract vault address from VaultCreated event
# The owner's address is topic 2, the vault's is topic 1
NEW_VAULT=$(echo "$LOG_OUTPUT" | grep "VaultCreated" | head -1 | awk '{print $6}')

if [ -z "$NEW_VAULT" ]; then
    echo "❌ Did not find VaultCreated event in logs of block $TX_BLOCK_NUMBER."
    exit 1
fi

echo "✅ New Vault: $NEW_VAULT"


# --- 4. MINTING WETH FOR OWNER ---
echo ""
echo "--- 4. MINTING WETH FOR OWNER (100 WETH) ---"
cast send $WETH_ADDRESS "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 100000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ WETH minted."


# --- 5. APPROVING WETH FOR VAULT ---
echo ""
echo "--- 5. APPROVING WETH FOR VAULT (10 WETH) ---"
cast send $WETH_ADDRESS "approve(address,uint256)" $NEW_VAULT 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ WETH approved for vault."


# --- 6. DEPOSITING 10 WETH AS COLLATERAL ---
echo ""
echo "--- 6. DEPOSITING 10 WETH AS COLLATERAL ---"
cast send $NEW_VAULT "depositCollateral(uint256)" 10000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ Collateral deposited."


# --- 7. GENERATING 5000 SCC-USD DEBT ---
echo ""
echo "--- 7. GENERATING 5000 SCC-USD DEBT ---"
cast send $NEW_VAULT "mint(uint256)" 5000000000000000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545 > /dev/null
echo "✅ Debt generated."


# --- 8. VERIFYING VAULT DATA ---
echo ""
echo "--- 8. VERIFYING VAULT DATA ---"
COLLATERAL=$(cast call $NEW_VAULT "collateralAmount()" --rpc-url http://localhost:8545)
DEBT=$(cast call $NEW_VAULT "debtAmount()" --rpc-url http://localhost:8545)
echo "💰 Collateral in vault (in wei): $COLLATERAL"
echo "💳 Debt in vault (in wei): $DEBT"

echo "=========================================="
echo "🎉 CONFIGURATION COMPLETE!"
echo ""
echo "💰 PROTOCOL OPERATIONAL! 🚀"