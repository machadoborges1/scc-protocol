// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/VaultFactory.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/mocks/MockOracle.sol";
import "src/mocks/MockERC20.sol";

contract VaultFactoryTest is Test {
    VaultFactory public factory;
    SCC_USD public sccUsd;
    MockOracle public oracle;
    MockERC20 public weth;

    address public deployer = makeAddr("deployer");
    address public user1 = makeAddr("user1");

    function setUp() public {
        vm.startPrank(deployer);
        // 1. Deploy dependencies
        oracle = new MockOracle();
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(deployer); // Deployer is initial owner

        // 2. Deploy the factory
        factory = new VaultFactory(address(weth), address(sccUsd), address(oracle));
        vm.stopPrank();
    }

    function test_CreateNewVault() public {
        // Start recording logs
        vm.recordLogs();

        // Simulate user1 calling the function
        vm.prank(user1);
        address newVaultAddress = factory.createNewVault();

        // Get the recorded logs
        Vm.Log[] memory entries = vm.getRecordedLogs();

        bytes32 eventSignature = keccak256("VaultCreated(address,address)");
        bool eventFound = false;

        // Loop through all emitted events to find the one we want
        for (uint i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == eventSignature) {
                eventFound = true;
                address vaultAddrFromEvent = address(uint160(uint256(entries[i].topics[1])));
                address ownerFromEvent = address(uint160(uint256(entries[i].topics[2])));

                assertEq(vaultAddrFromEvent, newVaultAddress, "Event should contain the new vault address");
                assertEq(ownerFromEvent, user1, "Event should contain the correct owner");
            }
        }

        assertTrue(eventFound, "VaultCreated event not found");

        // Also verify the owner of the new vault contract directly
        Vault newVault = Vault(newVaultAddress);
        assertEq(newVault.owner(), user1, "New vault owner should be user1");
    }
}
