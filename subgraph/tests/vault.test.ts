import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach,
  createMockedFunction
} from "matchstick-as/assembly/index"
import { Address, BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts"
import { Vault, User, Token, VaultUpdate, Protocol } from "../generated/schema"
import {
  handleCollateralDeposited,
  handleCollateralWithdrawn,
  handleSccUsdMinted,
  handleSccUsdBurned
} from "../src/mappings/vault"
import {
  createCollateralDepositedEvent,
  createCollateralWithdrawnEvent,
  createSccUsdMintedEvent,
  createSccUsdBurnedEvent
} from "./vault-utils"

// Constants for tests
const VAULT_ADDRESS = "0x1000000000000000000000000000000000000001"
const OWNER_ADDRESS = "0x2000000000000000000000000000000000000002"
const TOKEN_ADDRESS = "0x3000000000000000000000000000000000000003"
const TOKEN_DECIMALS = 18

describe("Vault Handlers", () => {
  beforeEach(() => {
    // Setup initial state before each test

    // Create User
    let user = new User(OWNER_ADDRESS)
    user.save()

    // Create Token
    let token = new Token(TOKEN_ADDRESS)
    token.symbol = "WETH"
    token.name = "Wrapped Ether"
    token.decimals = TOKEN_DECIMALS
    token.save()

    // Create Vault
    let vault = new Vault(VAULT_ADDRESS)
    vault.owner = OWNER_ADDRESS
    vault.collateralToken = TOKEN_ADDRESS
    vault.collateralAmount = BigDecimal.fromString("10") // Initial collateral: 10
    vault.debtAmount = BigDecimal.fromString("5000")     // Initial debt: 5000
    vault.collateralValueUSD = BigDecimal.fromString("15000") // 10 WETH * $1500/WETH (mocked price)
    vault.debtValueUSD = BigDecimal.fromString("5000")
    vault.collateralizationRatio = BigDecimal.fromString("300")
    vault.createdAtTimestamp = BigInt.fromI32(123)
    vault.save()

    // Create Protocol
    let protocol = new Protocol("scc-protocol")
    protocol.totalVaults = BigInt.fromI32(1)
    protocol.totalCollateralValueUSD = BigDecimal.fromString("0")
    protocol.totalDebtUSD = BigDecimal.fromString("0")
    protocol.activeAuctions = BigInt.fromI32(0)
    protocol.totalStakedGOV = BigDecimal.fromString("0")
    protocol.save()
  })

  afterEach(() => {
    clearStore()
  })

  test("should handle CollateralDeposited", () => {
    // 1. Mock data
    let amount = BigInt.fromI32(5).times(BigInt.fromI32(10).pow(18))

    // Mock the OracleManager getPrice call
    createMockedFunction(
      Address.fromString("0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9"),
      "getPrice",
      "getPrice(address):(uint256)"
    )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(TOKEN_ADDRESS))])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1500).times(BigInt.fromI32(10).pow(18)))]);

    // 2. Create mock event
    let event = createCollateralDepositedEvent(amount)
    event.address = Address.fromString(VAULT_ADDRESS)

    // 3. Call handler
    handleCollateralDeposited(event)

    // 4. Assertions
    assert.fieldEquals("Vault", VAULT_ADDRESS, "collateralAmount", "15") // 10 + 5
    assert.entityCount("VaultUpdate", 1)
    let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    assert.fieldEquals("VaultUpdate", updateId, "type", "DEPOSIT")
    assert.fieldEquals("VaultUpdate", updateId, "amount", "5")
  })

  test("should handle CollateralWithdrawn", () => {
    let amount = BigInt.fromI32(2).times(BigInt.fromI32(10).pow(18))

    // Mock the OracleManager getPrice call
    createMockedFunction(
      Address.fromString("0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9"),
      "getPrice",
      "getPrice(address):(uint256)"
    )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(TOKEN_ADDRESS))])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1500).times(BigInt.fromI32(10).pow(18)))]);

    let event = createCollateralWithdrawnEvent(amount)
    event.address = Address.fromString(VAULT_ADDRESS)

    handleCollateralWithdrawn(event)

    assert.fieldEquals("Vault", VAULT_ADDRESS, "collateralAmount", "8") // 10 - 2
    assert.entityCount("VaultUpdate", 1)
    let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    assert.fieldEquals("VaultUpdate", updateId, "type", "WITHDRAW")
    assert.fieldEquals("VaultUpdate", updateId, "amount", "2")
  })

  test("should handle SccUsdMinted", () => {
    let amount = BigInt.fromI32(1000).times(BigInt.fromI32(10).pow(18))

    let event = createSccUsdMintedEvent(amount)
    event.address = Address.fromString(VAULT_ADDRESS)

    handleSccUsdMinted(event)

    assert.fieldEquals("Vault", VAULT_ADDRESS, "debtAmount", "6000") // 5000 + 1000
    assert.entityCount("VaultUpdate", 1)
    let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    assert.fieldEquals("VaultUpdate", updateId, "type", "MINT")
    assert.fieldEquals("VaultUpdate", updateId, "amount", "1000")
  })

  test("should handle SccUsdBurned", () => {
    let amount = BigInt.fromI32(500).times(BigInt.fromI32(10).pow(18))

    let event = createSccUsdBurnedEvent(amount)
    event.address = Address.fromString(VAULT_ADDRESS)

    handleSccUsdBurned(event)

    assert.fieldEquals("Vault", VAULT_ADDRESS, "debtAmount", "4500") // 5000 - 500
    assert.entityCount("VaultUpdate", 1)
    let updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    assert.fieldEquals("VaultUpdate", updateId, "type", "BURN")
    assert.fieldEquals("VaultUpdate", updateId, "amount", "500")
  })
})
