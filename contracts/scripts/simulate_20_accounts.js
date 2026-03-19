import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("=== Starting 20 Accounts Interaction Simulation ===\n");

    // Get 20 signers from Hardhat local node
    const signers = await ethers.getSigners();
    const testAccounts = signers.slice(0, 20);

    // Contract Address (Ensure this matches your local deployment)
    const PEACE_PROTOCOL_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Using the deployed address from previous step
    
    const PeaceProtocol = await ethers.getContractFactory("PeaceProtocol");
    const protocol = PeaceProtocol.attach(PEACE_PROTOCOL_ADDRESS);

    const interactionFee = ethers.parseEther("0.0008");
    const referrer = ethers.ZeroAddress; // No referrer for this test

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < testAccounts.length; i++) {
        const account = testAccounts[i];
        console.log(`[Account ${i + 1}/20] Interacting with wallet: ${account.address}`);
        
        try {
            // Send transaction
            const tx = await protocol.connect(account).interact(referrer, { value: interactionFee });
            await tx.wait();
            console.log(`   ✅ Success! Tx Hash: ${tx.hash}`);
            successCount++;

            // Optional: Also hit the backend API to simulate full frontend behavior
            try {
                await fetch('http://localhost:3001/api/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: account.address,
                        visitorId: 'simulation-fingerprint-999',
                        requestId: `sim-req-${i}`,
                        referrerAddress: referrer
                    })
                });
                console.log(`   🌐 Backend sync successful`);
            } catch (backendErr) {
                console.log(`   ⚠️ Backend sync failed (is backend running?): ${backendErr.message}`);
            }

        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            failCount++;
        }
    }

    console.log("\n=== Simulation Complete ===");
    console.log(`Total Successful: ${successCount}`);
    console.log(`Total Failed: ${failCount}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });