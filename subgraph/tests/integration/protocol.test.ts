import axios from 'axios';

// Endpoint do graph-node local
const GRAPH_API_URL = 'http://localhost:8000/subgraphs/name/scc/scc-protocol';

// Função auxiliar para dar um tempo para o subgraph indexar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Integração do Subgraph com Protocolo', () => {

  // Aumenta o timeout para este conjunto de testes
  jest.setTimeout(60000);

  it('deve indexar a criação de um vault e ser consultável via GraphQL', async () => {
    // Este é um teste de ponta a ponta. O fluxo completo seria:
    // 1. (Fora do teste) Garantir que os contratos foram deployados no Anvil.
    // 2. (Fora do teste) Garantir que o subgraph foi deployado no graph-node local.
    // 3. Realizar uma transação on-chain (ex: criar um vault). (A ser implementado)
    // 4. Aguardar um pouco para o subgraph indexar.
    // 5. Fazer uma query GraphQL para verificar se o dado foi indexado corretamente.

    // Por enquanto, vamos apenas testar a conectividade e a presença da entidade Protocol.
    // A entidade Protocol é criada quando o primeiro vault é criado.

    const query = `
      query GetProtocol {
        protocol(id: "scc-protocol") {
          id
          totalVaults
        }
      }
    `;

    let response;
    try {
      // Tenta fazer a query. Pode falhar se o subgraph ainda não sincronizou.
      await sleep(5000); // Espera 5s para dar uma chance de sincronizar
      response = await axios.post(GRAPH_API_URL, { query });
    } catch (e) {
      console.error("Falha na query inicial, tentando novamente em 10s...", e.message);
      await sleep(10000); // Espera mais um pouco
      response = await axios.post(GRAPH_API_URL, { query });
    }

    // Asserções
    expect(response.data).toBeDefined();
    expect(response.data.errors).toBeUndefined();
    expect(response.data.data.protocol).toBeDefined();
    expect(response.data.data.protocol.id).toBe('scc-protocol');

    // O total de vaults pode ser 0 ou mais, dependendo do estado do ambiente de teste.
    // O importante é que a query retorne um valor.
    expect(response.data.data.protocol.totalVaults).not.toBeNull();
  });
});
