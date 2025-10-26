import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { Vault, User, Token, LiquidationAuction } from "../generated/schema"
import {
  handleAuctionStarted,
  handleAuctionBought,
  handleAuctionClosed
} from "../src/mappings/liquidation-manager"
import {
  createAuctionStartedEvent,
  createAuctionBoughtEvent,
  createAuctionClosedEvent
} from "./liquidation-manager-utils"

// Constants
const VAULT_ADDRESS = "0x1000000000000000000000000000000000000001"
const OWNER_ADDRESS = "0x2000000000000000000000000000000000000002"
const TOKEN_ADDRESS = "0x3000000000000000000000000000000000000003"
const BUYER_ADDRESS = "0x4000000000000000000000000000000000000004"
const AUCTION_ID = BigInt.fromI32(1)

const DEBT_TOKEN_ADDRESS = "0x5000000000000000000000000000000000000005";

describe("LiquidationManager Handlers", () => {
  beforeEach(() => {
    // Create a Vault, User, and Token for the tests to use
    let user = new User(OWNER_ADDRESS);
    user.save();

    let collateralToken = new Token(TOKEN_ADDRESS);
    collateralToken.symbol = "WETH";
    collateralToken.name = "Wrapped Ether";
    collateralToken.decimals = 18;
    collateralToken.vaults = [];
    collateralToken.save();

    let debtToken = new Token(DEBT_TOKEN_ADDRESS);
    debtToken.symbol = "SCC-USD";
    debtToken.name = "SCC Stablecoin";
    debtToken.decimals = 18;
    debtToken.vaults = [];
    debtToken.save();

    let vault = new Vault(VAULT_ADDRESS);
    vault.owner = OWNER_ADDRESS;
    vault.collateralToken = TOKEN_ADDRESS;
    vault.debtToken = DEBT_TOKEN_ADDRESS;
    vault.status = "Active";
    vault.collateralAmount = BigDecimal.fromString("10");
    vault.debtAmount = BigDecimal.fromString("15000");
    vault.collateralValueUSD = BigDecimal.fromString("20000"); // 10 WETH * $2000/WETH
    vault.debtValueUSD = BigDecimal.fromString("15000");
    vault.collateralizationRatio = BigDecimal.fromString("133.33");
    vault.createdAtTimestamp = BigInt.fromI32(123);
    vault.save();
  });

  afterEach(() => {
    clearStore()
  })

  test("should handle AuctionStarted", () => {
    // 1. Data
    let collateralAmount = BigInt.fromI32(10).times(BigInt.fromI32(10).pow(18))
    let debtToCover = BigInt.fromI32(15000).times(BigInt.fromI32(10).pow(18))
    let startPrice = BigInt.fromI32(2250).times(BigInt.fromI32(10).pow(18))

    // 2. Event
    let event = createAuctionStartedEvent(
      AUCTION_ID,
      Address.fromString(VAULT_ADDRESS),
      collateralAmount,
      debtToCover,
      startPrice
    )

    // 3. Handler
    handleAuctionStarted(event)

    // 4. Assertions
    const auctionEntityId = AUCTION_ID.toString()
    assert.entityCount("LiquidationAuction", 1)
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "vault", VAULT_ADDRESS)
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "status", "Active")
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "collateralAmount", "10")
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "debtToCover", "15000")
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "startPrice", "2250")

    // Assert that the vault is linked to the auction
    assert.fieldEquals("Vault", VAULT_ADDRESS, "liquidationAuction", auctionEntityId)
  })

  test("should handle AuctionBought", () => {
    // First, start the auction
    handleAuctionStarted(createAuctionStartedEvent(AUCTION_ID, Address.fromString(VAULT_ADDRESS), BigInt.fromI32(10), BigInt.fromI32(15000), BigInt.fromI32(2250)))

    // 1. Data
    let collateralBought = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))
    let debtPaid = BigInt.fromI32(7500).times(BigInt.fromI32(10).pow(18))

    // 2. Event
    let event = createAuctionBoughtEvent(AUCTION_ID, Address.fromString(BUYER_ADDRESS), collateralBought, debtPaid)

    // 3. Handler
    handleAuctionBought(event)

    // 4. Assertions
    const auctionEntityId = AUCTION_ID.toString()
    assert.entityCount("User", 2) // Owner + Buyer
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "status", "Bought")
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "buyer", BUYER_ADDRESS)
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "collateralBought", "5")
    assert.fieldEquals("LiquidationAuction", auctionEntityId, "debtPaid", "7500")
  })

  test("should handle AuctionClosed", () => {
    // First, start the auction
    handleAuctionStarted(createAuctionStartedEvent(AUCTION_ID, Address.fromString(VAULT_ADDRESS), BigInt.fromI32(10), BigInt.fromI32(15000), BigInt.fromI32(2250)))

    // 2. Event
    let event = createAuctionClosedEvent(AUCTION_ID, Address.fromString(VAULT_ADDRESS))

    // 3. Handler
    handleAuctionClosed(event)

    // 4. Assertions
    const auctionEntityId = AUCTION_ID.toString()
        assert.fieldEquals("LiquidationAuction", auctionEntityId, "status", "Closed")
    
        // Assert that the link from the vault is removed
        assert.fieldEquals("Vault", VAULT_ADDRESS, "liquidationAuction", "null")  })
})
