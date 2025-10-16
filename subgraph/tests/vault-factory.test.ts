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

    // 3. Mock the contract call to the factory to get the collateralToken address
    createMockedFunction(
      factoryAddress,
      "collateralToken",
      "collateralToken():(address)"
    ).returns([
      ethereum.Value.fromAddress(collateralTokenAddress)
    ])

    // 4. Mock ERC20 contract calls for the new token
    createMockedFunction(
      collateralTokenAddress,
      "symbol",
      "symbol():(string)"
    ).returns([ethereum.Value.fromString("WETH")])

    createMockedFunction(
      collateralTokenAddress,
      "name",
      "name():(string)"
    ).returns([ethereum.Value.fromString("Wrapped Ether")])

    createMockedFunction(
      collateralTokenAddress,
      "decimals",
      "decimals():(uint8)"
    ).returns([ethereum.Value.fromI32(18)])

    // 4. Call the handler
    handleVaultCreated(newVaultCreatedEvent)

    // 5. Assertions
    assert.entityCount("Vault", 1)
    assert.entityCount("User", 1)
    assert.entityCount("Protocol", 1)
    assert.entityCount("Token", 1) // The handler also creates the Token entity

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
    assert.fieldEquals("Token", collateralTokenAddress.toHexString(), "symbol", "WETH") // From the placeholder in the handler
  })
})
