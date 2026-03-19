// Mock Redis using in-memory Map for environments without Redis
class MockRedis {
    constructor() {
        this.store = new Map();
        this.sets = new Map();
        this.sortedSets = new Map();
    }

    async connect() {
        console.log('Using In-Memory Mock Redis Store');
        return true;
    }

    async set(key, value) {
        this.store.set(key, value);
        return 'OK';
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async del(key) {
        this.store.delete(key);
        return 1;
    }

    async sAdd(key, member) {
        if (!this.sets.has(key)) {
            this.sets.set(key, new Set());
        }
        this.sets.get(key).add(member);
        return 1;
    }

    async sMembers(key) {
        if (!this.sets.has(key)) return [];
        return Array.from(this.sets.get(key));
    }

    async zIncrBy(key, increment, member) {
        if (!this.sortedSets.has(key)) {
            this.sortedSets.set(key, new Map());
        }
        const set = this.sortedSets.get(key);
        const currentScore = set.get(member) || 0;
        set.set(member, currentScore + increment);
        return currentScore + increment;
    }
}

const redisClient = new MockRedis();

// Data Structure Helpers

/**
 * Key Schema:
 * fingerprint:{fingerprint_hash} -> Set<wallet_address> (Set of wallets associated with a fingerprint)
 * wallet:{wallet_address}:referrer -> address (Stores who referred this wallet)
 * wallet:{wallet_address}:shadow -> boolean (Marks if a wallet is a shadow account)
 * user:{user_address}:socket -> socket_id (Mapping for real-time notifications)
 */

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Mock Redis:', err);
    }
};

module.exports = {
    redisClient,
    connectRedis
};
