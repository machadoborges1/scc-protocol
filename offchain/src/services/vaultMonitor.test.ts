import { VaultMonitorService, VaultContractFactory } from './vaultMonitor';

jest.mock('../rpc', () => ({ retry: jest.fn(fn => fn()) }));

describe('VaultMonitorService', () => {
  let service: VaultMonitorService;
  let mockOracleManager: any;
  let mockVaultContract: any;
  let mockVaultFactory: VaultContractFactory;

  beforeEach(() => {
    mockOracleManager = { getPrice: jest.fn() };
    mockVaultContract = {
      collateralToken: jest.fn(),
      collateralAmount: jest.fn(),
      debtAmount: jest.fn(),
    };
    mockVaultFactory = jest.fn(() => mockVaultContract as any);
    service = new VaultMonitorService(mockOracleManager, mockVaultFactory);
  });

  it('calculates CR correctly', async () => {
    mockVaultContract.debtAmount.mockResolvedValue(15000n * 10n ** 18n);
    mockVaultContract.collateralAmount.mockResolvedValue(10n * 10n ** 18n);
    mockOracleManager.getPrice.mockResolvedValue(3000n * 10n ** 18n);

    const result = await service.monitorVaults([{ address: '0x1' }]);
    expect(result[0].collateralizationRatio).toBe(200);
  });
});