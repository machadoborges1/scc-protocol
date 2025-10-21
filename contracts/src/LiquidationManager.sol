// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/console.sol";

import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/utils/math/Math.sol";
import "./Vault.sol";
import "./tokens/SCC_USD.sol";
import "./OracleManager.sol";

/**
 * @title LiquidationManager
 * @author Humberto
 * @dev Handles the liquidation of unhealthy Vaults via Dutch Auctions.
 * The price of collateral starts high and decays over time until a buyer intervenes.
 * This model is inspired by MakerDAO's Clipper contract.
 * @custom:security-contact security@example.com
 * @custom:legacy The previous version of this contract used a different liquidation mechanism.
 */
contract LiquidationManager is Ownable {
    using SafeERC20 for SCC_USD;

    // --- Structs ---

    struct Auction {
        uint256 collateralAmount; // The amount of collateral for sale (lot)
        uint256 debtToCover; // The amount of SCC-USD to be raised (tab)
        address vaultAddress; // The address of the vault being liquidated
        uint96 startTime; // The timestamp when the auction started (tic)
        uint256 startPrice; // The initial price of collateral in SCC-USD (top)
    }

    // --- State Variables ---

    /**
     * @notice The OracleManager contract used to fetch collateral prices.
     */
    OracleManager public immutable oracle;
    /**
     * @notice The SCC_USD token contract, used for debt and payments.
     */
    SCC_USD public immutable sccUsdToken;

    /**
     * @notice Counter for unique auction IDs.
     */
    uint256 public auctionIdCounter;
    /**
     * @notice Mapping from auction ID to its Auction struct.
     */
    mapping(uint256 => Auction) public auctions;
    /**
     * @notice Mapping from vault address to its active auction ID.
     */
    mapping(address => uint256) public vaultToAuctionId;

    // --- Dutch Auction Parameters ---

    /**
     * @notice The time in seconds it takes for the auction price to halve.
     */
    uint256 public constant PRICE_DECAY_HALFLIFE = 1 hours; // Time it takes for the auction price to halve.
    /**
     * @notice Multiplier for the starting price of collateral in an auction (e.g., 150 means 150%).
     */
    uint256 public constant START_PRICE_MULTIPLIER = 150; // Multiplier for the starting price (e.g., 150 means 150%).
    /**
     * @notice A small portion of debt that can be left behind to avoid dust amounts during liquidation.
     */
    uint256 public constant DEBT_DUST = 1 ether; // A small portion of debt that can be left behind to avoid dust amounts.

    // --- Events ---

    /**
     * @notice Emitted when a new liquidation auction is started.
     * @param auctionId The unique ID of the auction.
     * @param vaultAddress The address of the vault being liquidated.
     * @param collateralAmount The amount of collateral put up for sale.
     * @param debtToCover The amount of debt to be covered by the auction.
     * @param startPrice The initial price of the collateral in SCC-USD.
     */
    event AuctionStarted(
        uint256 indexed auctionId,
        address indexed vaultAddress,
        uint256 collateralAmount,
        uint256 debtToCover,
        uint256 startPrice
    );
    /**
     * @notice Emitted when a portion of an auction's collateral is bought.
     * @param auctionId The unique ID of the auction.
     * @param buyer The address of the buyer.
     * @param collateralBought The amount of collateral bought.
     * @param debtPaid The amount of debt paid by the buyer.
     */
    event AuctionBought(uint256 indexed auctionId, address indexed buyer, uint256 collateralBought, uint256 debtPaid);
    /**
     * @notice Emitted when an auction is closed (either fully bought or debt covered).
     * @param auctionId The unique ID of the auction.
     * @param vaultAddress The address of the vault associated with the closed auction.
     */
    event AuctionClosed(uint256 indexed auctionId, address indexed vaultAddress);

    // --- Errors ---

    error VaultNotLiquidatable();
    error ZeroAddress();
    error AuctionAlreadyActive();
    error AuctionNotFound();
    error InvalidPurchaseAmount();
    error PriceNotAvailable();

    /**
     * @notice Initializes the LiquidationManager contract.
     * @param initialOwner The address of the initial owner of the contract.
     * @param _oracle The address of the OracleManager contract.
     * @param _sccUsdToken The address of the SCC_USD token contract.
     */
    constructor(address initialOwner, address _oracle, address _sccUsdToken) Ownable(initialOwner) {
        if (_oracle == address(0) || _sccUsdToken == address(0)) {
            revert ZeroAddress();
        }
        oracle = OracleManager(_oracle);
        sccUsdToken = SCC_USD(_sccUsdToken);
    }

    // --- Owner Functions ---

    /**
     * @notice Allows the owner (governance) to withdraw collected SCC-USD fees.
     * @param _recipient The address to send the fees to.
     * @param _amount The amount of SCC-USD to withdraw.
     */
    function withdrawFees(address _recipient, uint256 _amount) external onlyOwner {
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        sccUsdToken.safeTransfer(_recipient, _amount);
    }

    /**
     * @notice Starts a Dutch auction for an unhealthy vault.
     * @param _vaultAddress The address of the vault to liquidate.
     */
    function startAuction(address _vaultAddress) external {
        Vault vault = Vault(_vaultAddress);
        uint256 collateralAmount = vault.collateralAmount();
        uint256 debtAmount = vault.debtAmount();
        address collateralToken = address(vault.collateralToken());

        // Check if vault is liquidatable
        if (debtAmount == 0) {
            revert VaultNotLiquidatable();
        }
        uint256 price = oracle.getPrice(collateralToken);
        if (price == 0) revert PriceNotAvailable();
        uint256 collateralValue = (collateralAmount * price) / 1e18;
        uint256 collateralizationRatio = (collateralValue * 100) / debtAmount;

        if (collateralizationRatio >= vault.MIN_COLLATERALIZATION_RATIO()) {
            revert VaultNotLiquidatable();
        }
        if (vaultToAuctionId[_vaultAddress] != 0) {
            revert AuctionAlreadyActive();
        }

        auctionIdCounter++;
        uint256 currentAuctionId = auctionIdCounter;

        // Calculate starting price (oracle price * multiplier)
        uint256 startPrice = (price * START_PRICE_MULTIPLIER) / 100;

        auctions[currentAuctionId] = Auction({
            collateralAmount: collateralAmount,
            debtToCover: debtAmount,
            vaultAddress: _vaultAddress,
            startTime: uint96(block.timestamp),
            startPrice: startPrice
        });
        vaultToAuctionId[_vaultAddress] = currentAuctionId;

        // IMPORTANT: The Vault must be configured to allow this contract to transfer its collateral.

        emit AuctionStarted(currentAuctionId, _vaultAddress, collateralAmount, debtAmount, startPrice);
    }

    /**
     * @notice Buys collateral from an ongoing Dutch auction.
     * @dev This is an atomic function. The buyer pays SCC-USD and receives collateral in one transaction.
     * @param _auctionId The ID of the auction.
     * @param _collateralToBuy The amount of collateral the user wants to buy.
     */
    function buy(uint256 _auctionId, uint256 _collateralToBuy) external {
        console.log("\n--- DEBUG BUY ---");
        Auction storage auction = auctions[_auctionId];

        if (auction.startTime == 0) {
            revert AuctionNotFound();
        }
        console.log("Input _collateralToBuy:", _collateralToBuy);
        console.log("auction.collateralAmount:", auction.collateralAmount);

        if (_collateralToBuy == 0 || _collateralToBuy > auction.collateralAmount) {
            revert InvalidPurchaseAmount();
        }

        uint256 currentPrice = getCurrentPrice(_auctionId);
        console.log("currentPrice:", currentPrice);

        uint256 debtToPay = (_collateralToBuy * currentPrice) / 1e18;
        console.log("Initial debtToPay:", debtToPay);
        console.log("auction.debtToCover:", auction.debtToCover);

        // If the purchase would overpay the debt, cap it.
        if (debtToPay > auction.debtToCover) {
            console.log("Path: Overpayment detected. Capping values.");
            debtToPay = auction.debtToCover;
            console.log("Capped debtToPay:", debtToPay);
            // Recalculate collateral to buy based on the capped debt
            _collateralToBuy = (debtToPay * 1e18) / currentPrice;
            console.log("Recalculated _collateralToBuy:", _collateralToBuy);
        }

        // If a partial purchase leaves a tiny non-zero amount of debt, require the buyer to buy the whole lot.
        if (
            auction.debtToCover - debtToPay > 0 && auction.debtToCover - debtToPay < DEBT_DUST
                && _collateralToBuy < auction.collateralAmount
        ) {
            revert InvalidPurchaseAmount(); // Must buy the remaining lot entirely
        }

        console.log("Final _collateralToBuy:", _collateralToBuy);
        console.log("Final debtToPay:", debtToPay);

        // --- Atomic Exchange ---
        // 1. Pull SCC-USD from the buyer
        sccUsdToken.safeTransferFrom(msg.sender, address(this), debtToPay);

        // 2. Transfer collateral to the buyer
        Vault vault = Vault(auction.vaultAddress);
        vault.transferCollateralTo(msg.sender, _collateralToBuy);

        // --- Update State ---
        auction.collateralAmount -= _collateralToBuy;
        auction.debtToCover -= debtToPay;

        emit AuctionBought(_auctionId, msg.sender, _collateralToBuy, debtToPay);

        // --- Close Auction if Finished ---
        bool isFinished = auction.debtToCover <= DEBT_DUST || auction.collateralAmount == 0;
        if (isFinished) {
            console.log("Path: Auction finished. Closing...");
            // If there's remaining collateral after debt is covered, send it back to the vault owner.
            if (auction.collateralAmount > 0) {
                vault.transferCollateralTo(vault.owner(), auction.collateralAmount);
            }

            // The collected SCC-USD is held by this contract. Governance can decide what to do with it.

            // Clean up
            _closeAuction(_auctionId);
        }
    }

    /**
     * @notice Calculates the current price of collateral in an auction.
     * @dev Uses a simple linear decay model. Price halves over PRICE_DECAY_HALFLIFE.
     * @param _auctionId The ID of the auction.
     * @return The current price of one unit of collateral in SCC-USD.
     */
    /**
     * @notice Calculates the current price of collateral in an auction.
     * @dev Uses a simple linear decay model. Price halves over PRICE_DECAY_HALFLIFE.
     * @param _auctionId The ID of the auction.
     * @return The current price of one unit of collateral in SCC-USD.
     */
    function getCurrentPrice(uint256 _auctionId) public view returns (uint256) {
        Auction storage auction = auctions[_auctionId];
        if (auction.startTime == 0) {
            return 0;
        }

        console.log("block.timestamp:", block.timestamp);
        uint256 elapsedTime = block.timestamp - auction.startTime;
        console.log("elapsedTime:", elapsedTime);
        console.log("auction.startPrice:", auction.startPrice);


        // Price decay logic: price = startPrice * (1 - elapsedTime / (2 * HALFLIFE))
        // This is a linear approximation of exponential decay.
        if (elapsedTime >= 2 * PRICE_DECAY_HALFLIFE) {
            return 0; // Price has decayed to zero or less
        }

        uint256 decay = (auction.startPrice * elapsedTime) / (2 * PRICE_DECAY_HALFLIFE);
        console.log("decay:", decay);
        console.log("return value:", auction.startPrice - decay);
        return auction.startPrice - decay;
    }

    /**
     * @dev Internal function to clean up auction state.
     */
    /**
     * @dev Internal function to clean up auction state.
     * @param _auctionId The ID of the auction to close.
     */
    function _closeAuction(uint256 _auctionId) internal {
        Auction storage auction = auctions[_auctionId];
        address vaultAddress = auction.vaultAddress;

        emit AuctionClosed(_auctionId, vaultAddress);

        delete vaultToAuctionId[vaultAddress];
        delete auctions[_auctionId];
    }
}
