import { createTestClient, http, Address } from 'viem';
import { anvil } from 'viem/chains';
import { VaultMonitorService } from './vaultMonitor';
import { VaultQueue } from '../queue';
import { LiquidationStrategyService } from './liquidationStrategy';
import { config } from '../config';

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.useFakeTimers(); // Usa timers falsos para controlar o setTimeout

// Mock completo dos serviços e da fila
const mockQueue = {
  add: jest.fn(),
  addMany: jest.fn(),
  getNext: jest.fn(),
  isEmpty: jest.fn(() => true),
  size: jest.fn(() => 0),
} as unknown as VaultQueue;

const mockLiquidationStrategy = {
  processUnhealthyVaults: jest.fn(),
} as unknown as LiquidationStrategyService;

describe('VaultMonitorService', () => {
  let service: VaultMonitorService;
  let publicClient: any;
  const oracleManagerAddress = '0x0000000000000000000000000000000000000002';

  beforeEach(() => {
    jest.clearAllMocks();

    publicClient = createTestClient({
      chain: anvil,
      mode: 'anvil',
      transport: http(undefined, { batch: false }),
    });

    // Mock das funções do cliente
    publicClient.multicall = jest.fn();
    publicClient.readContract = jest.fn();

    service = new VaultMonitorService(publicClient, mockQueue, mockLiquidationStrategy, oracleManagerAddress);
  });

  afterEach(() => {
    service.stop();
  });

  it('should not call liquidation strategy for a healthy vault', async () => {
    // Arrange
    const vaultAddress = '0xHealthyVault';
    (mockQueue.getNext as jest.Mock).mockReturnValueOnce(vaultAddress).mockReturnValue(undefined); // Processa um e depois para

    // Débito: 1000, Colateral: 10, Preço: 160 -> CR = (10 * 160) / 1000 = 1.6 (160%)
    publicClient.multicall.mockResolvedValue([1000n * 10n ** 18n, 10n * 10n ** 18n, '0xCollateralToken']);
    publicClient.readContract.mockResolvedValue(160n * 10n ** 18n);

    // Act
    service.start();
    await jest.advanceTimersByTimeAsync(1); // Avança o tempo para o loop executar

    // Assert
    expect(publicClient.multicall).toHaveBeenCalledWith(expect.objectContaining({ contracts: expect.arrayContaining([expect.objectContaining({ address: vaultAddress })]) }));
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });

  it('should call liquidation strategy for an unhealthy vault', async () => {
    // Arrange
    const vaultAddress = '0xUnhealthyVault';
    (mockQueue.getNext as jest.Mock).mockReturnValueOnce(vaultAddress).mockReturnValue(undefined);

    // Débito: 1000, Colateral: 10, Preço: 140 -> CR = (10 * 140) / 1000 = 1.4 (140%)
    publicClient.multicall.mockResolvedValue([1000n * 10n ** 18n, 10n * 10n ** 18n, '0xCollateralToken']);
    publicClient.readContract.mockResolvedValue(140n * 10n ** 18n);

    // Act
    service.start();
    await jest.advanceTimersByTimeAsync(1);

    // Assert
    expect(mockLiquidationStrategy.processUnhealthyVaults).toHaveBeenCalledWith([
      {
        address: vaultAddress,
        collateralizationRatio: 140,
      },
    ]);
  });

  it('should not call liquidation for a vault with no debt', async () => {
    // Arrange
    const vaultAddress = '0xNoDebtVault';
    (mockQueue.getNext as jest.Mock).mockReturnValueOnce(vaultAddress).mockReturnValue(undefined);

    publicClient.multicall.mockResolvedValue([0n, 10n * 10n ** 18n, '0xCollateralToken']);

    // Act
    service.start();
    await jest.advanceTimersByTimeAsync(1);

    // Assert
    expect(publicClient.readContract).not.toHaveBeenCalled(); // Não deve nem tentar buscar o preço
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });

  it('should wait when the queue is empty', async () => {
    // Arrange
    (mockQueue.getNext as jest.Mock).mockReturnValue(undefined); // Fila sempre vazia

    // Act
    service.start();
    await jest.advanceTimersByTimeAsync(config.POLL_INTERVAL_MS);

    // Assert
    expect(publicClient.multicall).not.toHaveBeenCalled();
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });
});
