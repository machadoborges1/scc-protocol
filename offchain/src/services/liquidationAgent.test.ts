import { ethers, Wallet } from 'ethers';
import { LiquidationAgentService } from './liquidationAgent';

jest.mock('../rpc', () => ({
  getGasPrice: jest.fn(),
  retry: jest.fn(fn => fn()),
}));

describe('LiquidationAgentService', () => {
  let service: LiquidationAgentService;
  let mockLiquidationManager: any;
  let mockLogger: any;
  let startAuctionMock: jest.Mock & { staticCall: jest.Mock };

  beforeEach(() => {
    startAuctionMock = Object.assign(jest.fn().mockResolvedValue({ wait: jest.fn() }), {
      staticCall: jest.fn().mockResolvedValue(undefined),
    });

    mockLiquidationManager = {
      startAuction: startAuctionMock,
      vaultToAuctionId: jest.fn().mockResolvedValue(0n),
      runner: { provider: { getFeeData: jest.fn().mockResolvedValue({ gasPrice: 1n }) } },
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    // For a simple unit test, we pass a mock contract object directly.
    service = new LiquidationAgentService(mockLiquidationManager as any, mockLogger);
  });

  it('should call logger.info on startup', async () => {
    await service.liquidateUnhealthyVaults([]);
    expect(mockLogger.info).toHaveBeenCalledWith('Checking 0 vaults for liquidation opportunities...');
  });

  it('should attempt to liquidate an unhealthy vault', async () => {
    await service.liquidateUnhealthyVaults([{ collateralizationRatio: 140, address: '0x1' } as any]);
    expect(startAuctionMock).toHaveBeenCalled();
  });
});