// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/OracleManager.sol";
import "src/mocks/MockV3Aggregator.sol";
import "src/mocks/MockERC20.sol";

contract VaultTest is Test {
    Vault public vault;
    SCC_USD public sccUsd;
    OracleManager public oracleManager;
    MockV3Aggregator public wethPriceFeed;
    MockERC20 public weth;

    address public owner = makeAddr("owner");
    uint256 public constant WETH_AMOUNT = 10e18; // 10 WETH
    int256 public constant WETH_PRICE = 3000e8; // $3000 with 8 decimals

    function setUp() public {
        // 1. Deploy tokens FIRST
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(owner);

        // 2. Deploy Oracle and its mock feed
        oracleManager = new OracleManager(1 hours);
        wethPriceFeed = new MockV3Aggregator(8, WETH_PRICE);
        oracleManager.setPriceFeed(address(weth), address(wethPriceFeed));

        // 3. Deploy the Vault, passing the OracleManager address
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracleManager));

        // 4. Authorize the Vault to use the OracleManager
        oracleManager.setAuthorization(address(vault), true);

        // 5. Fund owner with WETH
        weth.mint(owner, WETH_AMOUNT);

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);

        // 6. Transfer SCC_USD ownership to the Vault so it can mint
        sccUsd.transferOwnership(address(vault));

        // 7. Approve vault to spend WETH and deposit collateral
        weth.approve(address(vault), WETH_AMOUNT);
        vault.depositCollateral(WETH_AMOUNT);

        // 8. Mint some debt to create a starting position (CR = 200%)
        // Collateral: 10 WETH @ $3000 = $30,000. Debt = $15,000
        vault.mint(15_000e18);

        vm.stopPrank();
    }

    function test_Fail_Mint_InsufficientCollateral() public {
        // We want to mint just enough to push CR below 150%
        // Current Collateral Value = 10 * 3000 = $30,000
        // Max Debt at 150% CR = $30,000 / 1.5 = $20,000
        // Current Debt = $15,000
        // Max additional mint = $5,000
        // We try to mint $5,001
        uint256 amountToMint = 5_001e18;

        vm.prank(owner);
        vm.expectRevert(Vault.InsufficientCollateral.selector);
        vault.mint(amountToMint);
    }

    function test_Mint_Success() public {
        uint256 amountToMint = 1_000e18;
        uint256 expectedNewDebt = vault.debtAmount() + amountToMint;

        vm.prank(owner);
        vault.mint(amountToMint);

        assertEq(vault.debtAmount(), expectedNewDebt);
    }

    function test_Burn_Success() public {
        uint256 amountToBurn = 3_000e18;
        uint256 expectedNewDebt = vault.debtAmount() - amountToBurn;

        vm.prank(owner);
        vault.burn(amountToBurn);

        assertEq(vault.debtAmount(), expectedNewDebt);
    }

    function test_Fail_Burn_ExceedsDebt() public {
        uint256 amountToBurn = vault.debtAmount() + 1;

        vm.prank(owner);
        vm.expectRevert(Vault.AmountExceedsDebt.selector);
        vault.burn(amountToBurn);
    }

    function test_WithdrawCollateral_Success() public {
        uint256 amountToWithdraw = 1e18;
        uint256 ownerBalanceBefore = weth.balanceOf(owner);

        vm.prank(owner);
        vault.withdrawCollateral(amountToWithdraw);

        assertEq(vault.collateralAmount(), 9e18);
        assertEq(weth.balanceOf(owner), ownerBalanceBefore + amountToWithdraw);
    }

    function test_Fail_WithdrawCollateral_InsufficientCollateral() public {
        // Withdraw 4 WETH. New collateral = 6 WETH ($18k). Debt = 15k. CR = 120% < 150%. Should fail.
        uint256 amountToWithdraw = 4e18;

        vm.prank(owner);
        vm.expectRevert(Vault.InsufficientCollateral.selector);
        vault.withdrawCollateral(amountToWithdraw);
    }

    function test_WithdrawCollateral_AfterRepay() public {
        uint256 initialDebt = vault.debtAmount();

        vm.startPrank(owner);
        vault.burn(initialDebt);

        uint256 collateralBalance = vault.collateralAmount();
        vault.withdrawCollateral(collateralBalance);
        vm.stopPrank();

        assertEq(vault.collateralAmount(), 0);
        assertEq(weth.balanceOf(owner), WETH_AMOUNT);
    }
}
