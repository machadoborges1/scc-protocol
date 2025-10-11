import { testClient } from '../../lib/viem';
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

jest.mock('../rpc', () => ({
  retry: jest.fn().mockImplementation(fn => fn()),
}));

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

jest.mock('../config', () => ({
  config: {
    USE_MULTICALL: false, // Test the readContract path
    MIN_CR: 150,
    POLL_INTERVAL_MS: 100,
  },
}));

describe('VaultMonitorService', () => {
  let service: VaultMonitorService;
  const oracleManagerAddress = '0x0000000000000000000000000000000000000002';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VaultMonitorService(testClient, mockQueue, mockLiquidationStrategy, oracleManagerAddress);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not call liquidation strategy for a healthy vault', async () => {
    // Arrange
    const vaultAddress = '0xHealthyVault';
    const readContractSpy = jest.spyOn(testClient, 'readContract');
    readContractSpy.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'debtAmount') return 1000n * 10n ** 18n;
      if (functionName === 'collateralAmount') return 10n * 10n ** 18n;
      if (functionName === 'collateralToken') return '0xCollateralToken';
      if (functionName === 'getPrice') return 160n * 10n ** 18n; // Healthy
      return 0n;
    });

    // Act
    // @ts-ignore - Testing private method directly
    await service.monitorVault(vaultAddress);

    // Assert
    expect(readContractSpy).toHaveBeenCalledTimes(4);
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });

  it('should call liquidation strategy for an unhealthy vault', async () => {
    // Arrange
    const vaultAddress = '0xUnhealthyVault';
    const readContractSpy = jest.spyOn(testClient, 'readContract');
    readContractSpy.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'debtAmount') return 1000n * 10n ** 18n;
      if (functionName === 'collateralAmount') return 10n * 10n ** 18n;
      if (functionName === 'collateralToken') return '0xCollateralToken';
      if (functionName === 'getPrice') return 140n * 10n ** 18n; // Unhealthy
      return 0n;
    });

    // Act
    // @ts-ignore - Testing private method directly
    await service.monitorVault(vaultAddress);

    // Assert
    expect(readContractSpy).toHaveBeenCalledTimes(4);
    expect(mockLiquidationStrategy.processUnhealthyVaults).toHaveBeenCalledWith([
      { address: vaultAddress, collateralizationRatio: 140 },
    ]);
  });

  it('should not try to get price for a vault with no debt', async () => {
    // Arrange
    const vaultAddress = '0xNoDebtVault';
    const readContractSpy = jest.spyOn(testClient, 'readContract');
    readContractSpy.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'debtAmount') return 0n;
      if (functionName === 'collateralAmount') return 10n * 10n ** 18n;
      if (functionName === 'collateralToken') return '0xCollateralToken';
      return 0n;
    });

    // Act
    // @ts-ignore - Testing private method directly
    await service.monitorVault(vaultAddress);

    // Assert
    expect(readContractSpy).toHaveBeenCalledTimes(3);
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });

  it('should wait when the queue is empty', async () => {
    // Arrange
    (mockQueue.getNext as jest.Mock).mockReturnValue(undefined); // Fila sempre vazia
    const multicallSpy = jest.spyOn(testClient, 'multicall');

    // Act
    service.start();
    await jest.advanceTimersByTimeAsync(config.POLL_INTERVAL_MS);

    // Assert
    expect(multicallSpy).not.toHaveBeenCalled();
    expect(mockLiquidationStrategy.processUnhealthyVaults).not.toHaveBeenCalled();
  });
});
