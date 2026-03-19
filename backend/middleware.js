const { redisClient } = require('./redis');
const { FingerprintJsServerApiClient, Region } = require('@fingerprintjs/fingerprintjs-pro-server-api');

// Initialize FingerprintJS Client (Assuming API Key in ENV)
const client = new FingerprintJsServerApiClient({
    region: Region.Global, 
    apiKey: process.env.FINGERPRINT_API_KEY || 'YOUR_MOCK_KEY_FOR_DEV' 
});

const MAX_WALLETS_PER_DEVICE = 20;

/**
 * Middleware: Verify Device Quota
 * Checks if the incoming request's fingerprint has exceeded the 20 wallet limit.
 * If exceeded, marks the current wallet as "Shadow Account".
 */
const verifyDeviceQuota = async (req, res, next) => {
    try {
        const { walletAddress, visitorId, requestId } = req.body;

        if (!walletAddress || !visitorId) {
            return res.status(400).json({ error: 'Missing walletAddress or visitorId' });
        }

        // 1. Verify Fingerprint (Optional: Use server-side validation for higher security)
        // In a real production scenario, you would validate the requestId with FingerprintJS API
        // const event = await client.getEvent(requestId);
        // if (!event || event.products.botd.data.bot.result === 'bad') ...

        const fingerprintKey = `fingerprint:${visitorId}`;
        
        // 2. Check current set of wallets for this fingerprint
        const deviceWallets = await redisClient.sMembers(fingerprintKey);
        const walletCount = deviceWallets.length;
        const isExistingWallet = deviceWallets.includes(walletAddress);

        // 3. Logic for Hard Limit
        if (!isExistingWallet) {
            if (walletCount >= MAX_WALLETS_PER_DEVICE) {
                // Hard Limit Exceeded -> Mark as Shadow Account
                console.warn(`[Device Limit] Fingerprint ${visitorId} exceeded limit. Marking ${walletAddress} as Shadow Account.`);
                
                // Store Shadow Status
                await redisClient.set(`wallet:${walletAddress}:shadow`, 'true');
                
                // Add to set anyway to track association, but it's tainted
                await redisClient.sAdd(fingerprintKey, walletAddress);

                // Attach shadow flag to request for downstream logic
                req.isShadowAccount = true;
            } else {
                // Within Limit -> Add to set
                await redisClient.sAdd(fingerprintKey, walletAddress);
                req.isShadowAccount = false;
            }
        } else {
            // Existing wallet, check if it was already shadowed
            const isShadow = await redisClient.get(`wallet:${walletAddress}:shadow`);
            req.isShadowAccount = (isShadow === 'true');
        }

        next();
    } catch (error) {
        console.error('Device Quota Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error during Device Verification' });
    }
};

module.exports = {
    verifyDeviceQuota
};
