import { BigInt, BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
import {
  CollateralDeposited,
  CollateralWithdrawn,
  SccUsdMinted,
  SccUsdBurned,
} from "../../generated/templates/Vault/Vault";
import { Vault, VaultUpdate, Token, Protocol, TokenPrice } from "../../generated/schema";
import { ERC20 } from "../../generated/templates/Vault/ERC20";

// --- Endereços e IDs Constantes ---
const PROTOCOL_ID = "scc-protocol";

// --- Funções Auxiliares ---

function toBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(decimals as u8).toBigDecimal());
}

function getCollateralPriceInUSD(collateralTokenAddress: Address): BigDecimal {
  let tokenPrice = TokenPrice.load(collateralTokenAddress.toHexString());

  if (tokenPrice == null) {
    // Return 0 if price is not available yet
    return BigDecimal.fromString("0");
  }

  return tokenPrice.priceUSD;
}

function updateVaultUSDValues(vault: Vault): Vault {
  let collateralToken = Token.load(vault.collateralToken)!;
  const collateralPrice = getCollateralPriceInUSD(Address.fromString(collateralToken.id));
  
  vault.collateralValueUSD = vault.collateralAmount.times(collateralPrice);
  vault.debtValueUSD = vault.debtAmount;

  if (vault.debtValueUSD.gt(BigDecimal.fromString("0"))) {
    vault.collateralizationRatio = vault.collateralValueUSD.div(vault.debtValueUSD).times(BigDecimal.fromString("100"));
  } else {
    vault.collateralizationRatio = BigDecimal.fromString("0");
  }

  return vault;
}

function createVaultUpdate(
  event: ethereum.Event,
  vault: Vault,
  type: string,
  amount: BigInt,
  tokenDecimals: i32
): void {
  const updateId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let vaultUpdate = new VaultUpdate(updateId);
  vaultUpdate.vault = vault.id;
  vaultUpdate.type = type;
  vaultUpdate.amount = toBigDecimal(amount, tokenDecimals);
  vaultUpdate.timestamp = event.block.timestamp;
  vaultUpdate.save();
}

// --- Handlers de Eventos ---

export function handleCollateralDeposited(event: CollateralDeposited): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    let token = Token.load(vault.collateralToken)!;
    const amount = toBigDecimal(event.params.amount, token.decimals);
    
    vault.collateralAmount = vault.collateralAmount.plus(amount);
    vault = updateVaultUSDValues(vault);
    vault.save();
    createVaultUpdate(event, vault, "DEPOSIT", event.params.amount, token.decimals);

    let protocol = Protocol.load(PROTOCOL_ID)!;
    const price = getCollateralPriceInUSD(Address.fromString(token.id));
    const valueUSD = amount.times(price);
    protocol.totalCollateralValueUSD = protocol.totalCollateralValueUSD.plus(valueUSD);
    protocol.save();
  }
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    let token = Token.load(vault.collateralToken)!;
    const amount = toBigDecimal(event.params.amount, token.decimals);

    vault.collateralAmount = vault.collateralAmount.minus(amount);
    vault = updateVaultUSDValues(vault);
    vault.save();
    createVaultUpdate(event, vault, "WITHDRAW", event.params.amount, token.decimals);

    let protocol = Protocol.load(PROTOCOL_ID)!;
    const price = getCollateralPriceInUSD(Address.fromString(token.id));
    const valueUSD = amount.times(price);
    protocol.totalCollateralValueUSD = protocol.totalCollateralValueUSD.minus(valueUSD);
    protocol.save();
  }
}

export function handleSccUsdMinted(event: SccUsdMinted): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    const amount = toBigDecimal(event.params.amount, 18);

    vault.debtAmount = vault.debtAmount.plus(amount);
    vault = updateVaultUSDValues(vault);
    vault.save();
    createVaultUpdate(event, vault, "MINT", event.params.amount, 18);

    let protocol = Protocol.load(PROTOCOL_ID)!;
    protocol.totalDebtUSD = protocol.totalDebtUSD.plus(amount);
    protocol.save();
  }
}

export function handleSccUsdBurned(event: SccUsdBurned): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    const amount = toBigDecimal(event.params.amount, 18);

    vault.debtAmount = vault.debtAmount.minus(amount);
    vault = updateVaultUSDValues(vault);
    vault.save();
    createVaultUpdate(event, vault, "BURN", event.params.amount, 18);

    let protocol = Protocol.load(PROTOCOL_ID)!;
    protocol.totalDebtUSD = protocol.totalDebtUSD.minus(amount);
    protocol.save();
  }
}
