const io = require('socket.io-client');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3001';
const FINGERPRINT = 'test-device-fp-123';

// Mock Wallets
const wallets = Array.from({ length: 25 }, () => `0x${uuidv4().replace(/-/g, '')}`);

const socket = io(API_URL);

socket.on('connect', () => {
    console.log('Connected to WebSocket');
});

socket.on('notification', (data) => {
    console.log(`[NOTIFICATION] ${data.message} (Level ${data.level})`);
});

const runTest = async () => {
    console.log(`Starting Test with Fingerprint: ${FINGERPRINT}`);
    console.log(`Simulating ${wallets.length} wallet interactions...`);

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        
        try {
            // Register socket for first few wallets to test notifications
            if (i < 5) {
                socket.emit('register', wallet);
            }

            const response = await axios.post(`${API_URL}/api/interact`, {
                walletAddress: wallet,
                visitorId: FINGERPRINT,
                requestId: `req-${i}`,
                referrerAddress: i > 0 ? wallets[i-1] : null // Chain referral
            });

            const status = response.data.isShadow ? 'SHADOW (Limit Exceeded)' : 'VALID';
            console.log(`[Wallet ${i+1}] ${wallet.substring(0, 8)}... : ${status}`);
            
            // Wait a bit
            await new Promise(r => setTimeout(r, 100));

        } catch (error) {
            console.error(`Error processing wallet ${i}:`, error.message);
        }
    }

    console.log('Test Complete. Checking Quota...');
    try {
        const quota = await axios.get(`${API_URL}/api/quota/${FINGERPRINT}`);
        console.log('Quota Status:', quota.data);
    } catch (err) {
        console.error(err);
    }

    socket.disconnect();
};

// Delay start to allow server to boot if running concurrently
setTimeout(runTest, 2000);
