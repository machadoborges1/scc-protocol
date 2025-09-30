// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/mocks/MockOracle.sol";
import "src/mocks/MockERC20.sol";

contract VaultTest is Test {
    Vault public vault;
    SCC_USD public sccUsd;
    MockOracle public oracle;
    MockERC20 public weth;

    address public owner = makeAddr("owner");
    uint256 public constant WETH_AMOUNT = 10e18; // 10 WETH

    function setUp() public {
        // 1. Deploy mocks and tokens
        oracle = new MockOracle();
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(owner);

        // 2. Deploy the Vault
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracle));

        // 3. Fund owner with WETH
        weth.mint(owner, WETH_AMOUNT);

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);

        // 4. Transfer SCC_USD ownership to the Vault so it can mint
        sccUsd.transferOwnership(address(vault));

        // 5. Approve vault to spend WETH and deposit collateral
        weth.approve(address(vault), WETH_AMOUNT);
        vault.depositCollateral(WETH_AMOUNT);

        // 6. Mint some debt to create a starting position (CR = 200%)
        // Collateral: 10 WETH @ $3000 = $30,000. Debt = $15,000
        vault.mint(15_000e18);

        vm.stopPrank();
    }



    function test_Fail_Mint_InsufficientCollateral() public {
        // Collateral: 10 WETH @ $3000/WETH = $30,000
        // We want to mint $20,001 SCC-USD
        // Debt will be $20,001
        // CR = 30000 / 20001 = 149.99% < 150% -> Should fail
        uint256 amountToMint = 20_001e18;

        vm.prank(owner);
        vm.expectRevert(Vault.InsufficientCollateral.selector);
        vault.mint(amountToMint);
    }

    function test_Mint_Success() public {
        // Initial State from setUp: 10 WETH collateral ($30k), 15k debt. CR = 200%
        // Mint another $1k. New debt = $16k. New CR = 187.5% > 150%. Should succeed.
        uint256 amountToMint = 1_000e18;
        uint256 expectedNewDebt = vault.debtAmount() + amountToMint;

        vm.prank(owner);
        vault.mint(amountToMint);

        assertEq(vault.debtAmount(), expectedNewDebt);
    }

    function test_Burn_Success() public {
        // Initial State from setUp: 15k debt.
        uint256 amountToBurn = 3_000e18;
        uint256 expectedNewDebt = vault.debtAmount() - amountToBurn;

        vm.prank(owner);
        vault.burn(amountToBurn);

        assertEq(vault.debtAmount(), expectedNewDebt);
    }

    function test_Fail_Burn_ExceedsDebt() public {
        // Initial State from setUp: 15k debt.
        uint256 amountToBurn = vault.debtAmount() + 1; // Try to burn 1 wei more than the debt

        vm.prank(owner);
        vm.expectRevert(Vault.AmountExceedsDebt.selector);
        vault.burn(amountToBurn);
    }

    function test_WithdrawCollateral_Success() public {
        // Initial State: 10 WETH collateral, 15k debt. CR = 200%
        // Withdraw 1 WETH. New collateral = 9 WETH ($27k). New CR = 180% > 150%. Should succeed.
        uint256 amountToWithdraw = 1e18;

        uint256 ownerBalanceBefore = weth.balanceOf(owner);

        vm.prank(owner);
        vault.withdrawCollateral(amountToWithdraw);

        assertEq(vault.collateralAmount(), 9e18);
        assertEq(weth.balanceOf(owner), ownerBalanceBefore + amountToWithdraw);
    }

    function test_Fail_WithdrawCollateral_InsufficientCollateral() public {
        // Initial State: 10 WETH collateral, 15k debt. CR = 200%
        // Withdraw 6 WETH. New collateral = 4 WETH ($12k). New CR = 80% < 150%. Should fail.
        uint256 amountToWithdraw = 6e18;

        vm.prank(owner);
        vm.expectRevert(Vault.InsufficientCollateral.selector);
        vault.withdrawCollateral(amountToWithdraw);
    }

    function test_WithdrawCollateral_AfterRepay() public {
        // Initial State: 10 WETH collateral, 15k debt.
        uint256 initialDebt = vault.debtAmount();

        // 1. Repay the full debt
        vm.startPrank(owner);
        vault.burn(initialDebt);

        // 2. Withdraw all collateral
        uint256 collateralBalance = vault.collateralAmount();
        vault.withdrawCollateral(collateralBalance);
        vm.stopPrank();

        assertEq(vault.collateralAmount(), 0);
        assertEq(weth.balanceOf(owner), 10e18); // Owner gets all their WETH back
    }
}
