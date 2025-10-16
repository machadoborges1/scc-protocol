import {
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";
import {
  AnswerUpdated,
  AggregatorV3Interface,
} from "../../generated/templates/ChainlinkPriceFeed/AggregatorV3Interface";
import { TokenPrice, Token, Vault, Protocol } from "../../generated/schema";

const PROTOCOL_ID = "scc-protocol";

function toBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value
    .toBigDecimal()
    .div(BigInt.fromI32(10).pow(decimals as u8).toBigDecimal());
}

export function handleAnswerUpdated(event: AnswerUpdated): void {
  let context = dataSource.context();
  let asset = context.getString("asset");

  log.info("handleAnswerUpdated triggered for asset: {}. Price: {}", [
    asset,
    event.params.current.toString(),
  ]);

  let priceFeed = AggregatorV3Interface.bind(event.address);
  let decimals = priceFeed.decimals();

  let tokenPrice = TokenPrice.load(asset);
  if (tokenPrice == null) {
    tokenPrice = new TokenPrice(asset);
    log.info("New TokenPrice entity created for asset: {}", [asset]);
  }

  tokenPrice.priceUSD = toBigDecimal(event.params.current, decimals);
  tokenPrice.lastUpdateBlockNumber = event.block.number;
  tokenPrice.lastUpdateTimestamp = event.params.updatedAt;
  tokenPrice.save();

  log.info("TokenPrice entity saved for asset: {}. New price: {}", [
    asset,
    tokenPrice.priceUSD.toString(),
  ]);

  // --- Propagate price update to all vaults using this asset ---
  log.info("Propagating price update for asset: {}", [asset]);
  let token = Token.load(asset);
  if (token != null) {
    let protocol = Protocol.load(PROTOCOL_ID);
    if (protocol == null) {
      // This should not happen if vaults exist, but as a safeguard.
      log.warning("Protocol entity not found while propagating price update.", []);
      return;
    }

    const newPrice = tokenPrice.priceUSD;
    const vaults = token.vaults;

    for (let i = 0; i < vaults.length; i++) {
      let vault = Vault.load(vaults[i]);
      if (vault != null) {
        const oldVaultCollateralValueUSD = vault.collateralValueUSD;

        // Recalculate vault's USD value and CR
        vault.collateralValueUSD = vault.collateralAmount.times(newPrice);
        if (vault.debtAmount.gt(BigDecimal.fromString("0"))) {
          vault.collateralizationRatio = vault.collateralValueUSD
            .div(vault.debtAmount)
            .times(BigDecimal.fromString("100"));
        } else {
          vault.collateralizationRatio = BigDecimal.fromString("0");
        }
        vault.save();

        // Update protocol's total collateral value
        const collateralValueChange =
          vault.collateralValueUSD.minus(oldVaultCollateralValueUSD);
        protocol.totalCollateralValueUSD =
          protocol.totalCollateralValueUSD.plus(collateralValueChange);

        log.info("Updated vault {} with new CR: {}", [
          vault.id,
          vault.collateralizationRatio.toString(),
        ]);
      }
    }
    protocol.save();
    log.info("Finished propagating price update. New total collateral value: {}", [
      protocol.totalCollateralValueUSD.toString(),
    ]);
  }
}
