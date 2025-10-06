import { createTestClient, http, createWalletClient, custom, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { TransactionManagerService } from './transactionManager';
import { config } from '../config';

jest.setTimeout(30000);

jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('TransactionManagerService', () => {
  let service: TransactionManagerService;
  let publicClient: any;
  let walletClient: any;
  const account = privateKeyToAccount(config.KEEPER_PRIVATE_KEY as `0x${string}`);
  const liquidationManagerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const vaultAddress = '0x1234567890123456789012345678901234567890' as Address;

  beforeEach(() => {
    jest.clearAllMocks();

    publicClient = createTestClient({
      chain: anvil,
      mode: 'anvil',
      transport: http(),
    });

    walletClient = createWalletClient({
      account,
      chain: anvil,
      transport: custom(publicClient),
    });

    // Mock das funções do cliente
    publicClient.readContract = jest.fn();
    publicClient.simulateContract = jest.fn();
    publicClient.waitForTransactionReceipt = jest.fn();
    walletClient.writeContract = jest.fn();

    service = new TransactionManagerService(publicClient, walletClient, account, liquidationManagerAddress);
  });

  it('should start an auction if none is active', async () => {
    // Arrange
    const mockRequest = { data: '0x... ' };
    const mockTxHash = '0xmockTxHash';
    const mockReceipt = { status: 'success', blockNumber: 123n };

    publicClient.readContract.mockResolvedValue(0n); // No active auction
    publicClient.simulateContract.mockResolvedValue({ request: mockRequest });
    walletClient.writeContract.mockResolvedValue(mockTxHash);
    publicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(publicClient.readContract).toHaveBeenCalledTimes(1);
    expect(publicClient.simulateContract).toHaveBeenCalledTimes(1);
    expect(walletClient.writeContract).toHaveBeenCalledWith(mockRequest);
    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: mockTxHash });
  });

  it('should not start an auction if one is already active', async () => {
    // Arrange
    publicClient.readContract.mockResolvedValue(1n); // Active auction with ID 1

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(publicClient.readContract).toHaveBeenCalledTimes(1);
    expect(publicClient.simulateContract).not.toHaveBeenCalled();
    expect(walletClient.writeContract).not.toHaveBeenCalled();
  });

  it('should handle simulation failure gracefully', async () => {
    // Arrange
    const simulationError = new Error('Simulation failed');
    publicClient.readContract.mockResolvedValue(0n); // No active auction
    publicClient.simulateContract.mockRejectedValue(simulationError);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(publicClient.readContract).toHaveBeenCalledTimes(1);
    expect(publicClient.simulateContract).toHaveBeenCalledTimes(1);
    expect(walletClient.writeContract).not.toHaveBeenCalled();
    // You can also check if the error was logged
    expect(require('../logger').error).toHaveBeenCalledWith({ err: simulationError, vault: vaultAddress }, `Failed to liquidate vault.`);
  });

  it('should handle transaction submission failure', async () => {
    // Arrange
    const mockRequest = { data: '0x... ' };
    const submissionError = new Error('Submission failed');
    publicClient.readContract.mockResolvedValue(0n);
    publicClient.simulateContract.mockResolvedValue({ request: mockRequest });
    walletClient.writeContract.mockRejectedValue(submissionError);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(walletClient.writeContract).toHaveBeenCalledTimes(1);
    expect(publicClient.waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(require('../logger').error).toHaveBeenCalledWith({ err: submissionError, vault: vaultAddress }, `Failed to liquidate vault.`);
  });
});