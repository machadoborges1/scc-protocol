// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/tokens/SCC_GOV.sol";

/**
 * @dev Test suite for the SCC_GOV token contract.
 */
contract SCC_GOV_Test is Test {
    SCC_GOV public sccGOV;

    address owner = makeAddr("owner");
    uint256 initialSupply = 100_000_000 * 1e18; // 100 million tokens

    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        sccGOV = new SCC_GOV(owner, initialSupply);
    }

    /**
     * @notice Tests that the token's name and symbol are correctly set upon deployment.
     */
    function test_NameAndSymbol() public view {
        assertEq(sccGOV.name(), "SCC Governance");
        assertEq(sccGOV.symbol(), "SCC-GOV");
    }

    /**
     * @notice Tests that the initial supply is minted to the owner upon deployment.
     */
    function test_InitialSupplyIsMintedToOwner() public view {
        assertEq(sccGOV.totalSupply(), initialSupply);
        assertEq(sccGOV.balanceOf(owner), initialSupply);
    }
}
