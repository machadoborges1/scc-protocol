import {
  assert,
  describe,
  test,
  clearStore,
  afterAll,
  createMockedFunction
} from "matchstick-as/assembly/index"
import { Address, ethereum } from "@graphprotocol/graph-ts"
import { handleVaultCreated } from "../src/mappings/vault-factory"
import { createVaultCreatedEvent } from "./vault-factory-utils"

describe("VaultFactory Handler", () => {
  afterAll(() => {
    clearStore()
  })

  test("Should create Vault, User, and Protocol entities correctly", () => {
    // 1. Mock data
    let vaultAddress = Address.fromString("0x1000000000000000000000000000000000000001")
    let ownerAddress = Address.fromString("0x2000000000000000000000000000000000000002")
    let factoryAddress = Address.fromString("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9")
    let collateralTokenAddress = Address.fromString("0x3000000000000000000000000000000000000003")

    // 2. Create a mock event
    let newVaultCreatedEvent = createVaultCreatedEvent(vaultAddress, ownerAddress)
    newVaultCreatedEvent.address = factoryAddress // Set the factory address on the event

    const sccUsdAddress = Address.fromString("0x34a1d3fff3958843c43ad80f30b94c510645c316");
    const sccGovAddress = Address.fromString("0x50eef481cae4250d252ae577a09bf514f224c6c4");

    // 3. Mock the contract call to the factory to get the collateralToken address
    createMockedFunction(
      factoryAddress,
      "collateralToken",
      "collateralToken():(address)"
    ).returns([
      ethereum.Value.fromAddress(collateralTokenAddress)
    ]);

    // 4. Mock ERC20 contract calls for the new collateral token
    createMockedFunction(
      collateralTokenAddress,
      "symbol",
      "symbol():(string)"
    ).returns([ethereum.Value.fromString("WETH")]);

    createMockedFunction(
      collateralTokenAddress,
      "name",
      "name():(string)"
    ).returns([ethereum.Value.fromString("Wrapped Ether")]);

    createMockedFunction(
      collateralTokenAddress,
      "decimals",
      "decimals():(uint8)"
    ).returns([ethereum.Value.fromI32(18)]);

    // 5. Mock ERC20 calls for SCC_USD and SCC_GOV (called when Protocol is created)
    createMockedFunction(sccUsdAddress, "symbol", "symbol():(string)")
      .returns([ethereum.Value.fromString("SCC-USD")]);
    createMockedFunction(sccUsdAddress, "name", "name():(string)")
      .returns([ethereum.Value.fromString("SCC Stablecoin")]);
    createMockedFunction(sccUsdAddress, "decimals", "decimals():(uint8)")
      .returns([ethereum.Value.fromI32(18)]);

    createMockedFunction(sccGovAddress, "symbol", "symbol():(string)")
      .returns([ethereum.Value.fromString("SCC-GOV")]);
    createMockedFunction(sccGovAddress, "name", "name():(string)")
      .returns([ethereum.Value.fromString("SCC Governance")]);
    createMockedFunction(sccGovAddress, "decimals", "decimals():(uint8)")
      .returns([ethereum.Value.fromI32(18)]);

    // 4. Call the handler
    handleVaultCreated(newVaultCreatedEvent)

    // 5. Assertions
    assert.entityCount("Vault", 1)
    assert.entityCount("User", 1)
    assert.entityCount("Protocol", 1)
    assert.entityCount("Token", 3) // Collateral, SCC-USD, SCC-GOV

    // Assert Vault fields
    assert.fieldEquals("Vault", vaultAddress.toHexString(), "id", vaultAddress.toHexString())
    assert.fieldEquals("Vault", vaultAddress.toHexString(), "owner", ownerAddress.toHexString())
    assert.fieldEquals("Vault", vaultAddress.toHexString(), "collateralToken", collateralTokenAddress.toHexString())
    assert.fieldEquals("Vault", vaultAddress.toHexString(), "debtAmount", "0")

    // Assert User fields
    assert.fieldEquals("User", ownerAddress.toHexString(), "id", ownerAddress.toHexString())
    
    // Assert Protocol fields
    assert.fieldEquals("Protocol", "scc-protocol", "totalVaults", "1")

    // Assert Token fields
    assert.fieldEquals("Token", collateralTokenAddress.toHexString(), "symbol", "WETH")
    assert.fieldEquals("Token", sccUsdAddress.toHexString(), "symbol", "SCC-USD")
    assert.fieldEquals("Token", sccGovAddress.toHexString(), "symbol", "SCC-GOV")
  })
})
