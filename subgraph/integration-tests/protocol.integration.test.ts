import axios from 'axios';
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import liquidationManagerAbi from '../abis/LiquidationManager.json';
import erc20Abi from '../abis/ERC20.json';

const GRAPH_API_URL = 'http://localhost:8000/subgraphs/name/scc/scc-protocol';
const STATUS_API_URL = 'http://localhost:8030/graphql'; // Endpoint de status do graph-node

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Aguarda o subgraph ficar sincronizado, consultando o endpoint de status.
 */
async function waitForSubgraphSync() {
  const query = `{ indexingStatusForCurrentVersion(subgraphName: "scc/scc-protocol") { synced chains { latestBlock { number } } } }`;

  console.log('\nWaiting for subgraph to sync...');
  for (let i = 0; i < 15; i++) { // Tenta por até 30 segundos
    try {
      const response = await axios.post(STATUS_API_URL, { query });

      if (response.data.errors) {
        console.log(`  ... GraphQL errors while checking status: ${JSON.stringify(response.data.errors)}`);
        await sleep(2000);
        continue;
      }

      const status = response.data.data.indexingStatusForCurrentVersion;
      if (status && status.synced) {
        console.log('Subgraph is synced!');
        return;
      } else {
        const chain = status.chains[0];
        console.log(`  ... still syncing (subgraph block: ${chain.latestBlock.number})`);
      }
    } catch (e) {
      // Ignora erros de conexão enquanto o graph-node talvez esteja iniciando
      console.log(`  ... waiting for graph-node to be ready (${e.message})`);
    }
    await sleep(2000);
  }
  throw new Error("Subgraph did not sync in time.");
}

describe('Integração do Subgraph com Protocolo', () => {
  // Aumenta o timeout global para os testes de integração
  jest.setTimeout(60000);

  // Garante que o subgraph está sincronizado antes de todos os testes
  beforeAll(async () => {
    await waitForSubgraphSync();
  });

  it('deve ter a entidade Protocol criada e o vault de teste indexado', async () => {
    const query = `
      query GetProtocol {
        protocol(id: "scc-protocol") {
          id
          totalVaults
        }
      }
    `;

    const response = await axios.post(GRAPH_API_URL, { query });

    expect(response.data.errors).toBeUndefined();
    expect(response.data.data.protocol).toBeDefined();
    expect(response.data.data.protocol.id).toBe('scc-protocol');
    
    // O script de deploy cria pelo menos 1 vault, então o total deve ser >= 1.
    const totalVaults = parseInt(response.data.data.protocol.totalVaults);
    expect(totalVaults).toBeGreaterThanOrEqual(1);
  });

  it('deve calcular corretamente os valores em USD e a taxa de colateralização de um vault', async () => {
    const query = `
      query GetVaultDetails {
        vaults(first: 1, where: { debtAmount_gt: "0" }) {
          id
          collateralAmount
          collateralValueUSD
          debtAmount
          debtValueUSD
          collateralizationRatio
        }
      }
    `;

    const response = await axios.post(GRAPH_API_URL, { query });
    expect(response.data.errors).toBeUndefined();
    
    const vaults = response.data.data.vaults;
    expect(vaults.length).toBeGreaterThan(0);

    const vault = vaults[0];

    const debtAmount = parseFloat(vault.debtAmount);
    const debtValueUSD = parseFloat(vault.debtValueUSD);
    const collateralValueUSD = parseFloat(vault.collateralValueUSD);
    const cr = parseFloat(vault.collateralizationRatio);

    // O valor da dívida em USD deve ser igual à quantidade de dívida para SCC-USD
    expect(debtValueUSD).toBe(debtAmount);

    // A taxa de colateralização deve ser calculada corretamente
    const expectedCr = (collateralValueUSD / debtValueUSD) * 100;
    expect(cr).toBeCloseTo(expectedCr, 2); // Usar toBeCloseTo para comparação de floats
  });

  it('deve fechar um leilão e decrementar activeAuctions quando um leilão é totalmente comprado', async () => {
    const LIQUIDATION_MANAGER_ADDRESS = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
    const SCC_USD_ADDRESS = '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0';
    // Encontra um vault em liquidação dinamicamente
    const getLiquidatingVaultQuery = `
      query GetLiquidatingVault {
        vaults(where: {status: "Liquidating"}, first: 1) {
          id
        }
      }
    `;
    const liquidatingVaultResponse = await axios.post(GRAPH_API_URL, { query: getLiquidatingVaultQuery });
    expect(liquidatingVaultResponse.data.errors).toBeUndefined();
    expect(liquidatingVaultResponse.data.data.vaults.length).toBeGreaterThan(0);
    const BOB_VAULT_ADDRESS = liquidatingVaultResponse.data.data.vaults[0].id;

    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(),
    });

    const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

    const walletClient = createWalletClient({
      account,
      chain: anvil,
      transport: http(),
    });

    // 1. Buscar o leilão ativo para o vault do Bob (iniciado pelo keeper)
    const getAuctionQuery = `
      query GetAuctionForVault($vaultId: String!) {
        vault(id: $vaultId) {
          liquidationAuction {
            id
            collateralAmount
          }
        }
        protocol(id: "scc-protocol") {
          activeAuctions
        }
      }
    `;

    // Aguarda um pouco para o keeper iniciar o leilão
    await sleep(5000);
    await waitForSubgraphSync();

    console.log('Bob vault address used in query:', BOB_VAULT_ADDRESS.toLowerCase());
    const initialResponse = await axios.post(GRAPH_API_URL, { 
      query: getAuctionQuery, 
      variables: { vaultId: BOB_VAULT_ADDRESS.toLowerCase() }
    });
    
    console.log('Initial response from subgraph:', JSON.stringify(initialResponse.data, null, 2));
    
    expect(initialResponse.data.errors).toBeUndefined();
    const initialProtocol = initialResponse.data.data.protocol;
    const auction = initialResponse.data.data.vault.liquidationAuction;
    expect(auction).toBeDefined();
    const initialActiveAuctions = parseInt(initialProtocol.activeAuctions);

    // 2. Comprar todo o colateral do leilão
    const collateralToBuy = parseEther(auction.collateralAmount);

    // Aprovar o LiquidationManager para gastar SCC_USD
    await walletClient.writeContract({
      address: SCC_USD_ADDRESS,
      abi: erc20Abi.abi,
      functionName: 'approve',
      args: [LIQUIDATION_MANAGER_ADDRESS, parseEther('10000')], // Aprova uma grande quantia
      chain: anvil,
      account,
    });

    // Comprar o colateral
    await walletClient.writeContract({
      address: LIQUIDATION_MANAGER_ADDRESS,
      abi: liquidationManagerAbi.abi,
      functionName: 'buy',
      args: [BigInt(auction.id), collateralToBuy],
      chain: anvil,
      account,
    });

    await sleep(3000); // Aguarda a indexação
    await waitForSubgraphSync();

    // 4. Verificar se o leilão foi fechado e o contador decrementado
    const finalResponse = await axios.post(GRAPH_API_URL, { 
      query: getAuctionQuery, 
      variables: { vaultId: BOB_VAULT_ADDRESS.toLowerCase() }
    });

    expect(finalResponse.data.errors).toBeUndefined();
    const finalProtocol = finalResponse.data.data.protocol;
    const finalAuction = finalResponse.data.data.vault.liquidationAuction;

    expect(finalAuction).toBeNull();
    expect(parseInt(finalProtocol.activeAuctions)).toBe(initialActiveAuctions - 1);
  });
});
