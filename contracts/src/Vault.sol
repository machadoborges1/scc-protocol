// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./tokens/SCC_USD.sol";
import "./OracleManager.sol";
import "./SCC_Parameters.sol";

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
    event CollateralDeposited(uint256 amount);
    event CollateralWithdrawn(uint256 amount);
    event SccUsdMinted(uint256 amount);
    event SccUsdBurned(uint256 amount);

    // --- State Variables ---
    IERC20 public immutable collateralToken;
    SCC_USD public immutable sccUsdToken;
    OracleManager public immutable oracle;
    address public immutable liquidationManager;
    SCC_Parameters public immutable sccParameters;

    uint256 public collateralAmount;
    uint256 public debtAmount;

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

    constructor(
        address initialOwner,
        address _collateralToken,
        address _sccUsdToken,
        address _oracle,
        address _liquidationManager,
        address _sccParameters
    ) ERC721("SCC Vault", "SCCV") Ownable(initialOwner) {
        if (
            _collateralToken == address(0) ||
            _sccUsdToken == address(0) ||
            _oracle == address(0) ||
            _liquidationManager == address(0) ||
            _sccParameters == address(0)
        ) {
            revert ZeroAddress();
        }
        collateralToken = IERC20(_collateralToken);
        sccUsdToken = SCC_USD(_sccUsdToken);
        oracle = OracleManager(_oracle);
        liquidationManager = _liquidationManager;
        sccParameters = SCC_Parameters(_sccParameters);
    }

    // --- Functions for Collateral Management ---

    function depositCollateral(uint256 _amount) public onlyOwner {
        collateralAmount += _amount;
        collateralToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit CollateralDeposited(_amount);
    }

    function withdrawCollateral(uint256 _amount) public onlyOwner {
        uint256 newCollateralAmount = collateralAmount - _amount;

        if (debtAmount > 0) {
            uint256 collateralValue = (newCollateralAmount * oracle.getPrice(address(collateralToken))) / 1e18;
            uint256 collateralizationRatio = (collateralValue * 100) / debtAmount;

            uint256 minCollateralizationRatio = sccParameters.minCollateralizationRatio();
            if (collateralizationRatio < minCollateralizationRatio) {
                revert InsufficientCollateral();
            }
        }

        collateralAmount = newCollateralAmount;
        collateralToken.safeTransfer(owner(), _amount);
        emit CollateralWithdrawn(_amount);
    }

    // --- Functions for Debt Management ---

    function mint(uint256 _amount) public onlyOwner {
        uint256 collateralValue = (collateralAmount * oracle.getPrice(address(collateralToken))) / 1e18;
        uint256 newDebt = debtAmount + _amount;
        uint256 collateralizationRatio = (collateralValue * 100) / newDebt;

        uint256 minCollateralizationRatio = sccParameters.minCollateralizationRatio();
        if (collateralizationRatio < minCollateralizationRatio) {
            revert InsufficientCollateral();
        }

        debtAmount = newDebt;
        sccUsdToken.mint(owner(), _amount);
        emit SccUsdMinted(_amount);
    }

    function burn(uint256 _amount) public onlyOwner {
        if (_amount > debtAmount) {
            revert AmountExceedsDebt();
        }
        debtAmount -= _amount;
        sccUsdToken.burnFrom(owner(), _amount);
        emit SccUsdBurned(_amount);
    }

    function MIN_COLLATERALIZATION_RATIO() public view returns (uint256) {
        return sccParameters.minCollateralizationRatio();
    }

    // --- Liquidation Functions ---

    function transferCollateralTo(address _to, uint256 _amount) external onlyLiquidationManager {
        collateralToken.safeTransfer(_to, _amount);
    }

    function reduceCollateral(uint256 _amount) external onlyLiquidationManager {
        collateralAmount -= _amount;
    }

    function reduceDebt(uint256 _amount) external onlyLiquidationManager {
        debtAmount -= _amount;
    }
}
