const { redisClient } = require('./redis');

class ReferralEngine {
    constructor(io) {
        this.io = io;
    }

    /**
     * Propagate Rewards: Triggers when a user performs a valid interaction.
     * Iterates up to 10 levels of referrers and sends notifications.
     */
    async propagateRewards(userAddress, timestamp) {
        let currentReferrer = await this.getReferrer(userAddress);
        let level = 1;

        console.log(`[Referral] Starting propagation for ${userAddress} at ${timestamp}`);

        while (currentReferrer && level <= 10) {
            // Check if referrer is a Shadow Account (optional: do shadows earn rewards? Usually no.)
            const isShadow = await redisClient.get(`wallet:${currentReferrer}:shadow`);
            
            if (isShadow !== 'true') {
                // Send Notification
                this.notifyUser(currentReferrer, {
                    type: 'REWARD_SYNC',
                    level: level,
                    source: userAddress,
                    message: `来自 ${level} 级节点的有效和平同步 +1`,
                    timestamp: timestamp
                });

                // Update Stats (Optional: Store in DB/Redis for leaderboard)
                await this.updateLeaderboard(currentReferrer, level);
            } else {
                console.log(`[Referral] Level ${level} referrer ${currentReferrer} is Shadow. Skipping reward.`);
            }

            // Move to next level
            currentReferrer = await this.getReferrer(currentReferrer);
            level++;
        }
    }

    async getReferrer(userAddress) {
        return await redisClient.get(`wallet:${userAddress}:referrer`);
    }

    async setReferrer(userAddress, referrerAddress) {
        // Prevent self-referral and cycles (basic check)
        if (userAddress === referrerAddress) return false;
        
        // Only set if not already set
        const existing = await this.getReferrer(userAddress);
        if (!existing) {
            await redisClient.set(`wallet:${userAddress}:referrer`, referrerAddress);
            return true;
        }
        return false;
    }

    async notifyUser(userAddress, data) {
        const socketId = await redisClient.get(`user:${userAddress}:socket`);
        if (socketId) {
            this.io.to(socketId).emit('notification', data);
            console.log(`[Notification] Sent to ${userAddress} (${socketId}): ${data.message}`);
        }
    }

    async updateLeaderboard(userAddress, level) {
        // Increment score in Sorted Set for Leaderboard
        // Different weights for different levels could be applied here
        const scoreToAdd = 100 / level; // Example: Level 1 = 100, Level 2 = 50...
        await redisClient.zIncrBy('leaderboard:global', scoreToAdd, userAddress);
    }
}

module.exports = ReferralEngine;
