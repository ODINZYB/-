// Using native fetch in Node 18+

const BACKEND_URL = 'http://localhost:3001';

async function testBackend() {
    console.log("=== Starting Backend API Tests ===\n");

    const fingerprint = 'test-fingerprint-123';
    const wallet1 = '0x1234567890123456789012345678901234567890';
    const wallet2 = '0x0987654321098765432109876543210987654321';
    const referrer = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';

    try {
        // Test 1: Quota endpoint before interaction
        console.log("1. Testing Quota Endpoint (Empty)...");
        let quotaRes = await fetch(`${BACKEND_URL}/api/quota/${fingerprint}`);
        let quotaData = await quotaRes.json();
        console.log("Quota Data:", quotaData);
        if (quotaData.activeSlots !== 0) throw new Error("Expected 0 active slots");

        // Test 2: Interact Endpoint (Normal)
        console.log("\n2. Testing Interact Endpoint (First Wallet)...");
        let interactRes = await fetch(`${BACKEND_URL}/api/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: wallet1,
                visitorId: fingerprint,
                requestId: 'test-req-1',
                referrerAddress: referrer
            })
        });
        let interactData = await interactRes.json();
        console.log("Interact Data:", interactData);
        if (interactData.isShadow !== false) throw new Error("Expected isShadow to be false");

        // Test 3: Quota endpoint after interaction
        console.log("\n3. Testing Quota Endpoint (After 1 Interaction)...");
        quotaRes = await fetch(`${BACKEND_URL}/api/quota/${fingerprint}`);
        quotaData = await quotaRes.json();
        console.log("Quota Data:", quotaData);
        if (quotaData.activeSlots !== 1) throw new Error("Expected 1 active slot");
        if (!quotaData.wallets.includes(wallet1)) throw new Error("Wallet 1 not in quota");

        // Test 4: Fill Quota to test Shadow Account limit
        console.log("\n4. Filling quota to trigger Shadow Account...");
        for(let i=2; i<=20; i++) {
            const tempWallet = `0x${i.toString().padStart(40, '0')}`;
            await fetch(`${BACKEND_URL}/api/interact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: tempWallet,
                    visitorId: fingerprint,
                    requestId: `test-req-${i}`
                })
            });
        }
        
        // The 21st wallet should be a shadow account
        const shadowWallet = '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF';
        let shadowRes = await fetch(`${BACKEND_URL}/api/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: shadowWallet,
                visitorId: fingerprint,
                requestId: 'test-req-shadow'
            })
        });
        let shadowData = await shadowRes.json();
        console.log("Shadow Interact Data:", shadowData);
        if (shadowData.isShadow !== true) throw new Error("Expected isShadow to be true");

        console.log("\n✅ All Backend API Tests Passed Successfully!");

    } catch (error) {
        console.error("\n❌ Backend Test Failed:", error);
    }
}

testBackend();