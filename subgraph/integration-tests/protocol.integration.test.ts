import axios from 'axios';

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
});
