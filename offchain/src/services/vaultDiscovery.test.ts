import { VaultDiscoveryService } from './vaultDiscovery';

jest.mock('../rpc', () => ({ retry: jest.fn(fn => fn()) }));
jest.mock('../config', () => ({ config: { VAULT_FACTORY_DEPLOY_BLOCK: 0 } }));
jest.mock('../logger');

describe('VaultDiscoveryService', () => {
  it('fetches historical vaults', async () => {
    // Arrange
    const mockFactory = {
      filters: { VaultCreated: jest.fn() },
      queryFilter: jest.fn().mockResolvedValue([{ args: ['0x1', '0x2'] }]), // Mock event
      on: jest.fn(),
    };
    const mockProvider = { getBlockNumber: jest.fn().mockResolvedValue(100) };
    const service = new VaultDiscoveryService(mockFactory as any, mockProvider as any);

    // Act
    await service.start();

    // Assert
    expect(service.getVaults()).toHaveLength(1);
    expect(service.getVaults()[0].address).toBe('0x1');
  });
});
