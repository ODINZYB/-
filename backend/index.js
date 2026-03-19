require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectRedis, redisClient } = require('./redis');
const { verifyDeviceQuota } = require('./middleware');
const ReferralEngine = require('./referral');

// App Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Engines
const referralEngine = new ReferralEngine(io);

// Connect to Redis
connectRedis().then(() => {
    console.log('Backend connected to Redis');
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Register User (Wallet -> Socket Mapping)
    socket.on('register', async (walletAddress) => {
        if (walletAddress) {
            await redisClient.set(`user:${walletAddress}:socket`, socket.id);
            console.log(`Registered socket for wallet: ${walletAddress}`);
        }
    });

    socket.on('disconnect', () => {
        // Cleanup logic if needed (e.g. remove socket mapping)
        // redisClient.del(`user:${walletAddress}:socket`); // Need reverse mapping to do efficiently
        console.log('Client disconnected:', socket.id);
    });
});

// API Routes

/**
 * POST /api/interact
 * Main interaction endpoint.
 * - Verifies device quota (fingerprint limit).
 * - Records interaction.
 * - Triggers referral rewards (if not shadow).
 */
app.post('/api/interact', verifyDeviceQuota, async (req, res) => {
    const { walletAddress, referrerAddress } = req.body;
    const isShadow = req.isShadowAccount;

    try {
        // 1. Set Referrer (if provided and not already set)
        if (referrerAddress && referrerAddress !== walletAddress) {
            await referralEngine.setReferrer(walletAddress, referrerAddress);
        }

        // 2. Process Interaction
        if (isShadow) {
            // Interaction recorded but no rewards propagated
            console.log(`[Interaction] Shadow Account ${walletAddress} interacted. No rewards triggered.`);
            return res.status(200).json({ 
                success: true, 
                message: 'Interaction successful (Shadow Mode)', 
                isShadow: true 
            });
        }

        // 3. Propagate Rewards (10-Level Fission)
        // Async processing to not block response
        referralEngine.propagateRewards(walletAddress, Date.now()).catch(err => {
            console.error('Referral Propagation Error:', err);
        });

        res.status(200).json({ 
            success: true, 
            message: 'Interaction successful', 
            isShadow: false 
        });

    } catch (error) {
        console.error('Interaction Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * GET /api/quota/:fingerprint
 * Check device quota status for frontend dashboard.
 */
app.get('/api/quota/:fingerprint', async (req, res) => {
    const { fingerprint } = req.params;
    try {
        const wallets = await redisClient.sMembers(`fingerprint:${fingerprint}`);
        res.json({
            totalSlots: 20,
            activeSlots: wallets.length,
            wallets: wallets
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quota' });
    }
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Mars-X Backend running on port ${PORT}`);
});
