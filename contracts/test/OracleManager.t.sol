// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {OracleManager} from "../src/OracleManager.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract OracleManagerTest is Test {
    // State
    OracleManager public oracleManager;
    MockV3Aggregator public mockPriceFeed;

    address public constant TEST_ASSET = address(1);
    address public constant USER = address(2);
    uint256 public constant TEST_STALE_PRICE_TIMEOUT = 3600; // 1 hour
    uint8 public constant MOCK_DECIMALS = 8;
    int256 public constant MOCK_INITIAL_PRICE = 2000e8;

    // Setup
    function setUp() public {
        oracleManager = new OracleManager(TEST_STALE_PRICE_TIMEOUT);
        mockPriceFeed = new MockV3Aggregator(MOCK_DECIMALS, MOCK_INITIAL_PRICE);
        oracleManager.setPriceFeed(TEST_ASSET, address(mockPriceFeed));
        // Authorize the test contract itself to call getPrice
        oracleManager.setAuthorization(address(this), true);
    }

    // Test Functions
    function test_Deployment() public view {
        assertEq(oracleManager.STALE_PRICE_TIMEOUT(), TEST_STALE_PRICE_TIMEOUT);
    }

    function test_GetPrice_Success() public view {
        uint256 price = oracleManager.getPrice(TEST_ASSET);
        uint256 expectedPrice = uint256(MOCK_INITIAL_PRICE) * 1e10; // 8 -> 18 decimals
        assertEq(price, expectedPrice);
    }

    function test_Fail_GetPrice_WhenNotAuthorized() public {
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.NotAuthorized.selector, USER));
        oracleManager.getPrice(TEST_ASSET);
    }

    function test_SetAuthorization() public {
        oracleManager.setAuthorization(USER, true);
        assertTrue(oracleManager.isAuthorized(USER));

        vm.prank(USER);
        uint256 price = oracleManager.getPrice(TEST_ASSET);
        assert(price > 0);

        oracleManager.setAuthorization(USER, false);
        assertFalse(oracleManager.isAuthorized(USER));

        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.NotAuthorized.selector, USER));
        oracleManager.getPrice(TEST_ASSET);
    }

    function test_Fail_SetAuthorization_WhenNotOwner() public {
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, USER));
        oracleManager.setAuthorization(USER, true);
    }

    function test_Fail_SetPriceFeed_WhenNotOwner() public {
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, USER));
        oracleManager.setPriceFeed(TEST_ASSET, address(mockPriceFeed));
    }

    function test_Fail_SetPriceFeed_WithZeroAddress() public {
        vm.expectRevert(OracleManager.InvalidPriceFeedAddress.selector);
        oracleManager.setPriceFeed(TEST_ASSET, address(0));
    }

    function test_Fail_GetPrice_WhenFeedNotSet() public {
        vm.expectRevert(abi.encodeWithSelector(OracleManager.PriceFeedNotSet.selector, address(3)));
        oracleManager.getPrice(address(3)); // Unconfigured asset
    }

    function test_Fail_GetPrice_WhenPriceIsStale() public {
        uint256 originalTimestamp = mockPriceFeed.i_latestTimestamp();
        vm.warp(originalTimestamp + TEST_STALE_PRICE_TIMEOUT + 1);

        vm.expectRevert(abi.encodeWithSelector(OracleManager.StalePrice.selector, TEST_ASSET, originalTimestamp));
        oracleManager.getPrice(TEST_ASSET);
    }

    function test_Fail_GetPrice_WhenPriceIsInvalid() public {
        mockPriceFeed.updateAnswer(0);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.InvalidPrice.selector, TEST_ASSET, 0));
        oracleManager.getPrice(TEST_ASSET);

        mockPriceFeed.updateAnswer(-1);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.InvalidPrice.selector, TEST_ASSET, -1));
        oracleManager.getPrice(TEST_ASSET);
    }
}
