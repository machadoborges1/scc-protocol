import { parseAbiItem, Address } from 'viem';
import { testClient } from '../../lib/viem';
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
  let onLogsCallback: (logs: any[]) => void = () => {};
  const mockFactoryAddress = '0x0000000000000000000000000000000000000001' as Address;
  let unwatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock para watchContractEvent no cliente compartilhado
    unwatch = jest.fn();
    jest.spyOn(testClient, 'watchContractEvent').mockImplementation(({ onLogs }: any) => {
      onLogsCallback = (logs) => {
        onLogs(logs);
      };
      return unwatch;
    });

    service = new VaultDiscoveryService(testClient, mockQueue, mockFactoryAddress);
  });

  afterEach(async () => {
    service.stop();
    if (unwatch) {
      unwatch();
    }
    jest.restoreAllMocks();
    await new Promise(resolve => setImmediate(resolve));
  });

  it('should discover historic vaults and add them to the queue', async () => {
    // Arrange
    const historicVaultAddress = '0x1234567890123456789012345678901234567890';
    const filter = parseAbiItem('event VaultCreated(address indexed owner, address indexed vaultAddress)');
    
    const getLogsSpy = jest.spyOn(testClient, 'getLogs').mockResolvedValue([
      {
        args: { vaultAddress: historicVaultAddress },
      },
    ] as any);

    // Act
    await service.start();

    // Assert
    expect(getLogsSpy).toHaveBeenCalledWith({
      address: mockFactoryAddress,
      event: filter,
      fromBlock: BigInt(config.VAULT_FACTORY_DEPLOY_BLOCK),
    });
    expect(mockQueue.addMany).toHaveBeenCalledWith([historicVaultAddress]);
  });

  it('should watch for new vaults and add them to the queue', async () => {
    // Arrange
    const newVaultAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    jest.spyOn(testClient, 'getLogs').mockResolvedValue([]); // Garante que não há vaults históricos

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
