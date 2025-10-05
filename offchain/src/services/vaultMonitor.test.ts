import { VaultMonitorService, VaultContractFactory } from './vaultMonitor';
import { vaultQueue } from '../queue'; // New import
import logger from '../logger'; // New import

jest.mock('../rpc', () => ({ retry: jest.fn(fn => fn()) }));
jest.mock('../logger'); // Mock the logger

describe('VaultMonitorService', () => {
  let service: VaultMonitorService;
  let mockOracleManager: any;
  let mockVaultContract: any;
  let mockVaultFactory: VaultContractFactory;
  let mockLogger: any; // Declare mockLogger
  let mockLiquidationAgent: any; // Declare mockLiquidationAgent

  beforeEach(() => {
    mockOracleManager = { getPrice: jest.fn() };
    mockVaultContract = {
      collateralToken: jest.fn(),
      collateralAmount: jest.fn(),
      debtAmount: jest.fn(),
    };
    mockVaultFactory = jest.fn(() => mockVaultContract as any);
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }; // Initialize mockLogger
    mockLiquidationAgent = { liquidateUnhealthyVaults: jest.fn() }; // Initialize mockLiquidationAgent
    service = new VaultMonitorService(mockOracleManager, mockVaultFactory, mockLiquidationAgent, mockLogger); // Pass mockLiquidationAgent and mockLogger
  });

  afterEach(() => {
    service.stop(); // Ensure service is stopped
    // Clear the queue for isolated tests
    while (!vaultQueue.isEmpty()) {
      vaultQueue.dequeue();
    }
  });

  it('processes vaults from the queue and calculates CR correctly', async () => {
    // Arrange
    mockVaultContract.debtAmount.mockResolvedValue(15000n * 10n ** 18n);
    mockVaultContract.collateralAmount.mockResolvedValue(10n * 10n ** 18n);
    mockOracleManager.getPrice.mockResolvedValue(3000n * 10n ** 18n);

    const vaultAddress = '0x1';
    vaultQueue.enqueue({ address: vaultAddress, owner: '0xOwner' }); // Enqueue a vault

    // Act
    service.start(); // Start the monitor service

    // Assert: Wait for the vault to be processed
    // We can check if logger.info was called with the expected message
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Monitored vault ${vaultAddress}: CR = 200.00%`)
    );
    expect(vaultQueue.isEmpty()).toBe(true); // Ensure the vault was dequeued
  });
});