// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OracleManager
 * @author Humberto
 * @notice This contract manages Chainlink price feeds for the SCC protocol.
 * It provides a standardized and secure interface to get asset prices,
 * including critical security checks.
 * @custom:security-contact security@example.com
 * @custom:legacy The previous version of this contract did not include authorization for `getPrice`.
 */
contract OracleManager is AccessControl {
    // ---
    // Errors
    // ---

    /**
     * @notice Error thrown when an asset's price is stale.
     * @param asset The address of the asset whose price is stale.
     * @param updatedAt The timestamp of the last price update.
     */
    error StalePrice(address asset, uint256 updatedAt);

    /**
     * @notice Error thrown when the oracle returns an invalid price (<= 0).
     * @param asset The address of the asset.
     * @param price The invalid price returned.
     */
    error InvalidPrice(address asset, int256 price);

    /**
     * @notice Error thrown when there is no price feed configured for an asset.
     * @param asset The address of the asset.
     */
    error PriceFeedNotSet(address asset);

    /**
     * @notice Error thrown when the price feed address is the zero address.
     */
    error InvalidPriceFeedAddress();

    /**
     * @notice Error thrown when an unauthorized caller tries to access a function.
     * @param caller The address of the unauthorized caller.
     */
    error NotAuthorized(address caller);

    // ---
    // Events
    // ---

    /**
     * @notice Emitted when a price feed is added or updated.
     * @param asset The asset's address (e.g., WETH).
     * @param feed The address of the Chainlink price feed contract.
     */
    event PriceFeedUpdated(address indexed asset, address indexed feed);

    /**
     * @notice Emitted when an address is authorized or de-authorized.
     * @param user The address that was authorized/de-authorized.
     * @param authorized The new authorization status.
     */
    event AuthorizationSet(address indexed user, bool authorized);

    // ---
    // Modifiers
    // ---

    /**
     * @notice Restricts function access to authorized addresses only.
     * @dev Reverts with `NotAuthorized` if the caller is not authorized.
     */
    modifier onlyAuthorized() {
        if (!isAuthorized[msg.sender]) {
            revert NotAuthorized(msg.sender);
        }
        _;
    }

    // ---
    // State
    // ---

    /// @notice Maximum period (in seconds) a price can be stale before it's considered invalid.
    uint256 public immutable STALE_PRICE_TIMEOUT;

    /// @notice Mapping from an asset address to its price feed address.
    mapping(address => AggregatorV3Interface) private s_priceFeeds;

    /// @notice Mapping of addresses authorized to call the `getPrice` function.
    mapping(address => bool) public isAuthorized;

    // ---
    // Constants
    // ---

    /// @notice The number of decimals to which all prices will be standardized.
    uint8 public constant PRICE_DECIMALS = 18;

    /// @notice Role for addresses that are allowed to authorize/de-authorize `getPrice` callers.
    bytes32 public constant AUTHORIZER_ROLE = keccak256("AUTHORIZER_ROLE");

    // ---
    // Constructor
    // ---

    /**
     * @notice Initializes the OracleManager contract.
     * @param _stalePriceTimeout The maximum time (in seconds) a price feed can be considered valid.
     */
    constructor(uint256 _stalePriceTimeout) {
        STALE_PRICE_TIMEOUT = _stalePriceTimeout;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AUTHORIZER_ROLE, msg.sender);
    }

    // ---
    // External Functions
    // ---

    /**
     * @notice Gets the latest price of an asset, standardized to 18 decimals.
     * @dev Includes security checks for stale or invalid prices.
     * @param _asset The address of the asset's token.
     * @return price The price of the asset in USD, with 18 decimals.
     */
    function getPrice(address _asset) external view onlyAuthorized returns (uint256) {
        AggregatorV3Interface priceFeed = s_priceFeeds[_asset];
        if (address(priceFeed) == address(0)) {
            revert PriceFeedNotSet(_asset);
        }

        (, int256 answer,, uint256 updatedAt,) = priceFeed.latestRoundData();

        if (answer <= 0) {
            revert InvalidPrice(_asset, answer);
        }

        if (block.timestamp - updatedAt > STALE_PRICE_TIMEOUT) {
            revert StalePrice(_asset, updatedAt);
        }

        uint8 decimals = priceFeed.decimals();
        return uint256(answer) * (10 ** (uint256(PRICE_DECIMALS - decimals)));
    }

    // ---
    // Admin Functions
    // ---

    /**
     * @notice Sets or updates the price feed address for an asset.
     * @dev Only accounts with the DEFAULT_ADMIN_ROLE (governance) can call this function.
     * @param _asset The address of the asset's token.
     * @param _feed The address of the Chainlink price feed contract.
     */
    function setPriceFeed(address _asset, address _feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_feed == address(0)) {
            revert InvalidPriceFeedAddress();
        }
        s_priceFeeds[_asset] = AggregatorV3Interface(_feed);
        emit PriceFeedUpdated(_asset, _feed);
    }

    /**
     * @notice Authorizes or de-authorizes an address to call the `getPrice` function.
     * @dev Only accounts with the AUTHORIZER_ROLE (e.g., VaultFactory) can call this function.
     * @param _user The address to be authorized/de-authorized.
     * @param _authorized The authorization status.
     */
    function setAuthorization(address _user, bool _authorized) external onlyRole(AUTHORIZER_ROLE) {
        isAuthorized[_user] = _authorized;
        emit AuthorizationSet(_user, _authorized);
    }
}
