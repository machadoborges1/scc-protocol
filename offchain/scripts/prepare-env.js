const fs = require('fs');
const path = require('path');

// Define os caminhos para os arquivos necessários
const projectRoot = path.join(__dirname, '../..');
const templatePath = path.join(projectRoot, 'offchain', '.env.example');
const outputPath = path.join(projectRoot, 'offchain', '.env');
const artifactPath = path.join(projectRoot, 'contracts', 'broadcast', 'Deploy.s.sol', '31337', 'run-latest.json');

console.log('Reading deployment artifacts for offchain .env...');

// 1. Ler e parsear o arquivo de artefatos
let artifact;
try {
    const artifactContent = fs.readFileSync(artifactPath, 'utf8');
    artifact = JSON.parse(artifactContent);
} catch (error) {
    console.error(`Error: Could not read or parse artifact file at ${artifactPath}`);
    console.error('Ensure contracts have been deployed with `forge script`.');
    process.exit(1);
}

// 2. Extrair endereços e bloco inicial
const contractCreations = artifact.transactions.filter(tx => tx.transactionType === 'CREATE');

const getAddress = (contractName) => {
    const tx = contractCreations.find(c => c.contractName === contractName);
    if (!tx) {
        console.error(`Error: Could not find contract "${contractName}" in deployment artifacts.`);
        process.exit(1);
    }
    return tx.contractAddress;
};

const getTestVaultAddress = () => {
    const tx = artifact.transactions.find(tx => tx.function === 'createNewVault()');
    if (!tx) return ''; // Pode não existir em todos os deploys
    const receipt = artifact.receipts.find(r => r.transactionHash === tx.hash);
    if (!receipt) return '';
    const vaultCreatedLog = receipt.logs.find(log => log.topics[0] === '0x5d9c31ffa0fecffd7cf379989a3c7af252f0335e0d2a1320b55245912c781f53');
    if (!vaultCreatedLog) return '';
    // O endereço está no topic[1], os primeiros 12 bytes são zeros
    return '0x' + vaultCreatedLog.topics[1].slice(26);
}

const getStartBlock = () => {
    const vaultFactoryTx = contractCreations.find(tx => tx.contractName === 'VaultFactory');
    if (!vaultFactoryTx) {
        console.error('Error: Could not find VaultFactory deployment transaction.');
        process.exit(1);
    }
    const receipt = artifact.receipts.find(r => r.transactionHash === vaultFactoryTx.hash);
    if (!receipt) {
        console.error('Error: Could not find VaultFactory deployment receipt.');
        process.exit(1);
    }
    return parseInt(receipt.blockNumber, 16);
};

// O script de deploy agora cria um MockERC20 para WETH em ambiente local
const wethAddress = getAddress('MockERC20');
const priceFeedAddress = getAddress('MockV3Aggregator');

const replacements = {
    __VAULT_FACTORY_ADDRESS__: getAddress('VaultFactory'),
    __LIQUIDATION_MANAGER_ADDRESS__: getAddress('LiquidationManager'),
    __ORACLE_MANAGER_ADDRESS__: getAddress('OracleManager'),
    __SCC_USD_ADDRESS__: getAddress('SCC_USD'),
    __WETH_ADDRESS__: wethAddress,
    __PRICE_FEED_ADDRESS__: priceFeedAddress,
    __SCC_GOV_ADDRESS__: getAddress('SCC_GOV'),
    __STAKING_POOL_ADDRESS__: getAddress('StakingPool'),
    __TIMELOCK_CONTROLLER_ADDRESS__: getAddress('TimelockController'),
    __SCC_GOVERNOR_ADDRESS__: getAddress('SCC_Governor'),
    __TEST_VAULT_ADDRESS__: getTestVaultAddress(),
    __VAULT_FACTORY_DEPLOY_BLOCK__: getStartBlock(),
};

// 3. Ler o template .env.example
let templateContent;
try {
    templateContent = fs.readFileSync(templatePath, 'utf8');
} catch (error) {
    console.error(`Error: Could not read template file at ${templatePath}`);
    process.exit(1);
}

// 4. Substituir os placeholders
let outputContent = templateContent;
for (const [key, value] of Object.entries(replacements)) {
    const placeholder = new RegExp(key, 'g');
    outputContent = outputContent.replace(placeholder, value);
}

// 5. Escrever o novo arquivo .env
try {
    fs.writeFileSync(outputPath, outputContent, 'utf8');
    console.log(`✅ Successfully generated ${outputPath}`);
} catch (error) {
    console.error(`Error: Could not write output file at ${outputPath}`);
    process.exit(1);
}
