import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  AuctionStarted,
  AuctionBought,
  AuctionClosed,
} from "../../generated/LiquidationManager/LiquidationManager";
import { LiquidationAuction, Vault, User } from "../../generated/schema";

// Função auxiliar para converter BigInt para BigDecimal com 18 decimais
function toBigDecimal18(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal());
}

export function handleAuctionStarted(event: AuctionStarted): void {
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
