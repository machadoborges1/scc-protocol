// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/OracleManager.sol";
import "src/LiquidationManager.sol";
import "src/mocks/MockV3Aggregator.sol";
import "src/mocks/MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Malicious SCC_USD that tries to re-enter the Vault during a `burnFrom` call.
contract ReentrantSCC_USD is SCC_USD {
    Vault public vaultToAttack;

    constructor(address initialAdmin) SCC_USD(initialAdmin) {}

    function setVaultToAttack(address _vault) external {
        vaultToAttack = Vault(_vault);
    }

    // @dev Override the `burnFrom` function to attempt a re-entrant call.
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);

        // Attempt the re-entrant call if a target is set.
        if (address(vaultToAttack) != address(0)) {
            // This call is expected to fail and revert the whole transaction
            // because of the `onlyOwner` modifier on `withdrawCollateral`.
            vaultToAttack.withdrawCollateral(type(uint256).max);
        }
    }
}

/**
 * @dev Test suite for security-related aspects of the Vault contract.
 */
contract VaultSecurityTest is Test {
    LiquidationManager public manager;
    Vault public vault;
    ReentrantSCC_USD public maliciousSccUsd;
    OracleManager public oracleManager;
    MockV3Aggregator public wethPriceFeed;
    MockERC20 public weth;

    address public owner = makeAddr("owner");
    address public otherUser = makeAddr("otherUser");

    uint256 public constant INITIAL_WETH_COLLATERAL = 10e18;
    uint256 public constant INITIAL_SCC_DEBT = 5_000e18;
    int256 public constant INITIAL_WETH_PRICE = 3000e8;

    function setUp() public {
        // Deploy Oracle and its mock feed
        oracleManager = new OracleManager(1 hours);
        wethPriceFeed = new MockV3Aggregator(8, INITIAL_WETH_PRICE);
        weth = new MockERC20("Wrapped Ether", "WETH");
        oracleManager.setPriceFeed(address(weth), address(wethPriceFeed));

        // Deploy the malicious token instead of the real SCC_USD
        maliciousSccUsd = new ReentrantSCC_USD(owner);

        // Deploy Manager and Vault, linking them to the malicious token
        manager = new LiquidationManager(owner, address(oracleManager), address(maliciousSccUsd));
        vault = new Vault(owner, address(weth), address(maliciousSccUsd), address(oracleManager), address(manager));

        // Tell the malicious token which vault to attack
        maliciousSccUsd.setVaultToAttack(address(vault));

        // Authorize contracts to use the OracleManager
        oracleManager.setAuthorization(address(vault), true);
        oracleManager.setAuthorization(address(manager), true);

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);

        // Grant the Vault contract the MINTER_ROLE on the malicious token
        maliciousSccUsd.grantRole(maliciousSccUsd.MINTER_ROLE(), address(vault));

        // Mint collateral, deposit it, and mint debt against it
        weth.mint(owner, INITIAL_WETH_COLLATERAL);
        weth.approve(address(vault), INITIAL_WETH_COLLATERAL);
        vault.depositCollateral(INITIAL_WETH_COLLATERAL);
        vault.mint(INITIAL_SCC_DEBT);

        vm.stopPrank();
    }

    /**
     * @notice Tests that a re-entrant call from the token contract during a `burn` operation fails.
     * @dev The `withdrawCollateral` function is protected by `onlyOwner`.
     * The re-entrant call will come from the token contract, not the owner, so it must revert.
     */
    function test_Fail_ReentrancyOnBurn() public {
        uint256 burnAmount = 100e18;

        vm.startPrank(owner);
        // Approve the vault to spend the malicious tokens
        maliciousSccUsd.approve(address(vault), burnAmount);

        // Expect the revert from the re-entrant call's `onlyOwner` modifier.
        // The sender of the re-entrant call is the malicious token contract.
        bytes memory expectedError = abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(maliciousSccUsd));
        vm.expectRevert(expectedError);

        // Action: Call the burn function on the vault, which will trigger the re-entrant token
        vault.burn(burnAmount);

        vm.stopPrank();
    }
}
