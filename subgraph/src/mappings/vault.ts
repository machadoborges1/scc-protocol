import { BigInt, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  CollateralDeposited,
  CollateralWithdrawn,
  SccUsdMinted,
  SccUsdBurned,
} from "../../generated/templates/Vault/Vault";
import { Vault, VaultUpdate, Token } from "../../generated/schema";
import { Vault as VaultContract } from "../../generated/templates/Vault/Vault";

// Função auxiliar para converter BigInt para BigDecimal com base nos decimais de um token
function toBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(decimals as u8).toBigDecimal());
}

// Função auxiliar para criar um VaultUpdate
function createVaultUpdate(
  event: ethereum.Event, // Usando 'ethereum.Event' como tipo base
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

export function handleCollateralDeposited(event: CollateralDeposited): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    let token = Token.load(vault.collateralToken);
    let decimals = token ? token.decimals : 18;
    const amount = toBigDecimal(event.params.amount, decimals);
    vault.collateralAmount = vault.collateralAmount.plus(amount);
    vault.save();
    createVaultUpdate(event, vault, "DEPOSIT", event.params.amount, decimals);
  }
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    let token = Token.load(vault.collateralToken);
    let decimals = token ? token.decimals : 18;
    const amount = toBigDecimal(event.params.amount, decimals);
    vault.collateralAmount = vault.collateralAmount.minus(amount);
    vault.save();
    createVaultUpdate(event, vault, "WITHDRAW", event.params.amount, decimals);
  }
}

export function handleSccUsdMinted(event: SccUsdMinted): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    // SCC-USD always has 18 decimals
    const amount = toBigDecimal(event.params.amount, 18);
    vault.debtAmount = vault.debtAmount.plus(amount);
    vault.save();
    createVaultUpdate(event, vault, "MINT", event.params.amount, 18);
  }
}

export function handleSccUsdBurned(event: SccUsdBurned): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    // SCC-USD always has 18 decimals
    const amount = toBigDecimal(event.params.amount, 18);
    vault.debtAmount = vault.debtAmount.minus(amount);
    vault.save();
    createVaultUpdate(event, vault, "BURN", event.params.amount, 18);
  }
}
