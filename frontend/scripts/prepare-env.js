import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define os caminhos para os arquivos necessários
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

// Caminhos para o .env
const envTemplatePath = path.join(projectRoot, 'frontend', '.env.example');
const envOutputPath = path.join(projectRoot, 'frontend', '.env');

// Caminhos para os ABIs
const abisOutputPath = path.join(projectRoot, 'frontend', 'src', 'lib', 'abis');

const artifactPath = path.join(projectRoot, 'contracts', 'broadcast', 'Deploy.s.sol', '31337', 'run-latest.json');

console.log('Reading deployment artifacts...');

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

// 2. Extrair endereços
const contractCreations = artifact.transactions.filter(tx => tx.transactionType === 'CREATE');

const getAddress = (contractName) => {
    const tx = contractCreations.find(c => c.contractName === contractName);
    if (!tx) {
        console.error(`Error: Could not find contract "${contractName}" in deployment artifacts.`);
        process.exit(1);
    }
    return tx.contractAddress;
};

// O script de deploy cria um MockERC20 para WETH em ambiente local
const wethAddress = getAddress('MockERC20');

const replacements = {
    __VAULT_FACTORY_ADDRESS__: getAddress('VaultFactory'),
    __WETH_ADDRESS__: wethAddress,
    __SCC_USD_ADDRESS__: getAddress('SCC_USD'),
    __ORACLE_MANAGER_ADDRESS__: getAddress('OracleManager'),
    __VITE_SUBGRAPH_URL__: "http://127.0.0.1:8000/subgraphs/name/scc/scc-protocol", // Hardcoded for local dev
};

// --- Gerar .env --- 
console.log('Generating frontend .env file...');
let envTemplateContent;
try {
    envTemplateContent = fs.readFileSync(envTemplatePath, 'utf8');
} catch (error) {
    console.error(`Error: Could not read template file at ${envTemplatePath}`);
    process.exit(1);
}

let outputEnvContent = envTemplateContent;
for (const [key, value] of Object.entries(replacements)) {
    const placeholder = new RegExp(key, 'g');
    outputEnvContent = outputEnvContent.replace(placeholder, value);
}

try {
    fs.writeFileSync(envOutputPath, outputEnvContent, 'utf8');
    console.log(`✅ Successfully generated ${envOutputPath}`);
} catch (error) {
    console.error(`Error: Could not write output file at ${envOutputPath}`);
    process.exit(1);
}

// --- Copiar ABIs --- 
console.log('Copying contract ABIs to frontend...');

const abisToCopy = [
    { name: 'VaultFactory', source: 'VaultFactory.sol/VaultFactory.json' },
    { name: 'Vault', source: 'Vault.sol/Vault.json' },
    { name: 'MockERC20', source: 'MockERC20.sol/MockERC20.json' },
    { name: 'SCC_USD', source: 'SCC_USD.sol/SCC_USD.json' },
    { name: 'OracleManager', source: 'OracleManager.sol/OracleManager.json' },
];

// Ensure the ABIs output directory exists
if (!fs.existsSync(abisOutputPath)) {
    fs.mkdirSync(abisOutputPath, { recursive: true });
}

abisToCopy.forEach(abi => {
    const sourcePath = path.join(projectRoot, 'contracts', 'out', abi.source);
    const destPath = path.join(abisOutputPath, `${abi.name}.json`);
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${abi.name}.json to ${abisOutputPath}`);
    } catch (error) {
        console.error(`Error copying ${abi.name}.json: ${error.message}`);
        process.exit(1);
    }
});

console.log('Frontend setup complete.');
