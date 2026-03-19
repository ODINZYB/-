import hre from "hardhat";
const { ethers } = hre;
// Using native fetch in Node 18+

async function main() {
    console.log("==================================================");
    console.log("   🚀 Mars-X End-to-End (E2E) Integration Test    ");
    console.log("==================================================\n");

    const BACKEND_URL = 'http://localhost:3001';
    
    // 1. Setup Accounts
    const signers = await ethers.getSigners();
    const owner = signers[0];
    const user1 = signers[1];
    const user2 = signers[2];
    
    // We assume the protocol is deployed and addresses are correct
    const PEACE_PROTOCOL_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
    const PEACE_TOKEN_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
    
    const protocol = await ethers.getContractAt("PeaceProtocol", PEACE_PROTOCOL_ADDRESS);
    const token = await ethers.getContractAt("PeaceToken", PEACE_TOKEN_ADDRESS);
    
    const interactionFee = ethers.parseEther("0.0008");
    const fingerprint = `e2e-test-device-${Date.now()}`; // Unique fingerprint for this test run

    console.log("--- Test Step 1: Initial State Check ---");
    try {
        const res = await fetch(`${BACKEND_URL}/api/quota/${fingerprint}`);
        const data = await res.json();
        console.log(`[Backend] Device quota for ${fingerprint}: ${data.activeSlots}/20`);
        if (data.activeSlots !== 0) throw new Error("Expected 0 active slots for new fingerprint");
        console.log("✅ Initial state check passed.\n");
    } catch (e) {
        console.error("❌ Failed step 1:", e.message);
        return;
    }

    console.log("--- Test Step 2: User 1 Interacts (No Referrer) ---");
    try {
        console.log(`[Smart Contract] Sending interact transaction from User 1 (${user1.address})...`);
        const tx = await protocol.connect(user1).interact(ethers.ZeroAddress, { value: interactionFee });
        await tx.wait();
        
        const balance = await token.balanceOf(user1.address);
        console.log(`[Smart Contract] User 1 Balance: ${ethers.formatEther(balance)} PEACE`);
        if (balance < ethers.parseEther("1000")) throw new Error("User 1 did not receive 1000 PEACE");

        console.log(`[Backend] Syncing interaction to backend...`);
        const syncRes = await fetch(`${BACKEND_URL}/api/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: user1.address,
                visitorId: fingerprint,
                requestId: `req-${Date.now()}-1`,
                referrerAddress: ethers.ZeroAddress
            })
        });
        const syncData = await syncRes.json();
        console.log(`[Backend] Sync result:`, syncData);
        if (syncData.isShadow) throw new Error("User 1 should not be a shadow account");
        
        console.log("✅ Step 2 passed.\n");
    } catch (e) {
        console.error("❌ Failed step 2:", e.message);
        return;
    }

    console.log("--- Test Step 3: User 2 Interacts (Referred by User 1) ---");
    try {
        console.log(`[Smart Contract] Sending interact transaction from User 2 (${user2.address}) referring User 1...`);
        const tx = await protocol.connect(user2).interact(user1.address, { value: interactionFee });
        await tx.wait();
        
        const user2Balance = await token.balanceOf(user2.address);
        const user1BalanceNew = await token.balanceOf(user1.address);
        
        console.log(`[Smart Contract] User 2 Balance: ${ethers.formatEther(user2Balance)} PEACE`);
        console.log(`[Smart Contract] User 1 New Balance: ${ethers.formatEther(user1BalanceNew)} PEACE`);
        
        // User 2 gets 1000. User 1 gets 1000 (from step 2) + 100 (referral) = 1100
        if (user2Balance < ethers.parseEther("1000")) throw new Error("User 2 did not receive 1000 PEACE");
        if (user1BalanceNew < ethers.parseEther("1100")) throw new Error("User 1 did not receive referral bonus");

        console.log(`[Backend] Syncing interaction to backend...`);
        const syncRes = await fetch(`${BACKEND_URL}/api/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: user2.address,
                visitorId: fingerprint,
                requestId: `req-${Date.now()}-2`,
                referrerAddress: user1.address
            })
        });
        const syncData = await syncRes.json();
        console.log(`[Backend] Sync result:`, syncData);
        if (syncData.isShadow) throw new Error("User 2 should not be a shadow account");

        // Verify quota updated to 2
        const quotaRes = await fetch(`${BACKEND_URL}/api/quota/${fingerprint}`);
        const quotaData = await quotaRes.json();
        console.log(`[Backend] Updated device quota: ${quotaData.activeSlots}/20`);
        if (quotaData.activeSlots !== 2) throw new Error("Expected 2 active slots");

        console.log("✅ Step 3 passed.\n");
    } catch (e) {
        console.error("❌ Failed step 3:", e.message);
        return;
    }

    console.log("==================================================");
    console.log("  🎉 ALL END-TO-END INTEGRATION TESTS PASSED! 🎉  ");
    console.log("==================================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });