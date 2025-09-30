// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vault.sol";
import "./tokens/SCC_USD.sol";
import "./mocks/MockOracle.sol"; // Using mock for now

/**
 * @title LiquidationManager
 * @dev This contract handles the liquidation of unhealthy Vaults to ensure protocol solvency.
 */
contract LiquidationManager is Ownable {
    using SafeERC20 for SCC_USD;

    // --- Structs ---
    struct Auction {
        uint256 collateralAmount;
        uint256 debtToCover;
        address highestBidder;
        uint256 highestBid;
        uint256 auctionEndTime;
        bool isActive;
    }

    // --- State Variables ---
    MockOracle public immutable oracle;
    SCC_USD public immutable sccUsdToken;
    uint256 public auctionId;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public vaultToAuctionId;

    uint256 public constant AUCTION_DURATION = 1 days;
    uint256 public constant MIN_BID_INCREMENT_PERCENTAGE = 5; // Bids must be 5% higher

    // --- Events ---
    event AuctionStarted(uint256 indexed auctionId, address indexed vaultAddress, uint256 collateralAmount, uint256 debtToCover);
    event NewBid(uint256 indexed auctionId, address indexed bidder, uint256 bidAmount);
    event VaultLiquidated(address indexed vaultAddress, address indexed liquidator, uint256 collateralSold, uint256 debtPaid);

    // --- Errors ---
    error VaultNotLiquidatable();
    error ZeroAddress();
    error AuctionAlreadyActive();
    error AuctionNotFound();
    error AuctionEnded();
    error BidTooLow();

    constructor(
        address initialOwner,
        address _oracle,
        address _sccUsdToken
    ) Ownable(initialOwner) {
        if (_oracle == address(0) || _sccUsdToken == address(0)) {
            revert ZeroAddress();
        }
        oracle = MockOracle(_oracle);
        sccUsdToken = SCC_USD(_sccUsdToken);
    }

    function liquidate(address _vaultAddress) external {
        Vault vault = Vault(_vaultAddress);
        uint256 collateralAmount = vault.collateralAmount();
        uint256 debtAmount = vault.debtAmount();
        uint256 collateralValue = (collateralAmount * oracle.getPrice()) / 1e18;
        uint256 collateralizationRatio = (collateralValue * 100) / debtAmount;

        if (collateralizationRatio >= vault.MIN_COLLATERALIZATION_RATIO()) {
            revert VaultNotLiquidatable();
        }
        if (vaultToAuctionId[_vaultAddress] != 0) {
            revert AuctionAlreadyActive();
        }

        auctionId++;
        auctions[auctionId] = Auction({
            collateralAmount: collateralAmount,
            debtToCover: debtAmount,
            highestBidder: address(0),
            highestBid: 0,
            auctionEndTime: block.timestamp + AUCTION_DURATION,
            isActive: true
        });
        vaultToAuctionId[_vaultAddress] = auctionId;

        emit AuctionStarted(auctionId, _vaultAddress, collateralAmount, debtAmount);
    }

    function bid(uint256 _auctionId, uint256 _bidAmount) external {
        Auction storage auction = auctions[_auctionId];

        if (!auction.isActive) {
            revert AuctionNotFound();
        }
        if (block.timestamp >= auction.auctionEndTime) {
            revert AuctionEnded();
        }

        uint256 minBid = (auction.highestBid * (100 + MIN_BID_INCREMENT_PERCENTAGE)) / 100;
        if (auction.highestBid == 0) {
            minBid = 1; // First bid must be at least 1 wei
        }

        if (_bidAmount < minBid) {
            revert BidTooLow();
        }

        // Refund the previous bidder if there was one
        if (auction.highestBidder != address(0)) {
            sccUsdToken.safeTransfer(auction.highestBidder, auction.highestBid);
        }

        // Pull the new bid amount from the new bidder
        sccUsdToken.safeTransferFrom(msg.sender, address(this), _bidAmount);

        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = _bidAmount;

        emit NewBid(_auctionId, msg.sender, _bidAmount);
    }
}
