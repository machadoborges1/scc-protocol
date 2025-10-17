import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { VaultCreated } from "../../generated/VaultFactory/VaultFactory";
import { Protocol, User, Vault, Token, TokenPrice } from "../../generated/schema";
import { Vault as VaultTemplate } from "../../generated/templates";
import { VaultFactory } from "../../generated/VaultFactory/VaultFactory";
import { ERC20 } from "../../generated/VaultFactory/ERC20";
import { SCC_USD_ADDRESS, SCC_GOV_ADDRESS } from "../generated/addresses";

const PROTOCOL_ID = "scc-protocol";

// Converte um valor BigInt com um número específico de decimais para BigDecimal
function toBigDecimal(value: BigInt, decimals: i32): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(decimals as u8).toBigDecimal());
}

export function handleVaultCreated(event: VaultCreated): void {
  // Carrega ou cria a entidade singleton do protocolo
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol == null) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.totalVaults = BigInt.fromI32(0);
    protocol.totalCollateralValueUSD = BigDecimal.fromString("0");
    protocol.totalDebtUSD = BigDecimal.fromString("0");
    protocol.activeAuctions = BigInt.fromI32(0);
    protocol.totalStakedGOV = BigDecimal.fromString("0");

    // Garante que o token SCC_USD e seu preço fixo de $1 existam
    let sccUsdToken = new Token(SCC_USD_ADDRESS.toHexString());
    const sccUsdContract = ERC20.bind(SCC_USD_ADDRESS);
    sccUsdToken.symbol = sccUsdContract.try_symbol().value;
    sccUsdToken.name = sccUsdContract.try_name().value;
    sccUsdToken.decimals = sccUsdContract.try_decimals().value;
    sccUsdToken.vaults = [];
    sccUsdToken.save();

    let sccUsdPrice = new TokenPrice(SCC_USD_ADDRESS.toHexString());
    sccUsdPrice.priceUSD = BigDecimal.fromString("1");
    sccUsdPrice.lastUpdateBlockNumber = event.block.number;
    sccUsdPrice.lastUpdateTimestamp = event.block.timestamp;
    sccUsdPrice.save();

    // Garante que o token de staking SCC_GOV exista
    let govToken = new Token(SCC_GOV_ADDRESS.toHexString());
    const govContract = ERC20.bind(SCC_GOV_ADDRESS);
    govToken.symbol = govContract.try_symbol().value;
    govToken.name = govContract.try_name().value;
    govToken.decimals = govContract.try_decimals().value;
    govToken.vaults = [];
    govToken.save();
  }
  protocol.totalVaults = protocol.totalVaults.plus(BigInt.fromI32(1));
  protocol.save();

  // Carrega ou cria o usuário
  const userId = event.params.owner.toHexString();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }

  // Cria a entidade do novo Vault
  const vaultId = event.params.vaultAddress.toHexString();
  let vault = new Vault(vaultId);
  vault.owner = user.id;

  // Busca o endereço do token de colateral do contrato da fábrica
  const factoryContract = VaultFactory.bind(event.address);
  const collateralTokenAddress = factoryContract.collateralToken();
  
  // Carrega ou cria a entidade do token de colateral
  let collateralToken = Token.load(collateralTokenAddress.toHexString());
  if (collateralToken == null) {
    collateralToken = new Token(collateralTokenAddress.toHexString());
    const erc20Contract = ERC20.bind(collateralTokenAddress);
    collateralToken.symbol = erc20Contract.try_symbol().value;
    collateralToken.name = erc20Contract.try_name().value;
    collateralToken.decimals = erc20Contract.try_decimals().value;
    collateralToken.vaults = []; // Inicializa o array se o token for novo
  }

  // Adiciona o novo vault à lista de vaults do token
  const newVaults = collateralToken.vaults;
  newVaults.push(vaultId);
  collateralToken.vaults = newVaults;
  collateralToken.save();

  vault.collateralToken = collateralToken.id;
  vault.debtToken = SCC_USD_ADDRESS.toHexString();
  vault.status = "Active";
  vault.collateralAmount = BigDecimal.fromString("0");
  vault.collateralValueUSD = BigDecimal.fromString("0");
  vault.debtAmount = BigDecimal.fromString("0");
  vault.debtValueUSD = BigDecimal.fromString("0");
  vault.collateralizationRatio = BigDecimal.fromString("0");
  vault.createdAtTimestamp = event.block.timestamp;
  vault.save();

  // Inicia a indexação do novo contrato Vault a partir de um template
  VaultTemplate.create(event.params.vaultAddress);
}
