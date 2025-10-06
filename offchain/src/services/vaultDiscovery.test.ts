import { createTestClient, http, parseAbiItem, Address } from 'viem';
import { anvil } from 'viem/chains';
import { VaultDiscoveryService } from './vaultDiscovery';
import { VaultQueue } from '../queue';
import { config } from '../config';

jest.setTimeout(30000);

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock da fila para espionar seus métodos
const mockQueue = {
  add: jest.fn(),
  addMany: jest.fn(),
  getNext: jest.fn(),
  isEmpty: jest.fn(() => true),
  size: jest.fn(() => 0),
} as unknown as VaultQueue;

describe('VaultDiscoveryService', () => {
  let service: VaultDiscoveryService;
  let testClient: any; // Usamos 'any' para facilitar o mock de respostas
  let onLogsCallback: (logs: any[]) => void = () => {}; // Declarar aqui para ser acessível nos testes

  const mockFactoryAddress = '0x0000000000000000000000000000000000000001';

  let unwatch: jest.Mock; // Declare unwatch here

  beforeEach(() => {
    jest.clearAllMocks();

    // Usamos um cliente de teste do viem para simular a interação com a blockchain
    testClient = createTestClient({
      chain: anvil,
      mode: 'anvil',
      transport: http(),
    });

    // Mock para watchContractEvent
    testClient.getLogs = jest.fn().mockResolvedValue([]); // Add this line
    testClient.watchContractEvent = jest.fn(({ onLogs }) => {
      onLogsCallback = (logs) => {
        onLogs(logs);
      };
      unwatch = jest.fn(); // Store the unwatch function
      return unwatch; // Retorna a função unwatch
    });

    service = new VaultDiscoveryService(testClient, mockQueue, mockFactoryAddress);
  });

  afterEach(async () => {
    service.stop(); // Ensure the service's internal stop is called
    if (unwatch) {
      unwatch(); // Call the unwatch function to stop the listener
    }
    await new Promise(resolve => setImmediate(resolve)); // Allow any pending async operations to complete
    jest.clearAllMocks();
  });

  it('should discover historic vaults and add them to the queue', async () => {
    // Arrange: Simula a resposta do getLogs
    const historicVaultAddress = '0x1234567890123456789012345678901234567890';
    const filter = parseAbiItem('event VaultCreated(address indexed owner, address indexed vaultAddress)');
    
    // O cliente de teste não tem um mock direto para getLogs, então mockamos a função no cliente
    testClient.getLogs = jest.fn().mockResolvedValue([
      {
        args: { vaultAddress: historicVaultAddress },
      },
    ]);

    // Act
    await service.start();

    // Assert
    expect(testClient.getLogs).toHaveBeenCalledWith({
      address: mockFactoryAddress,
      event: filter,
      fromBlock: BigInt(config.VAULT_FACTORY_DEPLOY_BLOCK),
    });
    expect(mockQueue.addMany).toHaveBeenCalledWith([historicVaultAddress]);
  });

  it('should watch for new vaults and add them to the queue', async () => {
    // Arrange
    const newVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

    // Act
    await service.start(); // Inicia o serviço e a escuta

    // Simula a chegada de um novo log de evento
    onLogsCallback([
      {
        args: { vaultAddress: newVaultAddress },
      },
    ]);

    // Assert
    expect(testClient.watchContractEvent).toHaveBeenCalled();
    expect(mockQueue.add).toHaveBeenCalledWith(newVaultAddress);
  });
});