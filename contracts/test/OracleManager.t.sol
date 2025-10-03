// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {OracleManager} from "../src/OracleManager.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";

/**
 * @dev Test suite for the OracleManager contract.
 */
contract OracleManagerTest is Test {
    // --- State ---
    OracleManager public oracleManager;
    MockV3Aggregator public mockPriceFeed;

    address public constant TEST_ASSET = address(1);
    address public constant USER = address(2);
    uint256 public constant TEST_STALE_PRICE_TIMEOUT = 3600; // 1 hour
    uint8 public constant MOCK_DECIMALS = 8;
    int256 public constant MOCK_INITIAL_PRICE = 2000e8;

    // --- Setup ---
    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        // By default, the test contract (address(this)) is the msg.sender
        oracleManager = new OracleManager(TEST_STALE_PRICE_TIMEOUT);
        mockPriceFeed = new MockV3Aggregator(MOCK_DECIMALS, MOCK_INITIAL_PRICE);

        // The test contract has ADMIN and AUTHORIZER roles from the constructor, so we can setup the state.
        oracleManager.setPriceFeed(TEST_ASSET, address(mockPriceFeed));
        oracleManager.setAuthorization(address(this), true); // Authorize self to call getPrice
    }

    // --- Test Functions ---
    /**
     * @notice Tests the successful deployment and initial state of the OracleManager contract.
     */
    function test_Deployment() public view {
        assertEq(oracleManager.STALE_PRICE_TIMEOUT(), TEST_STALE_PRICE_TIMEOUT);
    }

    /**
     * @notice Tests that `getPrice` returns the correct price for a configured asset.
     */
    function test_GetPrice_Success() public view {
        uint256 price = oracleManager.getPrice(TEST_ASSET);
        uint256 expectedPrice = uint256(MOCK_INITIAL_PRICE) * 1e10; // 8 -> 18 decimals
        assertEq(price, expectedPrice);
    }

    /**
     * @notice Tests that `getPrice` reverts when called by an unauthorized address.
     */
    function test_Fail_GetPrice_WhenNotAuthorized() public {
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.NotAuthorized.selector, USER));
        oracleManager.getPrice(TEST_ASSET);
    }

    /**
     * @notice Tests that authorization can be set and revoked, affecting `getPrice` access.
     */
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

    /**
     * @notice Tests that `setAuthorization` reverts when called by an unauthorized account.
     */
    function test_Fail_SetAuthorization_WhenNotOwner() public {
        bytes32 role = oracleManager.AUTHORIZER_ROLE();
        assertFalse(oracleManager.hasRole(role, USER), "Precondition: USER should not have role");

        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSignature("AccessControlUnauthorizedAccount(address,bytes32)", USER, role));
        oracleManager.setAuthorization(USER, true);
    }

    /**
     * @notice Tests that `setPriceFeed` reverts when called by an unauthorized account.
     */
    function test_Fail_SetPriceFeed_WhenNotOwner() public {
        bytes32 role = oracleManager.DEFAULT_ADMIN_ROLE();
        assertFalse(oracleManager.hasRole(role, USER), "Precondition: USER should not have role");

        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSignature("AccessControlUnauthorizedAccount(address,bytes32)", USER, role));
        oracleManager.setPriceFeed(TEST_ASSET, address(mockPriceFeed));
    }

    /**
     * @notice Tests that `setPriceFeed` reverts when attempting to set a zero address as the feed.
     */
    function test_Fail_SetPriceFeed_WithZeroAddress() public {
        vm.expectRevert(OracleManager.InvalidPriceFeedAddress.selector);
        oracleManager.setPriceFeed(TEST_ASSET, address(0));
    }

    /**
     * @notice Tests that `getPrice` reverts when no price feed is configured for an asset.
     */
    function test_Fail_GetPrice_WhenFeedNotSet() public {
        vm.expectRevert(abi.encodeWithSelector(OracleManager.PriceFeedNotSet.selector, address(3)));
        oracleManager.getPrice(address(3)); // Unconfigured asset
    }

    /**
     * @notice Tests that `getPrice` reverts when the price feed data is stale.
     */
    function test_Fail_GetPrice_WhenPriceIsStale() public {
        uint256 originalTimestamp = mockPriceFeed.i_latestTimestamp();
        vm.warp(originalTimestamp + TEST_STALE_PRICE_TIMEOUT + 1);

        vm.expectRevert(abi.encodeWithSelector(OracleManager.StalePrice.selector, TEST_ASSET, originalTimestamp));
        oracleManager.getPrice(TEST_ASSET);
    }

    /**
     * @notice Tests that `getPrice` reverts when the oracle returns an invalid price (zero or negative).
     */
    function test_Fail_GetPrice_WhenPriceIsInvalid() public {
        mockPriceFeed.updateAnswer(0);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.InvalidPrice.selector, TEST_ASSET, 0));
        oracleManager.getPrice(TEST_ASSET);

        mockPriceFeed.updateAnswer(-1);
        vm.expectRevert(abi.encodeWithSelector(OracleManager.InvalidPrice.selector, TEST_ASSET, -1));
        oracleManager.getPrice(TEST_ASSET);
    }
}
