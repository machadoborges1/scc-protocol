// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "./tokens/SCC_USD.sol";
import "./OracleManager.sol";

/**
 * @title SCC Vault
 * @author Humberto
 * @dev This contract represents a user's Collateralized Debt Position (CDP) as an NFT.
 * Each Vault holds a user's collateral and tracks their SCC-USD debt.
 * @custom:security-contact security@example.com
 * @custom:legacy The previous version of this contract did not include NFT functionality.
 */
contract Vault is ERC721, Ownable {
    using SafeERC20 for IERC20;

    // --- Events ---
    /**
     * @notice Emitted when collateral is deposited into the vault.
     */
    event CollateralDeposited(uint256 amount);
    /**
     * @notice Emitted when collateral is withdrawn from the vault.
     */
    event CollateralWithdrawn(uint256 amount);
    /**
     * @notice Emitted when SCC-USD is minted.
     */
    event SccUsdMinted(uint256 amount);
    /**
     * @notice Emitted when SCC-USD is burned.
     */
    event SccUsdBurned(uint256 amount);
    event LiquidationManagerSet(address indexed manager);

    // --- State Variables ---
    /**
     * @notice The address of the ERC20 token used as collateral.
     */
    IERC20 public immutable collateralToken;
    /**
     * @notice The address of the SCC-USD stablecoin token.
     */
    SCC_USD public immutable sccUsdToken;
    /**
     * @notice The OracleManager contract used to fetch collateral prices.
     */
    OracleManager public immutable oracle;

    /**
     * @notice The address of the LiquidationManager contract, authorized to perform liquidations.
     */
    address public liquidationManager;

    /**
     * @notice The current amount of collateral held in this vault.
     */
    uint256 public collateralAmount;
    /**
     * @notice The current amount of SCC-USD debt associated with this vault.
     */
    uint256 public debtAmount;

    /**
     * @notice The minimum collateralization ratio required for the vault (e.g., 150 for 150%).
     */
    uint256 public constant MIN_COLLATERALIZATION_RATIO = 150; // 150%

    // --- Errors ---
    error ZeroAddress();
    error InsufficientCollateral();
    error AmountExceedsDebt();
    error NotLiquidationManager();

    // --- Modifiers ---
    modifier onlyLiquidationManager() {
        if (msg.sender != liquidationManager) {
            revert NotLiquidationManager();
        }
        _;
    }

    constructor(address initialOwner, address _collateralToken, address _sccUsdToken, address _oracle)
        ERC721("SCC Vault", "SCCV")
        Ownable(initialOwner)
    {
        if (_collateralToken == address(0) || _sccUsdToken == address(0) || _oracle == address(0)) {
            revert ZeroAddress();
        }
        collateralToken = IERC20(_collateralToken);
        sccUsdToken = SCC_USD(_sccUsdToken);
        oracle = OracleManager(_oracle);
    }

    // --- Owner Functions ---

    /**
     * @notice Sets the address of the LiquidationManager contract.
     * @dev Only the owner (the user who created the vault) can call this.
     * In a real scenario, this would likely be set by the VaultFactory.
     */
    function setLiquidationManager(address _manager) external onlyOwner {
        if (_manager == address(0)) {
            revert ZeroAddress();
        }
        liquidationManager = _manager;
        emit LiquidationManagerSet(_manager);
    }

    // --- Functions for Collateral Management ---

    /**
     * @notice Deposits collateral into the vault.
     * @dev Only the owner of the vault can deposit collateral.
     * The collateral token is transferred from the owner to this contract.
     * @param _amount The amount of collateral tokens to deposit.
     */
    function depositCollateral(uint256 _amount) public onlyOwner {
        collateralAmount += _amount;
        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(_amount);
    }

    /**
     * @notice Withdraws collateral from the vault.
     * @dev Only the owner of the vault can withdraw collateral.
     * Ensures that the collateralization ratio remains above the minimum after withdrawal if there is debt.
     * @param _amount The amount of collateral tokens to withdraw.
     */
    function withdrawCollateral(uint256 _amount) public onlyOwner {
        uint256 newCollateralAmount = collateralAmount - _amount;

        // If there is debt, we must check if the withdrawal is safe
        if (debtAmount > 0) {
            uint256 collateralValue = (newCollateralAmount * oracle.getPrice(address(collateralToken))) / 1e18;
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

    /**
     * @notice Mints SCC-USD tokens against the collateral in the vault.
     * @dev Only the owner of the vault can mint SCC-USD.
     * Ensures that the collateralization ratio remains above the minimum after minting.
     * The Vault contract must have the MINTER_ROLE on the SCC_USD contract.
     * @param _amount The amount of SCC-USD to mint.
     */
    function mint(uint256 _amount) public onlyOwner {
        uint256 collateralValue = (collateralAmount * oracle.getPrice(address(collateralToken))) / 1e18;
        uint256 newDebt = debtAmount + _amount;
        uint256 collateralizationRatio = (collateralValue * 100) / newDebt;

        if (collateralizationRatio < MIN_COLLATERALIZATION_RATIO) {
            revert InsufficientCollateral();
        }

        debtAmount = newDebt;
        // Important: The Vault contract must have the MINTER_ROLE on the SCC_USD contract.
        sccUsdToken.mint(owner(), _amount);
        emit SccUsdMinted(_amount);
    }

    /**
     * @notice Burns SCC-USD tokens to reduce the debt in the vault.
     * @dev Only the owner of the vault can burn SCC-USD.
     * The user must approve this contract to spend their SCC_USD.
     * @param _amount The amount of SCC-USD to burn.
     */
    function burn(uint256 _amount) public onlyOwner {
        if (_amount > debtAmount) {
            revert AmountExceedsDebt();
        }
        debtAmount -= _amount;
        // The user must approve this contract to spend their SCC_USD.
        sccUsdToken.burn(owner(), _amount);
        emit SccUsdBurned(_amount);
    }

    // --- Liquidation Functions ---

    /**
     * @notice Allows the LiquidationManager to transfer collateral out during an auction.
     * @param _to The recipient of the collateral (the auction buyer).
     * @param _amount The amount of collateral to transfer.
     */
    function transferCollateralTo(address _to, uint256 _amount) external onlyLiquidationManager {
        collateralToken.safeTransfer(_to, _amount);
    }
}
