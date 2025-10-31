import { LiquidationStrategyService } from './liquidationStrategy';
import { TransactionManagerService } from './transactionManager';
import { PublicClient, Address } from 'viem';

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../rpc', () => ({
  retry: jest.fn((fn) => fn()),
}));

// Helper function to create a delay and simulate asynchronous work
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('LiquidationStrategyService', () => {
  let strategyService: LiquidationStrategyService;
  let mockTransactionManager: jest.Mocked<TransactionManagerService>;
  let mockPublicClient: jest.Mocked<PublicClient>;

  beforeEach(() => {
    // Mock do TransactionManager
    mockTransactionManager = {
      startAuction: jest.fn(),
    } as any;

    // Mock do PublicClient
    mockPublicClient = {
      // Standard mock for the new EIP-1559 logic
      estimateFeesPerGas: jest.fn().mockResolvedValue({ 
        maxFeePerGas: BigInt(10 * 1e9), 
        maxPriorityFeePerGas: BigInt(1 * 1e9) 
      }),
    } as any;

    strategyService = new LiquidationStrategyService(mockPublicClient, mockTransactionManager);
  });

  it('should process liquidations sequentially, not concurrently', async () => {
    jest.useFakeTimers(); // Enables fake timers

    // Simulates that startAuction takes 50ms to complete
    mockTransactionManager.startAuction.mockImplementation(async () => {
      await sleep(50);
      // Returns void, as per the function signature
    });

    const vault1 = { address: '0xVault1' as Address, collateralizationRatio: 110 };
    const vault2 = { address: '0xVault2' as Address, collateralizationRatio: 120 };

    // Inicia o processamento de dois vaults quase ao mesmo tempo
    strategyService.processUnhealthyVaults([vault1]);
    strategyService.processUnhealthyVaults([vault2]);

    // Permite que o processamento inicial comece e a primeira chamada a startAuction ocorra
    jest.runAllTimers();
    await Promise.resolve(); // Drena microtasks

    // Initially, only the first call to startAuction should have been made
    expect(mockTransactionManager.startAuction).toHaveBeenCalledTimes(1);
    expect(mockTransactionManager.startAuction).toHaveBeenCalledWith(vault1.address);

    // Continues executing timers and draining microtasks until the second call occurs
    // This simulates the queue processing the next item after the first one finishes
    let calls = 0;
    while (calls < 2) {
      jest.runAllTimers();
      await Promise.resolve();
      calls = mockTransactionManager.startAuction.mock.calls.length;
    }

    // In the end, both should have been called, one after the other
    expect(mockTransactionManager.startAuction).toHaveBeenCalledTimes(2);
    expect(mockTransactionManager.startAuction).toHaveBeenCalledWith(vault2.address);

    jest.useRealTimers(); // Restaura os timers reais
  });

  describe('Profitability Logic (EIP-1559)', () => {
    const unhealthyVault = { address: '0xVault1' as Address, collateralizationRatio: 110 };

    it('should execute liquidation when maxFeePerGas is below threshold', async () => {
      // Arrange
      const lowGasFees = { maxFeePerGas: BigInt(50 * 1e9), maxPriorityFeePerGas: BigInt(2 * 1e9) }; // 50 Gwei
      mockPublicClient.estimateFeesPerGas.mockResolvedValue(lowGasFees as any);

      // Act
      await strategyService.processUnhealthyVaults([unhealthyVault]);

      // Assert
      expect(mockTransactionManager.startAuction).toHaveBeenCalledWith(unhealthyVault.address);
    });

    it('should skip liquidation when maxFeePerGas is above threshold', async () => {
      // Arrange
      const highGasFees = { maxFeePerGas: BigInt(150 * 1e9), maxPriorityFeePerGas: BigInt(10 * 1e9) }; // 150 Gwei (default max is 100)
      mockPublicClient.estimateFeesPerGas.mockResolvedValue(highGasFees as any);

      // Act
      await strategyService.processUnhealthyVaults([unhealthyVault]);

      // Assert
      expect(mockTransactionManager.startAuction).not.toHaveBeenCalled();
    });
  });
});
