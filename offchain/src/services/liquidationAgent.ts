import { ethers } from 'ethers';
import { getGasPrice, retry } from '../rpc';
import logger from '../logger';

const MIN_CR = 150;

export class LiquidationAgentService {
  constructor(private liquidationManager: ethers.Contract) {}

  public async liquidateUnhealthyVaults(vaults: { address: string; collateralizationRatio: number }[]) {
    for (const v of vaults) {
      if (v.collateralizationRatio < MIN_CR) {
        logger.info(`Liquidating ${v.address}`);
        try {
          const gasPrice = await getGasPrice(this.liquidationManager.runner!.provider!);
          await retry(() => this.liquidationManager.startAuction.staticCall(v.address, { gasPrice }));
          await retry(() => this.liquidationManager.startAuction(v.address, { gasPrice }));
        } catch (e) { logger.error(e, `Failed to liquidate ${v.address}`); }
      }
    }
  }
}
