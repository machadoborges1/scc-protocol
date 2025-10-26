import { BigInt } from '@graphprotocol/graph-ts';
import {
  MinCollateralizationRatioUpdated,
  PriceDecayHalfLifeUpdated,
  StartPriceMultiplierUpdated,
} from '../../generated/SCC_Parameters/SCC_Parameters';
import { Protocol } from '../../generated/schema';

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load('scc-protocol');
  if (protocol == null) {
    protocol = new Protocol('scc-protocol');
    protocol.totalVaults = BigInt.fromI32(0);
    protocol.totalCollateralValueUSD = BigInt.fromI32(0).toBigDecimal();
    protocol.totalDebtUSD = BigInt.fromI32(0).toBigDecimal();
    protocol.activeAuctions = BigInt.fromI32(0);
    protocol.totalStakedGOV = BigInt.fromI32(0).toBigDecimal();
  }
  return protocol;
}

export function handleMinCollateralizationRatioUpdated(
  event: MinCollateralizationRatioUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol.minCollateralizationRatio = event.params.newRatio;
  protocol.save();
}

export function handlePriceDecayHalfLifeUpdated(
  event: PriceDecayHalfLifeUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol.priceDecayHalfLife = event.params.newHalfLife;
  protocol.save();
}

export function handleStartPriceMultiplierUpdated(
  event: StartPriceMultiplierUpdated
): void {
  let protocol = getOrCreateProtocol();
  protocol.startPriceMultiplier = event.params.newMultiplier;
  protocol.save();
}