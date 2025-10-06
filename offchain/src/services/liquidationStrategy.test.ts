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

// Função auxiliar para criar um delay e simular trabalho assíncrono
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
      // Mock padrão para a nova lógica EIP-1559
      estimateFeesPerGas: jest.fn().mockResolvedValue({ 
        maxFeePerGas: BigInt(10 * 1e9), 
        maxPriorityFeePerGas: BigInt(1 * 1e9) 
      }),
    } as any;

    strategyService = new LiquidationStrategyService(mockPublicClient, mockTransactionManager);
  });

  it('should process liquidations sequentially, not concurrently', async () => {
    jest.useFakeTimers(); // Habilita timers falsos

    // Simula que startAuction demora 50ms para completar
    mockTransactionManager.startAuction.mockImplementation(async () => {
      await sleep(50);
      // Retorna void, conforme a assinatura da função
    });

    const vault1 = { address: '0xVault1' as Address, collateralizationRatio: 110 };
    const vault2 = { address: '0xVault2' as Address, collateralizationRatio: 120 };

    // Inicia o processamento de dois vaults quase ao mesmo tempo
    strategyService.processUnhealthyVaults([vault1]);
    strategyService.processUnhealthyVaults([vault2]);

    // Permite que o processamento inicial comece e a primeira chamada a startAuction ocorra
    jest.runAllTimers();
    await Promise.resolve(); // Drena microtasks

    // No início, apenas a primeira chamada para startAuction deve ter sido feita
    expect(mockTransactionManager.startAuction).toHaveBeenCalledTimes(1);
    expect(mockTransactionManager.startAuction).toHaveBeenCalledWith(vault1.address);

    // Continua executando timers e drenando microtasks até que a segunda chamada ocorra
    // Isso simula a fila processando o próximo item após o primeiro terminar
    let calls = 0;
    while (calls < 2) {
      jest.runAllTimers();
      await Promise.resolve();
      calls = mockTransactionManager.startAuction.mock.calls.length;
    }

    // Ao final, ambas devem ter sido chamadas, uma após a outra
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
