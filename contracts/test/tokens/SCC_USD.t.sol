// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/tokens/SCC_USD.sol";

contract SCC_USD_Test is Test {
    SCC_USD public sccUSD;

    address owner = makeAddr("owner");

    function setUp() public {
        // Deploy the contract as the owner
        vm.prank(owner);
        sccUSD = new SCC_USD(owner);
    }

    function test_NameAndSymbol() public view {
        assertEq(sccUSD.name(), "SCC Stablecoin");
        assertEq(sccUSD.symbol(), "SCC-USD");
    }

    function test_OwnerCanMint() public {
        vm.prank(owner);
        sccUSD.mint(address(this), 100e18);
        assertEq(sccUSD.balanceOf(address(this)), 100e18);
    }

    function test_Fail_NonOwnerCannotMint() public {
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        // This test expects the transaction to revert
        vm.expectRevert();
        sccUSD.mint(address(this), 100e18);
    }
}
