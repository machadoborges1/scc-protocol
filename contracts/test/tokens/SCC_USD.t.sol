// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/tokens/SCC_USD.sol";

/**
 * @dev Test suite for the SCC_USD stablecoin contract.
 */
contract SCC_USD_Test is Test {
    SCC_USD public sccUSD;

    address owner = makeAddr("owner");

    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        // Deploy the contract as the owner
        vm.prank(owner);
        sccUSD = new SCC_USD(owner);
    }

    /**
     * @notice Tests that the token's name and symbol are correctly set upon deployment.
     */
    function test_NameAndSymbol() public view {
        assertEq(sccUSD.name(), "SCC Stablecoin");
        assertEq(sccUSD.symbol(), "SCC-USD");
    }

    /**
     * @notice Tests that the contract owner can successfully mint tokens.
     */
    function test_OwnerCanMint() public {
        vm.prank(owner);
        sccUSD.mint(address(this), 100e18);
        assertEq(sccUSD.balanceOf(address(this)), 100e18);
    }

    /**
     * @notice Tests that a non-owner address cannot mint tokens.
     */
    function test_Fail_NonOwnerCannotMint() public {
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        // This test expects the transaction to revert
        vm.expectRevert();
        sccUSD.mint(address(this), 100e18);
    }

    /**
     * @notice Tests that a user can burn their own tokens.
     */
    function test_Burn_Success() public {
        address user = makeAddr("user");
        uint256 initialAmount = 100e18;

        // Mint some tokens to the user
        vm.prank(owner);
        sccUSD.mint(user, initialAmount);
        assertEq(sccUSD.balanceOf(user), initialAmount);

        // User burns their own tokens
        vm.prank(user);
        sccUSD.burn(initialAmount);

        assertEq(sccUSD.balanceOf(user), 0);
    }

    /**
     * @notice Tests that a user can burn tokens from another account after approval.
     */
    function test_BurnFrom_Success() public {
        address user = makeAddr("user");
        address spender = makeAddr("spender");
        uint256 initialAmount = 100e18;

        // Mint tokens to user
        vm.prank(owner);
        sccUSD.mint(user, initialAmount);

        // User approves spender
        vm.prank(user);
        sccUSD.approve(spender, initialAmount);

        // Spender burns tokens from user
        vm.prank(spender);
        sccUSD.burnFrom(user, initialAmount);

        assertEq(sccUSD.balanceOf(user), 0);
    }

    /**
     * @notice Tests that burnFrom fails without approval.
     */
    function test_Fail_BurnFrom_WithoutApproval() public {
        address user = makeAddr("user");
        address spender = makeAddr("spender");
        uint256 initialAmount = 100e18;

        // Mint tokens to user
        vm.prank(owner);
        sccUSD.mint(user, initialAmount);

        // Spender tries to burn tokens from user without approval
        vm.prank(spender);
        vm.expectRevert(); // Reverts due to insufficient allowance
        sccUSD.burnFrom(user, initialAmount);
    }
}
