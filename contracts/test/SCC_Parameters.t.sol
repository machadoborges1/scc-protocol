// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

import "../src/SCC_Parameters.sol";

contract SCC_ParametersTest is Test {
    SCC_Parameters public sccParameters;

    address public owner = makeAddr("owner");
    address public nonOwner = makeAddr("nonOwner");

    function setUp() public {
        sccParameters = new SCC_Parameters(owner, 150, 1 hours, 150);
    }

    function test_setMinCollateralizationRatio_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit SCC_Parameters.MinCollateralizationRatioUpdated(200);
        sccParameters.setMinCollateralizationRatio(200);
        assertEq(sccParameters.minCollateralizationRatio(), 200);
    }

    function test_setMinCollateralizationRatio_Fail_NotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        sccParameters.setMinCollateralizationRatio(200);
    }

    function test_setPriceDecayHalfLife_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit SCC_Parameters.PriceDecayHalfLifeUpdated(2 hours);
        sccParameters.setPriceDecayHalfLife(2 hours);
        assertEq(sccParameters.priceDecayHalfLife(), 2 hours);
    }

    function test_setPriceDecayHalfLife_Fail_NotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        sccParameters.setPriceDecayHalfLife(2 hours);
    }

    function test_setStartPriceMultiplier_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit SCC_Parameters.StartPriceMultiplierUpdated(200);
        sccParameters.setStartPriceMultiplier(200);
        assertEq(sccParameters.startPriceMultiplier(), 200);
    }

    function test_setStartPriceMultiplier_Fail_NotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        sccParameters.setStartPriceMultiplier(200);
    }
}
