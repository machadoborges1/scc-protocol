import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  AuctionStarted,
  AuctionBought,
  AuctionClosed,
} from "../../generated/LiquidationManager/LiquidationManager";
import { LiquidationAuction, Vault, User, Protocol } from "../../generated/schema";

const PROTOCOL_ID = "scc-protocol";

// Função auxiliar para converter BigInt para BigDecimal com 18 decimais
function toBigDecimal18(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal());
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol == null) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.totalVaults = BigInt.fromI32(0);
    protocol.totalCollateralValueUSD = BigDecimal.fromString("0");
    protocol.totalDebtUSD = BigDecimal.fromString("0");
    protocol.activeAuctions = BigInt.fromI32(0);
    protocol.totalStakedGOV = BigDecimal.fromString("0");
  }
  return protocol;
}

export function handleAuctionStarted(event: AuctionStarted): void {
  let protocol = getOrCreateProtocol();
  protocol.activeAuctions = protocol.activeAuctions.plus(BigInt.fromI32(1));
  protocol.save();

  const auctionId = event.params.auctionId.toString();
  let auction = new LiquidationAuction(auctionId);

  let vault = Vault.load(event.params.vaultAddress.toHexString());
  if (vault) {
    auction.vault = vault.id;
    vault.liquidationAuction = auction.id;
    vault.save();
  }

  auction.status = "Active";
  auction.collateralAmount = toBigDecimal18(event.params.collateralAmount);
  auction.debtToCover = toBigDecimal18(event.params.debtToCover);
  auction.startTime = event.block.timestamp;
  auction.startPrice = toBigDecimal18(event.params.startPrice);
  auction.save();
}

export function handleAuctionBought(event: AuctionBought): void {
  const auctionId = event.params.auctionId.toString();
  let auction = LiquidationAuction.load(auctionId);

  if (auction) {
    const buyerId = event.params.buyer.toHexString();
    let user = User.load(buyerId);
    if (user == null) {
      user = new User(buyerId);
      user.save();
    }

    auction.status = "Bought"; // Partial or full
    auction.buyer = user.id;
    auction.collateralBought = toBigDecimal18(event.params.collateralBought);
    auction.debtPaid = toBigDecimal18(event.params.debtPaid);
    // Note: For partial buys, we might need more complex logic,
    // but for now this shows the last buyer.
    auction.save();
  }
}

export function handleAuctionClosed(event: AuctionClosed): void {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol) {
    protocol.activeAuctions = protocol.activeAuctions.minus(BigInt.fromI32(1));
    protocol.save();
  }

  const auctionId = event.params.auctionId.toString();
  let auction = LiquidationAuction.load(auctionId);

  if (auction) {
    auction.status = "Closed";
    auction.closedAtTimestamp = event.block.timestamp;
    auction.save();

    // Remove the link from the vault
    let vault = Vault.load(auction.vault);
    if (vault) {
      vault.liquidationAuction = null;
      vault.save();
    }
  }
}
