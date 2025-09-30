// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "./tokens/SCC_USD.sol";
import "./mocks/MockOracle.sol"; // Using mock for now

/**
 * @title SCC Vault
 * @dev This contract represents a user's Collateralized Debt Position (CDP) as an NFT.
 * Each Vault holds a user's collateral and tracks their SCC-USD debt.
 */
contract Vault is ERC721, Ownable {
    using SafeERC20 for IERC20;

    // --- Events ---
    event CollateralDeposited(uint256 amount);
    event CollateralWithdrawn(uint256 amount);
    event SccUsdMinted(uint256 amount);
    event SccUsdBurned(uint256 amount);

    // --- State Variables ---
    IERC20 public immutable collateralToken;
    SCC_USD public immutable sccUsdToken;
    MockOracle public immutable oracle;

    uint256 public collateralAmount;
    uint256 public debtAmount;

    uint256 public constant MIN_COLLATERALIZATION_RATIO = 150; // 150%

    // --- Errors ---
    error ZeroAddress();
    error InsufficientCollateral();
    error AmountExceedsDebt();

    constructor(
        address initialOwner,
        address _collateralToken,
        address _sccUsdToken,
        address _oracle
    ) ERC721("SCC Vault", "SCCV") Ownable(initialOwner) {
        if (_collateralToken == address(0) || _sccUsdToken == address(0) || _oracle == address(0)) {
            revert ZeroAddress();
        }
        collateralToken = IERC20(_collateralToken);
        sccUsdToken = SCC_USD(_sccUsdToken);
        oracle = MockOracle(_oracle);
    }

    // --- Functions for Collateral Management ---

    function depositCollateral(uint256 _amount) public onlyOwner {
        collateralAmount += _amount;
        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(_amount);
    }

    function withdrawCollateral(uint256 _amount) public onlyOwner {
        uint256 newCollateralAmount = collateralAmount - _amount;

        // If there is debt, we must check if the withdrawal is safe
        if (debtAmount > 0) {
            uint256 collateralValue = (newCollateralAmount * oracle.getPrice()) / 1e18;
            uint256 collateralizationRatio = (collateralValue * 100) / debtAmount;

            if (collateralizationRatio < MIN_COLLATERALIZATION_RATIO) {
                revert InsufficientCollateral();
            }
        }

        collateralAmount = newCollateralAmount;
        collateralToken.safeTransfer(owner(), _amount);
        emit CollateralWithdrawn(_amount);
    }

    // --- Functions for Debt Management ---

    function mint(uint256 _amount) public onlyOwner {
        uint256 collateralValue = (collateralAmount * oracle.getPrice()) / 1e18;
        uint256 newDebt = debtAmount + _amount;
        uint256 collateralizationRatio = (collateralValue * 100) / newDebt;

        if (collateralizationRatio < MIN_COLLATERALIZATION_RATIO) {
            revert InsufficientCollateral();
        }

        debtAmount = newDebt;
        // Important: The Vault contract must be the owner of the SCC_USD contract
        // or have the MINTER_ROLE to call this function.
        sccUsdToken.mint(owner(), _amount);
        emit SccUsdMinted(_amount);
    }

    function burn(uint256 _amount) public onlyOwner {
        if (_amount > debtAmount) {
            revert AmountExceedsDebt();
        }
        debtAmount -= _amount;
        // The Vault, as owner of sccUsdToken, burns tokens from the vault owner's balance.
        sccUsdToken.burn(owner(), _amount);
        emit SccUsdBurned(_amount);
    }
}
