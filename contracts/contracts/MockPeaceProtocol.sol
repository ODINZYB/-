// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PeaceProtocol.sol";

/**
 * @title MockPeaceProtocol
 * @dev Used only for testing to simulate a small airdrop cap.
 */
contract MockPeaceProtocol is PeaceProtocol {
    constructor(
        address _dataContract,
        address _tokenContract,
        address _feeReceiver1,
        address _feeReceiver2
    ) PeaceProtocol(_dataContract, _tokenContract, _feeReceiver1, _feeReceiver2) {}

    // Override the AIRDROP_CAP variable (since it's a constant in the original, we can't easily override it.
    // Instead, we will rewrite the interact function just for this test, or we can use a dirty trick:
    // We will just change the require statement in a new copy, but to keep it simple, we just redefine a new constant and a new function).

    // For testing purposes, we'll redefine a small cap and a custom interact function
    uint256 public constant SMALL_AIRDROP_CAP = 1500 * 10**18;

    function interact(address referrer) external payable override nonReentrant {
        require(msg.value >= interactionFee, "Insufficient interaction fee");
        
        uint256 currentTime = block.timestamp;
        uint256 lastInteraction = dataContract.getLastInteraction(msg.sender);
        uint256 currentStreak = dataContract.getStreak(msg.sender);
        
        if (lastInteraction != 0) {
            require(
                currentTime >= lastInteraction + COOLDOWN_PERIOD,
                "Cool down active: Please wait 12 hours between interactions"
            );
            
            uint256 lastInteractionDay = getStartOfDay(lastInteraction);
            uint256 currentDay = getStartOfDay(currentTime);
            
            if (currentDay > lastInteractionDay) {
                if (currentDay - lastInteractionDay == 1 days) {
                    currentStreak += 1;
                } else {
                    currentStreak = 0; 
                }
            }
        } else {
            currentStreak = 0;
        }

        uint256 streakBonus = currentStreak * BONUS_PER_STREAK;
        if (streakBonus > MAX_STREAK_BONUS) {
            streakBonus = MAX_STREAK_BONUS;
        }
        uint256 userReward = BASE_REWARD + streakBonus;
        
        uint256 referrerReward = 0;
        if (referrer != address(0) && referrer != msg.sender) {
            referrerReward = (BASE_REWARD * REFERRAL_BONUS_PERCENT) / 100;
        }

        uint256 totalMintAmount = userReward + referrerReward;

        // **MODIFIED LINE FOR TESTING**
        require(totalAirdropped + totalMintAmount <= SMALL_AIRDROP_CAP, "Airdrop cap reached");

        dataContract.setLastInteraction(msg.sender, currentTime);
        dataContract.setStreak(msg.sender, currentStreak);
        totalAirdropped += totalMintAmount;

        tokenContract.mint(msg.sender, userReward);
        if (referrerReward > 0) {
            tokenContract.mint(referrer, referrerReward);
        }

        uint256 feeHalf = msg.value / 2;
        uint256 feeRemaining = msg.value - feeHalf; 

        (bool success1, ) = feeReceiver1.call{value: feeHalf}("");
        require(success1, "Fee transfer to receiver 1 failed");

        (bool success2, ) = feeReceiver2.call{value: feeRemaining}("");
        require(success2, "Fee transfer to receiver 2 failed");

        emit SyncAction(msg.sender, referrer, currentTime, userReward, currentStreak);
    }
}