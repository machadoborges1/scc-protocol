const fs = require('fs');
const path = require('path');

// Define os caminhos para os arquivos necessários.
// O script assume que está rodando de dentro do diretório 'subgraph'.
const projectRoot = path.join(__dirname, '..');
const templatePath = path.join(__dirname, 'subgraph.template.yaml');
const outputPath = path.join(__dirname, 'subgraph.yaml');
const artifactPath = path.join(projectRoot, 'contracts', 'broadcast', 'Deploy.s.sol', '31337', 'run-latest.json');

console.log('Lendo artefatos do deploy...');

// Tenta ler e parsear o arquivo de artefatos JSON.
let artifact;
try {
    const artifactContent = fs.readFileSync(artifactPath, 'utf8');
    artifact = JSON.parse(artifactContent);
} catch (error) {
    console.error(`Erro: Não foi possível ler ou parsear o arquivo de artefatos em ${artifactPath}`);
    console.error('Certifique-se de que os contratos foram deployados com `forge script`.');
    console.error(error);
    process.exit(1);
}

console.log('Extraindo endereços dos contratos e bloco inicial...');

// Filtra as transações para pegar apenas as de criação de contrato.
const contractCreations = artifact.transactions.filter(tx => tx.transactionType === 'CREATE');

/**
 * Encontra o endereço de um contrato pelo seu nome.
 * @param {string} contractName O nome do contrato.
 * @returns {string} O endereço do contrato.
 */
const getAddress = (contractName) => {
    const tx = contractCreations.find(c => c.contractName === contractName);
    if (!tx) {
        console.error(`Erro: Não foi possível encontrar o contrato "${contractName}" nos artefatos de deploy.`);
        process.exit(1);
    }
    return tx.contractAddress;
};

/**
 * Encontra o bloco de deploy do VaultFactory, que será o startBlock para todos.
 * @returns {number} O número do bloco.
 */
const getStartBlock = () => {
    const vaultFactoryTx = artifact.transactions.find(tx => tx.contractName === 'VaultFactory' && tx.transactionType === 'CREATE');
    if (!vaultFactoryTx) {
        console.error('Erro: Não foi possível encontrar a transação de deploy do VaultFactory.');
        process.exit(1);
    }
    const receipt = artifact.receipts.find(r => r.transactionHash === vaultFactoryTx.hash);
    if (!receipt) {
        console.error('Erro: Não foi possível encontrar o recibo de deploy do VaultFactory.');
        process.exit(1);
    }
    // O blockNumber é uma string hexadecimal (ex: "0x5"), então convertemos para número.
    return parseInt(receipt.blockNumber, 16);
};

// Obtém todos os valores necessários.
const addresses = {
    VAULT_FACTORY_ADDRESS: getAddress('VaultFactory'),
    ORACLE_MANAGER_ADDRESS: getAddress('OracleManager'),
    LIQUIDATION_MANAGER_ADDRESS: getAddress('LiquidationManager'),
    STAKING_POOL_ADDRESS: getAddress('StakingPool'),
    SCC_GOVERNOR_ADDRESS: getAddress('SCC_Governor'),
};
const startBlock = getStartBlock();

console.log(`  -> Bloco Inicial: ${startBlock}`);
console.log(`  -> VaultFactory: ${addresses.VAULT_FACTORY_ADDRESS}`);
console.log(`  -> LiquidationManager: ${addresses.LIQUIDATION_MANAGER_ADDRESS}`);
console.log(`  -> StakingPool: ${addresses.STAKING_POOL_ADDRESS}`);
console.log(`  -> SCC_Governor: ${addresses.SCC_GOVERNOR_ADDRESS}`);

// Lê o conteúdo do arquivo de template.
let templateContent;
try {
    templateContent = fs.readFileSync(templatePath, 'utf8');
} catch (error) {
    console.error(`Erro: Não foi possível ler o arquivo de template em ${templatePath}`);
    console.error(error);
    process.exit(1);
}

console.log('Substituindo placeholders no template...');

// Substitui o placeholder do bloco inicial.
let outputContent = templateContent.replace(/{{START_BLOCK}}/g, startBlock);

// Itera sobre os endereços e substitui cada placeholder correspondente.
for (const [key, value] of Object.entries(addresses)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    outputContent = outputContent.replace(placeholder, value);
}

// Escreve o novo arquivo subgraph.yaml.
try {
    fs.writeFileSync(outputPath, outputContent, 'utf8');
    console.log(`✅ Arquivo ${outputPath} gerado com sucesso!`);
} catch (error) {
    console.error(`Erro: Não foi possível escrever o arquivo de saída em ${outputPath}`);
    console.error(error);
    process.exit(1);
}
