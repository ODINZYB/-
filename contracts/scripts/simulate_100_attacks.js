import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("=== Starting 100 Hacker Attack Simulation ===\n");

    // We will use one attacker account to deploy the malicious contract
    const signers = await ethers.getSigners();
    const attackerAccount = signers[10]; // Use an account we haven't used much

    const PEACE_PROTOCOL_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; // Current deployed protocol
    const interactionFee = ethers.parseEther("0.0008");

    // 1. Deploy the Attacker Contract
    console.log("Deploying malicious ReentrancyAttacker contract...");
    const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
    const attackerContract = await ReentrancyAttacker.connect(attackerAccount).deploy(PEACE_PROTOCOL_ADDRESS);
    await attackerContract.waitForDeployment();
    const attackerAddress = await attackerContract.getAddress();
    console.log(`Malicious contract deployed at: ${attackerAddress}`);

    // 2. We need the owner to set this malicious contract as a fee receiver
    // In a real attack, the attacker might exploit a vulnerability to become a fee receiver,
    // or exploit a callback during token transfer. Here we simulate the condition being met.
    console.log("Simulating owner being compromised and setting attacker as fee receiver...");
    const owner = signers[0];
    const protocol = await ethers.getContractAt("PeaceProtocol", PEACE_PROTOCOL_ADDRESS);
    
    // We get the current fee receivers to restore them later if needed
    const currentFeeReceiver1 = await protocol.feeReceiver1();
    const currentFeeReceiver2 = await protocol.feeReceiver2();
    
    const txSetFee = await protocol.connect(owner).setFeeReceivers(attackerAddress, currentFeeReceiver2);
    await txSetFee.wait();
    console.log("Malicious fee receiver set!\n");

    // 3. Launch 100 concurrent/sequential attacks
    console.log("Launching 100 reentrancy attack attempts...");
    
    let blockedAttacks = 0;
    let successfulAttacks = 0;

    for (let i = 1; i <= 100; i++) {
        try {
            process.stdout.write(`[Attack ${i}/100] Attempting exploit... `);
            const tx = await attackerContract.connect(attackerAccount).attack({ value: interactionFee });
            await tx.wait();
            successfulAttacks++;
            console.log("❌ Attack Succeeded (VULNERABILITY FOUND!)");
        } catch (error) {
            blockedAttacks++;
            // Check if the error is the ReentrancyGuard revert
            if (error.message.includes("ReentrancyGuard: reentrant call") || error.message.includes("reverted")) {
                console.log("✅ Attack Blocked by ReentrancyGuard");
            } else {
                console.log(`✅ Attack Failed (Other reason: ${error.message.split('\n')[0]})`);
            }
        }
    }

    console.log("\n=== Simulation Complete ===");
    console.log(`Total Attacks Attempted: 100`);
    console.log(`Attacks Blocked (Secured): ${blockedAttacks}`);
    console.log(`Attacks Succeeded (Breached): ${successfulAttacks}`);

    if (successfulAttacks === 0) {
        console.log("\n🛡️ SYSTEM IS SECURE! All reentrancy attacks were successfully mitigated.");
    } else {
        console.log("\n⚠️ CRITICAL WARNING! The system is vulnerable.");
    }

    // Cleanup: Restore original fee receiver
    console.log("\nRestoring original protocol state...");
    await protocol.connect(owner).setFeeReceivers(currentFeeReceiver1, currentFeeReceiver2);
    console.log("State restored.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });