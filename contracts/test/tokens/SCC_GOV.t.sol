// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/tokens/SCC_GOV.sol";

contract SCC_GOV_Test is Test {
    SCC_GOV public sccGOV;

    address owner = makeAddr("owner");
    uint256 initialSupply = 100_000_000 * 1e18; // 100 million tokens

    function setUp() public {
        sccGOV = new SCC_GOV(owner, initialSupply);
    }

    function test_NameAndSymbol() public view {
        assertEq(sccGOV.name(), "SCC Governance");
        assertEq(sccGOV.symbol(), "SCC-GOV");
    }

    function test_InitialSupplyIsMintedToOwner() public view {
        assertEq(sccGOV.totalSupply(), initialSupply);
        assertEq(sccGOV.balanceOf(owner), initialSupply);
    }
}
