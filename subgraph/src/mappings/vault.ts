import { BigInt, BigDecimal, ethereum, Address } from "@graphprotocol/graph-ts";
import {
  CollateralDeposited,
  CollateralWithdrawn,
  SccUsdMinted,
  SccUsdBurned,
} from "../../generated/templates/Vault/Vault";
import { Vault, VaultUpdate, Token, Protocol } from "../../generated/schema";
import { OracleManager } from "../../generated/VaultFactory/OracleManager";

// --- Endereços e IDs Constantes ---
// O endereço do OracleManager é fixo neste ambiente de desenvolvimento local.
const ORACLE_MANAGER_ADDRESS = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9";
const PROTOCOL_ID = "scc-protocol";

// --- Funções Auxiliares ---

function toBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(decimals as u8).toBigDecimal());
}

function getCollateralPriceInUSD(collateralTokenAddress: Address): BigDecimal {
  const oracle = OracleManager.bind(Address.fromString(ORACLE_MANAGER_ADDRESS));
  const tryPrice = oracle.try_getPrice(collateralTokenAddress);

  if (tryPrice.reverted) {
    // Se a chamada reverter (ex: permissão faltando, feed não configurado), retorne 0.
    // Isso evita que o subgraph inteiro trave.
    return BigDecimal.fromString("0");
  }
  
  // Os preços do OracleManager são padronizados para 18 decimais.
  return toBigDecimal(tryPrice.value, 18);
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
    
    // Atualiza o Vault individual
    vault.collateralAmount = vault.collateralAmount.plus(amount);
    vault.save();
    createVaultUpdate(event, vault, "DEPOSIT", event.params.amount, token.decimals);

    // Atualiza a entidade Protocol
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

    // Atualiza o Vault individual
    vault.collateralAmount = vault.collateralAmount.minus(amount);
    vault.save();
    createVaultUpdate(event, vault, "WITHDRAW", event.params.amount, token.decimals);

    // Atualiza a entidade Protocol
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
    // SCC-USD sempre tem 18 decimais
    const amount = toBigDecimal(event.params.amount, 18);

    // Atualiza o Vault individual
    vault.debtAmount = vault.debtAmount.plus(amount);
    vault.save();
    createVaultUpdate(event, vault, "MINT", event.params.amount, 18);

    // Atualiza a entidade Protocol
    let protocol = Protocol.load(PROTOCOL_ID)!;
    protocol.totalDebtUSD = protocol.totalDebtUSD.plus(amount);
    protocol.save();
  }
}

export function handleSccUsdBurned(event: SccUsdBurned): void {
  let vault = Vault.load(event.address.toHexString());
  if (vault) {
    // SCC-USD sempre tem 18 decimais
    const amount = toBigDecimal(event.params.amount, 18);

    // Atualiza o Vault individual
    vault.debtAmount = vault.debtAmount.minus(amount);
    vault.save();
    createVaultUpdate(event, vault, "BURN", event.params.amount, 18);

    // Atualiza a entidade Protocol
    let protocol = Protocol.load(PROTOCOL_ID)!;
    protocol.totalDebtUSD = protocol.totalDebtUSD.minus(amount);
    protocol.save();
  }
}
