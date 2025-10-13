## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Comandos

### Build

Compila os smart contracts do projeto.
```shell
$ forge build
```

### Test

Executa a suíte de testes dos contratos.
```shell
$ forge test
```

## Deploy de Contratos

O script `script/Deploy.s.sol` é "multi-rede", ou seja, ele detecta a rede em que está sendo executado e se comporta de acordo.

### 1. Deploy Local (Anvil)

Este fluxo é ideal para desenvolvimento e testes locais.

-   **Método Automático (Recomendado):**
    O deploy local é gerenciado pelo script de teste de integração na raiz do projeto. Ele garante que o backend e o frontend estejam sincronizados. A partir da **raiz do monorepo**, execute:
    ```bash
    pnpm test:integration
    ```
    Este comando irá iniciar o Anvil (via Docker), implantar os contratos e o subgraph.

-   **Método Manual:**
    Se você precisar implantar apenas os contratos em uma instância do Anvil que já esteja rodando, use o comando abaixo a partir da **raiz do monorepo**:
    ```bash
    pnpm deploy:contracts
    ```

### 2. Deploy em Testnet (Sepolia)

Este fluxo implanta os contratos em uma rede de teste pública, tornando-os acessíveis para um DApp hospedado publicamente (ex: na Vercel).

**Passo 1: Preparar o Ambiente**

-   **Obtenha um RPC URL:** Crie uma conta em um serviço como [Alchemy](https://www.alchemy.com/) ou [Infura](https://www.infura.io/), crie um projeto para a rede **Sepolia** e copie o URL RPC HTTPS.
-   **Obtenha ETH de Teste:** Crie uma carteira de deploy (NUNCA use uma carteira com fundos reais) e use um "faucet" como [sepoliafaucet.com](https://sepoliafaucet.com/) para obter ETH de teste gratuito para pagar as taxas de gás.

**Passo 2: Configurar Variáveis de Ambiente**

No seu terminal, exporte as seguintes variáveis (elas serão usadas apenas nesta sessão do terminal):

```bash
export SEPOLIA_RPC_URL="COLE_SUA_URL_DA_ALCHEMY_OU_INFURA_AQUI"
export PRIVATE_KEY="COLE_SUA_CHAVE_PRIVADA_DA_CARTEIRA_DE_TESTE_AQUI"
export ETHERSCAN_API_KEY="SUA_CHAVE_DE_API_DO_ETHERSCAN_AQUI" # Opcional, mas recomendado para verificação
```

**Passo 3: Executar o Deploy**

A partir da **raiz do projeto**, execute o comando `forge script`:

```bash
forge script contracts/script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

-   `--verify`: Tenta verificar automaticamente o código dos seus contratos no Etherscan, um passo crucial para a transparência e para o seu portfólio.
-   `-vvvv`: Mostra um output detalhado de todo o processo.

Após a execução, os endereços dos seus contratos na rede Sepolia serão exibidos no terminal.
