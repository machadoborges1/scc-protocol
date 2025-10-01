// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OracleManager
 * @author Humberto
 * @notice Este contrato gerencia os feeds de preço da Chainlink para o protocolo SCC.
 * Ele fornece uma interface padronizada e segura para obter preços de ativos,
 * incluindo validações críticas de segurança.
 */
contract OracleManager is Ownable {
    // ---
    // Errors
    // ---

    /**
     * @notice Erro emitido quando o preço de um ativo está desatualizado.
     * @param asset O endereço do ativo cujo preço está desatualizado.
     * @param updatedAt O timestamp da última atualização do preço.
     */
    error StalePrice(address asset, uint256 updatedAt);

    /**
     * @notice Erro emitido quando o oráculo retorna um preço inválido (<= 0).
     * @param asset O endereço do ativo.
     * @param price O preço inválido retornado.
     */
    error InvalidPrice(address asset, int256 price);

    /**
     * @notice Erro emitido quando não há um feed de preço configurado para o ativo.
     * @param asset O endereço do ativo.
     */
    error PriceFeedNotSet(address asset);

    /**
     * @notice Erro emitido quando o endereço do feed de preço é o endereço zero.
     */
    error InvalidPriceFeedAddress();

    /**
     * @notice Erro emitido quando um chamador não autorizado tenta acessar uma função.
     * @param caller O endereço do chamador não autorizado.
     */
    error NotAuthorized(address caller);

    // ---
    // Events
    // ---

    /**
     * @notice Emitido quando um feed de preço é adicionado ou atualizado.
     * @param asset O endereço do ativo (ex: WETH).
     * @param feed O endereço do contrato do feed de preço da Chainlink.
     */
    event PriceFeedUpdated(address indexed asset, address indexed feed);

    /**
     * @notice Emitido quando um endereço é autorizado ou desautorizado.
     * @param user O endereço que foi autorizado/desautorizado.
     * @param authorized O novo status de autorização.
     */
    event AuthorizationSet(address indexed user, bool authorized);

    // ---
    // Modifiers
    // ---

    modifier onlyAuthorized() {
        if (!isAuthorized[msg.sender]) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    // ---
    // State
    // ---

    /// @notice Período máximo (em segundos) que um preço pode ter antes de ser considerado desatualizado.
    uint256 public immutable STALE_PRICE_TIMEOUT;

    /// @notice Mapeamento do endereço de um ativo para o endereço do seu feed de preço.
    mapping(address => AggregatorV3Interface) private s_priceFeeds;

    /// @notice Mapeamento de endereços autorizados a chamar a função `getPrice`.
    mapping(address => bool) public isAuthorized;

    // ---
    // Constants
    // ---

    /// @notice O número de casas decimais para o qual todos os preços serão padronizados.
    uint8 public constant PRICE_DECIMALS = 18;

    // ---
    // Constructor
    // ---

    constructor(uint256 _stalePriceTimeout) Ownable(msg.sender) {
        STALE_PRICE_TIMEOUT = _stalePriceTimeout;
    }

    // ---
    // External Functions
    // ---

    /**
     * @notice Obtém o preço mais recente de um ativo, padronizado para 18 decimais.
     * @dev Inclui verificações de segurança para preços desatualizados ou inválidos.
     * @param _asset O endereço do token do ativo.
     * @return price O preço do ativo, em USD com 18 casas decimais.
     */
    function getPrice(address _asset) external view onlyAuthorized returns (uint256) {
        AggregatorV3Interface priceFeed = s_priceFeeds[_asset];
        if (address(priceFeed) == address(0)) {
            revert PriceFeedNotSet(_asset);
        }

        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        if (answer <= 0) {
            revert InvalidPrice(_asset, answer);
        }

        if (block.timestamp - updatedAt > STALE_PRICE_TIMEOUT) {
            revert StalePrice(_asset, updatedAt);
        }

        uint8 decimals = priceFeed.decimals();
        return uint256(answer) * (10**(uint256(PRICE_DECIMALS - decimals)));
    }

    // ---
    // Admin Functions
    // ---

    /**
     * @notice Define ou atualiza o endereço do feed de preço para um ativo.
     * @dev Apenas o proprietário (governança) pode chamar esta função.
     * @param _asset O endereço do token do ativo.
     * @param _feed O endereço do contrato do feed de preço da Chainlink.
     */
    function setPriceFeed(address _asset, address _feed) external onlyOwner {
        if (_feed == address(0)) {
            revert InvalidPriceFeedAddress();
        }
        s_priceFeeds[_asset] = AggregatorV3Interface(_feed);
        emit PriceFeedUpdated(_asset, _feed);
    }

    /**
     * @notice Autoriza ou desautoriza um endereço a chamar a função `getPrice`.
     * @dev Apenas o proprietário (governança) pode chamar esta função.
     * @param _user O endereço a ser autorizado/desautorizado.
     * @param _authorized O status de autorização.
     */
    function setAuthorization(address _user, bool _authorized) external onlyOwner {
        isAuthorized[_user] = _authorized;
        emit AuthorizationSet(_user, _authorized);
    }
}
