import { testClient } from '../../lib/viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import { Abi, parseEther, decodeEventLog } from 'viem';

// Função auxiliar para carregar artefatos de contrato
function loadContractArtifact(contractName: string) {
  const filePath = path.join(__dirname, '../../../contracts/out', `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artifact for ${contractName} not found at ${filePath}`);
  }
  const artifact = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return { abi: artifact.abi as Abi, bytecode: artifact.bytecode.object as `0x${string}` };
}

// Carregar artefatos
const { abi: vaultAbi } = loadContractArtifact('Vault');
const { abi: vaultFactoryAbi, bytecode: vaultFactoryBytecode } = loadContractArtifact('VaultFactory');
const { abi: liquidationManagerAbi, bytecode: liquidationManagerBytecode } = loadContractArtifact('LiquidationManager');
const { abi: mockErc20Abi, bytecode: mockErc20Bytecode } = loadContractArtifact('MockERC20');
const { abi: mockOracleAbi, bytecode: mockOracleBytecode } = loadContractArtifact('MockV3Aggregator');
const { abi: sccUsdAbi, bytecode: sccUsdBytecode } = loadContractArtifact('SCC_USD');
const { abi: oracleManagerAbi, bytecode: oracleManagerBytecode } = loadContractArtifact('OracleManager');

const deployerAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const keeperAccount = privateKeyToAccount('0x59c6995e998f97a5a004496c12fed1a4f4557b9acde441bf3653aef665cd2109');

describe('Liquidation Logic', () => {
  let snapshotId: `0x${string}`;

  beforeEach(async () => {
    snapshotId = await testClient.snapshot();
  });

  afterEach(async () => {
    await testClient.revert({ id: snapshotId });
  });

  let vaultFactoryAddress: `0x${string}`;
  let liquidationManagerAddress: `0x${string}`;
  let mockCollateralAddress: `0x${string}`;
  let sccUsdAddress: `0x${string}`;
  let oracleManagerAddress: `0x${string}`;
  let priceFeedAddress: `0x${string}`;

  beforeAll(async () => {
    const deploy = async (abi: Abi, bytecode: `0x${string}`, args: any[]) => {
      const hash = await testClient.deployContract({ abi, bytecode, account: deployerAccount, args });
      const receipt = await testClient.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) {
        throw new Error(`Deployment failed: No contract address found for hash ${hash}`);
      }
      return receipt.contractAddress;
    };

    await testClient.setBalance({ address: keeperAccount.address, value: parseEther('100') });

    mockCollateralAddress = await deploy(mockErc20Abi, mockErc20Bytecode, ['Wrapped Ether', 'WETH']);
    sccUsdAddress = await deploy(sccUsdAbi, sccUsdBytecode, [deployerAccount.address]);
    priceFeedAddress = await deploy(mockOracleAbi, mockOracleBytecode, [8, 2000 * 10**8]);
    oracleManagerAddress = await deploy(oracleManagerAbi, oracleManagerBytecode, [3600]);
    liquidationManagerAddress = await deploy(liquidationManagerAbi, liquidationManagerBytecode, [deployerAccount.address, oracleManagerAddress, sccUsdAddress]);
    vaultFactoryAddress = await deploy(vaultFactoryAbi, vaultFactoryBytecode, [deployerAccount.address, mockCollateralAddress, sccUsdAddress, oracleManagerAddress, liquidationManagerAddress]);

    const authorizerRole = await testClient.readContract({ address: oracleManagerAddress, abi: oracleManagerAbi, functionName: 'AUTHORIZER_ROLE', args: [] });
    await testClient.writeContract({ address: oracleManagerAddress, abi: oracleManagerAbi, functionName: 'grantRole', args: [authorizerRole, vaultFactoryAddress], account: deployerAccount });

    const minterGranterRole = await testClient.readContract({ address: sccUsdAddress, abi: sccUsdAbi, functionName: 'MINTER_GRANTER_ROLE', args: [] });
    await testClient.writeContract({ address: sccUsdAddress, abi: sccUsdAbi, functionName: 'grantRole', args: [minterGranterRole, vaultFactoryAddress], account: deployerAccount });

    await testClient.writeContract({ address: oracleManagerAddress, abi: oracleManagerAbi, functionName: 'setPriceFeed', args: [mockCollateralAddress, priceFeedAddress], account: deployerAccount });

    await testClient.writeContract({ address: oracleManagerAddress, abi: oracleManagerAbi, functionName: 'setAuthorization', args: [liquidationManagerAddress, true], account: deployerAccount });

  }, 60000);

  const getVaultAddressFromReceipt = (receipt: any) => {
    for (const log of receipt.logs) {
        try {
            const event = decodeEventLog({ abi: vaultFactoryAbi, ...log });
            if (event.eventName === 'VaultCreated') {
                return (event.args as { vaultAddress: `0x${string}` }).vaultAddress;
            }
        } catch {}
    }
    throw new Error('VaultCreated event not found in transaction receipt');
  };

  it('should liquidate an undercollateralized position', async () => {
    const createVaultHash = await testClient.writeContract({ address: vaultFactoryAddress, abi: vaultFactoryAbi, functionName: 'createNewVault', account: deployerAccount, args: [] });
    const receipt = await testClient.waitForTransactionReceipt({ hash: createVaultHash });
    const vaultAddress = getVaultAddressFromReceipt(receipt);

    await testClient.writeContract({ address: mockCollateralAddress, abi: mockErc20Abi, functionName: 'mint', args: [deployerAccount.address, parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: mockCollateralAddress, abi: mockErc20Abi, functionName: 'approve', args: [vaultAddress, parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: vaultAddress, abi: vaultAbi, functionName: 'depositCollateral', args: [parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: vaultAddress, abi: vaultAbi, functionName: 'mint', args: [parseEther('10000')], account: deployerAccount });

    await testClient.writeContract({ address: priceFeedAddress, abi: mockOracleAbi, functionName: 'updateAnswer', args: [1499 * 10**8], account: deployerAccount });

    const liquidationTx = await testClient.writeContract({ address: liquidationManagerAddress, abi: liquidationManagerAbi, functionName: 'startAuction', args: [vaultAddress], account: keeperAccount });
    await testClient.waitForTransactionReceipt({ hash: liquidationTx });

    const auctionId = await testClient.readContract({ address: liquidationManagerAddress, abi: liquidationManagerAbi, functionName: 'vaultToAuctionId', args: [vaultAddress] });
    const auction = await testClient.readContract({ address: liquidationManagerAddress, abi: liquidationManagerAbi, functionName: 'auctions', args: [auctionId] }) as [bigint, bigint, `0x${string}`, bigint, bigint];
    
    // O getter do mapping retorna um array de valores, não um objeto.
    // O primeiro valor (índice 0) é collateralAmount, o segundo (índice 1) é debtToCover, etc.
    // Para verificar se está ativo, podemos checar se o startTime (índice 3) é maior que zero.
    const startTime = auction[3];
    expect(startTime).toBeGreaterThan(0);
  });

  it('should not liquidate a healthy position', async () => {
    const createVaultHash = await testClient.writeContract({ address: vaultFactoryAddress, abi: vaultFactoryAbi, functionName: 'createNewVault', account: deployerAccount, args: [] });
    const receipt = await testClient.waitForTransactionReceipt({ hash: createVaultHash });
    const vaultAddress = getVaultAddressFromReceipt(receipt);

    await testClient.writeContract({ address: mockCollateralAddress, abi: mockErc20Abi, functionName: 'mint', args: [deployerAccount.address, parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: mockCollateralAddress, abi: mockErc20Abi, functionName: 'approve', args: [vaultAddress, parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: vaultAddress, abi: vaultAbi, functionName: 'depositCollateral', args: [parseEther('10')], account: deployerAccount });
    await testClient.writeContract({ address: vaultAddress, abi: vaultAbi, functionName: 'mint', args: [parseEther('10000')], account: deployerAccount });

    await expect(testClient.writeContract({ address: liquidationManagerAddress, abi: liquidationManagerAbi, functionName: 'startAuction', args: [vaultAddress], account: keeperAccount })).rejects.toThrow();
  });
});
