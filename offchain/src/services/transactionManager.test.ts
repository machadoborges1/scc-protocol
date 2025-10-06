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
  const initialNonce = 10;

  beforeEach(async () => {
    jest.clearAllMocks();

    publicClient = createTestClient({
      chain: anvil,
      mode: 'anvil',
      transport: http(undefined, { batch: false }),
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
    publicClient.getTransactionCount = jest.fn().mockResolvedValue(initialNonce);
    walletClient.writeContract = jest.fn();

    service = new TransactionManagerService(publicClient, walletClient, account, liquidationManagerAddress);
    await service.initialize(); // Inicializa o nonce
  });

  it('should initialize with the correct nonce', () => {
    expect(publicClient.getTransactionCount).toHaveBeenCalledWith({
      address: account.address,
      blockTag: 'latest',
    });
  });

  it('should start an auction with the correct nonce and increment it', async () => {
    // Arrange
    const mockRequest = { data: '0x...' };
    const mockTxHash = '0xmockTxHash';
    const mockReceipt = { status: 'success', blockNumber: 123n };

    publicClient.readContract.mockResolvedValue(0n); // No active auction
    publicClient.simulateContract.mockResolvedValue({ request: mockRequest });
    walletClient.writeContract.mockResolvedValue(mockTxHash);
    publicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
      nonce: initialNonce,
    }));
    expect(walletClient.writeContract).toHaveBeenCalledWith(mockRequest);
    
    // Act again to check nonce increment
    await service.startAuction(vaultAddress);
    
    // Assert nonce was incremented for the second call
    expect(publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
      nonce: initialNonce + 1,
    }));
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

  it('should not increment nonce on simulation failure', async () => {
    // Arrange
    const simulationError = new Error('Simulation failed');
    publicClient.readContract.mockResolvedValue(0n); // No active auction
    publicClient.simulateContract.mockRejectedValue(simulationError);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce,
    }));
    expect(walletClient.writeContract).not.toHaveBeenCalled();
    expect(require('../logger').error).toHaveBeenCalled();

    // Act again to check nonce was NOT incremented
    publicClient.simulateContract.mockResolvedValue({ request: {} }); // Make it succeed this time
    await service.startAuction(vaultAddress);
    expect(publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce, // Should still be the initial nonce
    }));
  });

  it('should not increment nonce on submission failure', async () => {
    // Arrange
    const mockRequest = { data: '0x...' };
    const submissionError = new Error('Submission failed');
    publicClient.readContract.mockResolvedValue(0n);
    publicClient.simulateContract.mockResolvedValue({ request: mockRequest });
    walletClient.writeContract.mockRejectedValue(submissionError);

    // Act
    await service.startAuction(vaultAddress);

    // Assert
    expect(walletClient.writeContract).toHaveBeenCalledTimes(config.MAX_RETRIES);
    expect(require('../logger').error).toHaveBeenCalled();

    // Act again to check nonce was NOT incremented
    walletClient.writeContract.mockResolvedValue('0xmockTxHash'); // Make it succeed this time
    await service.startAuction(vaultAddress);
    expect(publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({
        nonce: initialNonce, // Should still be the initial nonce
    }));
  });
});
