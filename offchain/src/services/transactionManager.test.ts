import { privateKeyToAccount } from 'viem/accounts';
import { Address, WaitForTransactionReceiptTimeoutError } from 'viem';
import { testClient } from '../../lib/viem';
import { TransactionManagerService } from './transactionManager';
import { config } from '../config';

jest.setTimeout(30000);

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock a função de retry para executar a chamada imediatamente, sem delays
jest.mock('../rpc', () => ({
  ...jest.requireActual('../rpc'),
  retry: jest.fn((fn) => fn()),
}));

describe('TransactionManagerService', () => {
  let service: TransactionManagerService;
  const account = privateKeyToAccount(config.KEEPER_PRIVATE_KEY as `0x${string}`);
  const liquidationManagerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const vaultAddress = '0x1234567890123456789012345678901234567890' as Address;
  const initialNonce = 10;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Use o testClient compartilhado para public e wallet actions
    service = new TransactionManagerService(testClient, testClient, account, liquidationManagerAddress);
    
    // Mock getTransactionCount para a inicialização do nonce
    jest.spyOn(testClient, 'getTransactionCount').mockResolvedValue(initialNonce);

    await service.initialize();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with the correct nonce', () => {
    expect(testClient.getTransactionCount).toHaveBeenCalledWith({
      address: account.address,
      blockTag: 'latest',
    });
  });

  it('should start an auction with the correct nonce and increment it', async () => {
    // Arrange
    const mockRequest = { data: '0x...' };
    const mockTxHash = '0xmockTxHash';
    const mockReceipt = { status: 'success', blockNumber: 123n };

    jest.spyOn(testClient, 'readContract').mockResolvedValue(0n as any); // No active auction
    jest.spyOn(testClient, 'estimateFeesPerGas').mockResolvedValue({ maxFeePerGas: 100n, maxPriorityFeePerGas: 10n });
    const simulateSpy = jest.spyOn(testClient, 'simulateContract').mockResolvedValue({ request: mockRequest } as any);
    jest.spyOn(testClient, 'writeContract').mockResolvedValue(mockTxHash);
    jest.spyOn(testClient, 'waitForTransactionReceipt').mockResolvedValue(mockReceipt as any);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({
      nonce: initialNonce,
    }));
    expect(testClient.writeContract).toHaveBeenCalledWith(mockRequest);
    
    // Act again to check nonce increment
    await service.startAuction(vaultAddress);
    
    // Assert nonce was incremented for the second call
    expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({
      nonce: initialNonce + 1,
    }));
  });

  it('should not start an auction if one is already active', async () => {
    // Arrange
    jest.spyOn(testClient, 'readContract').mockResolvedValue(1n as any); // Active auction with ID 1
    const simulateSpy = jest.spyOn(testClient, 'simulateContract');
    const writeSpy = jest.spyOn(testClient, 'writeContract');

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(testClient.readContract).toHaveBeenCalledTimes(1);
    expect(simulateSpy).not.toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('should not increment nonce on simulation failure', async () => {
    // Arrange
    const simulationError = new Error('Simulation failed');
    jest.spyOn(testClient, 'readContract').mockResolvedValue(0n as any); // No active auction
    jest.spyOn(testClient, 'estimateFeesPerGas').mockResolvedValue({ maxFeePerGas: 100n, maxPriorityFeePerGas: 10n });
    const simulateSpy = jest.spyOn(testClient, 'simulateContract').mockRejectedValue(simulationError);
    const writeSpy = jest.spyOn(testClient, 'writeContract');

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce,
    }));
    expect(writeSpy).not.toHaveBeenCalled();
    expect(require('../logger').error).toHaveBeenCalled();

    // Act again to check nonce was NOT incremented
    simulateSpy.mockResolvedValue({ request: {} } as any); // Make it succeed this time
    await service.startAuction(vaultAddress);
    expect(simulateSpy).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce, // Should still be the initial nonce
    }));
  });

  it('should not increment nonce on submission failure', async () => {
    // Arrange
    const mockRequest = { data: '0x...' };
    const submissionError = new Error('Submission failed');
    jest.spyOn(testClient, 'readContract').mockResolvedValue(0n as any);
    jest.spyOn(testClient, 'estimateFeesPerGas').mockResolvedValue({ maxFeePerGas: 100n, maxPriorityFeePerGas: 10n });
    jest.spyOn(testClient, 'simulateContract').mockResolvedValue({ request: mockRequest } as any);
    const writeSpy = jest.spyOn(testClient, 'writeContract').mockRejectedValue(submissionError);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    // Como o retry agora é um mock que não repete, esperamos apenas 1 chamada.
    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(require('../logger').error).toHaveBeenCalled();

    // Act again to check nonce was NOT incremented
    writeSpy.mockClear(); // Limpa o histórico de chamadas
    writeSpy.mockResolvedValue('0xmockTxHash'); // Faz a próxima chamada ter sucesso
    await service.startAuction(vaultAddress);
    expect(testClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce, // Should still be the initial nonce
    }));
    expect(writeSpy).toHaveBeenCalledTimes(1); // Verifica a chamada bem-sucedida
  });

  it('should use dynamic gas fees for the transaction', async () => {
    // Arrange
    const mockGasFees = { maxFeePerGas: 100n, maxPriorityFeePerGas: 10n };
    const mockRequest = { data: '0x...' };
    const mockTxHash = '0xmockTxHash';
    const mockReceipt = { status: 'success' };

    jest.spyOn(testClient, 'readContract').mockResolvedValue(0n as any); // No active auction
    const estimateSpy = jest.spyOn(testClient, 'estimateFeesPerGas').mockResolvedValue(mockGasFees);
    jest.spyOn(testClient, 'simulateContract').mockResolvedValue({ request: mockRequest } as any);
    jest.spyOn(testClient, 'writeContract').mockResolvedValue(mockTxHash);
    jest.spyOn(testClient, 'waitForTransactionReceipt').mockResolvedValue(mockReceipt as any);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(estimateSpy).toHaveBeenCalledTimes(1);
    expect(testClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
      maxFeePerGas: mockGasFees.maxFeePerGas,
      maxPriorityFeePerGas: mockGasFees.maxPriorityFeePerGas,
    }));
  });

  it('should replace a stuck transaction with a higher gas fee', async () => {
    // Arrange
    const mockRequest1 = { data: '0x1' };
    const mockRequest2 = { data: '0x2' };
    const mockTxHash1 = '0xhash1';
    const mockTxHash2 = '0xhash2';
    const successReceipt = { status: 'success' };

    const initialGasFees = { maxFeePerGas: 100n, maxPriorityFeePerGas: 10n };
    const replacementGasFees = { maxFeePerGas: 120n, maxPriorityFeePerGas: 12n }; // 20% higher

    jest.spyOn(testClient, 'readContract').mockResolvedValue(0n as any);
    const estimateSpy = jest.spyOn(testClient, 'estimateFeesPerGas')
      .mockResolvedValueOnce(initialGasFees)
      .mockResolvedValueOnce(replacementGasFees);

    const simulateSpy = jest.spyOn(testClient, 'simulateContract')
      .mockResolvedValueOnce({ request: mockRequest1 } as any)
      .mockResolvedValueOnce({ request: mockRequest2 } as any);

    const writeSpy = jest.spyOn(testClient, 'writeContract')
      .mockResolvedValueOnce(mockTxHash1)
      .mockResolvedValueOnce(mockTxHash2);

    jest.spyOn(testClient, 'waitForTransactionReceipt')
      .mockRejectedValueOnce(new WaitForTransactionReceiptTimeoutError({ hash: mockTxHash1 } as any))
      .mockResolvedValueOnce(successReceipt as any);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(estimateSpy).toHaveBeenCalledTimes(2);
    expect(writeSpy).toHaveBeenCalledTimes(2);

    // A primeira chamada de simulação usa o nonce inicial e as taxas iniciais
    expect(simulateSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
      nonce: initialNonce,
      maxFeePerGas: initialGasFees.maxFeePerGas,
    }));

    // A segunda chamada de simulação usa o MESMO nonce e taxas MAIORES
    expect(simulateSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
      nonce: initialNonce,
      maxFeePerGas: replacementGasFees.maxFeePerGas,
    }));

    expect(require('../logger').warn).toHaveBeenCalledWith(expect.stringContaining('is stuck. Attempting to replace it'));
  });
});