// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {OracleManager} from "../src/OracleManager.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";
import {SCC_GOV} from "../src/tokens/SCC_GOV.sol";
import {SCC_Governor} from "../src/SCC_Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import "forge-std/console.sol";

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

        // The test contract has ADMIN role from the constructor.
        // Grant AUTHORIZER_ROLE to the test contract to allow it to call setAuthorization.
        oracleManager.grantRole(oracleManager.AUTHORIZER_ROLE(), address(this));

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

            vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, USER, role));

            oracleManager.setAuthorization(USER, true);

        }

    

        /**

         * @notice Tests that `setPriceFeed` reverts when called by an unauthorized account.

         */

        function test_Fail_SetPriceFeed_WhenNotOwner() public {

            bytes32 role = oracleManager.DEFAULT_ADMIN_ROLE();

            assertFalse(oracleManager.hasRole(role, USER), "Precondition: USER should not have role");

    

            vm.prank(USER);

            vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, USER, role));

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

    

        /**

         * @notice Tests that a malicious governance proposal to change a price feed

         * is subject to the timelock delay, providing a window for intervention.

         */

        function test_GovernanceAttack_OracleManager() public {

            // --- Setup Governance --- //

            address deployer = makeAddr("deployer");

            vm.startPrank(deployer);

            SCC_GOV sccGOV = new SCC_GOV(deployer, 1_000_000e18);

            TimelockController timelock = new TimelockController(1 days, new address[](0), new address[](0), deployer);

            SCC_Governor governor = new SCC_Governor(sccGOV, timelock);

            vm.stopPrank();


            // --- Configure Roles --- //

            vm.startPrank(deployer);

            timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));

            timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));

            timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), deployer);

            vm.stopPrank();


            vm.startPrank(address(this));

            oracleManager.grantRole(oracleManager.DEFAULT_ADMIN_ROLE(), address(timelock));

            oracleManager.renounceRole(oracleManager.DEFAULT_ADMIN_ROLE(), address(this));

            vm.stopPrank();


            // --- Delegate Votes --- //

            vm.startPrank(deployer);

            sccGOV.delegate(deployer);

            vm.stopPrank();


            // --- Create Malicious Oracle --- //

            MockV3Aggregator maliciousPriceFeed = new MockV3Aggregator(MOCK_DECIMALS, 0); // Malicious price: 0


            // --- Craft Malicious Proposal --- //

            address[] memory targets = new address[](1);

            targets[0] = address(oracleManager);

            uint256[] memory values = new uint256[](1);

            bytes[] memory calldatas = new bytes[](1);

            calldatas[0] = abi.encodeWithSignature("setPriceFeed(address,address)", TEST_ASSET, address(maliciousPriceFeed));

            string memory description = "Malicious proposal to set price feed to a fake oracle";


            // --- Simulate Attack (Proposal Passes) --- //

            vm.startPrank(deployer);

            uint256 proposalId = governor.propose(targets, values, calldatas, description);

            vm.roll(block.number + governor.votingDelay() + 1);

            governor.castVote(proposalId, 1);

            vm.roll(block.number + governor.votingPeriod() + 1);

            governor.queue(targets, values, calldatas, keccak256(bytes(description)));

            vm.stopPrank();


            // --- Verify System Defenses (During Timelock Delay) --- //

            assertEq(oracleManager.getPrice(TEST_ASSET), uint256(MOCK_INITIAL_PRICE) * 1e10, "Oracle should still return original price during timelock delay");


            // --- Execute the Malicious Proposal --- //

            vm.warp(block.timestamp + timelock.getMinDelay() + 1);

            vm.startPrank(deployer);

            governor.execute(targets, values, calldatas, keccak256(bytes(description)));

            vm.stopPrank();


            // --- Verify Impact of Malicious Feed --- //

            vm.expectRevert(abi.encodeWithSelector(OracleManager.InvalidPrice.selector, TEST_ASSET, 0));

            oracleManager.getPrice(TEST_ASSET);

        }

    
}
