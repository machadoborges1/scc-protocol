import { LiquidationAgentService } from './liquidationAgent';
import logger from '../logger';

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('../rpc', () => ({ getGasPrice: jest.fn(), retry: jest.fn(fn => fn()) }));

describe('LiquidationAgentService', () => {
  let service: LiquidationAgentService;
  let startAuctionMock: jest.Mock;

  beforeEach(() => {
    startAuctionMock = jest.fn().mockResolvedValue({ wait: jest.fn() });
    Object.assign(startAuctionMock, { staticCall: jest.fn() });
    const mockLiquidationManager = { startAuction: startAuctionMock, runner: { provider: {} } };
    service = new LiquidationAgentService(mockLiquidationManager as any);
  });

  it('liquidates unhealthy vaults', async () => {
    await service.liquidateUnhealthyVaults([{ collateralizationRatio: 140, address: '0x1' } as any]);
    expect(startAuctionMock).toHaveBeenCalled();
  });
});