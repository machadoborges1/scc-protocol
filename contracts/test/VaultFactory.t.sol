// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/VaultFactory.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/OracleManager.sol";
import "src/mocks/MockERC20.sol";

/**
 * @dev Test suite for the VaultFactory contract.
 */
contract VaultFactoryTest is Test {
    VaultFactory public factory;
    SCC_USD public sccUsd;
    OracleManager public oracleManager;
    MockERC20 public weth;

    address public deployer = makeAddr("deployer");
    address public user1 = makeAddr("user1");

    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        vm.startPrank(deployer);
        // 1. Deploy dependencies
        oracleManager = new OracleManager(1 hours);
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(deployer);

        // 2. Deploy the factory
        factory = new VaultFactory(address(weth), address(sccUsd), address(oracleManager));
        vm.stopPrank();
    }

    /**
     * @notice Tests that a new vault can be created successfully and emits the correct event.
     */
    function test_CreateNewVault() public {
        vm.recordLogs();

        vm.prank(user1);
        address newVaultAddress = factory.createNewVault();

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 eventSignature = keccak256("VaultCreated(address,address)");
        bool eventFound = false;

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == eventSignature) {
                eventFound = true;
                address vaultAddrFromEvent = address(uint160(uint256(entries[i].topics[1])));
                address ownerFromEvent = address(uint160(uint256(entries[i].topics[2])));

                assertEq(vaultAddrFromEvent, newVaultAddress, "Event should contain the new vault address");
                assertEq(ownerFromEvent, user1, "Event should contain the correct owner");
            }
        }

        assertTrue(eventFound, "VaultCreated event not found");

        Vault newVault = Vault(newVaultAddress);
        assertEq(newVault.owner(), user1, "New vault owner should be user1");
    }
}
