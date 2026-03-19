import hre from "hardhat";
const { ethers } = hre;

async function main() {
    console.log("=== Starting Self-Referral Sybil Attack Simulation ===\n");

    const signers = await ethers.getSigners();
    const attacker = signers[11]; 
    const attackerAlt = signers[12];

    const PEACE_PROTOCOL_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
    const PEACE_TOKEN_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

    const protocol = await ethers.getContractAt("PeaceProtocol", PEACE_PROTOCOL_ADDRESS);
    const token = await ethers.getContractAt("PeaceToken", PEACE_TOKEN_ADDRESS);
    
    const interactionFee = ethers.parseEther("0.0008");

    console.log(`Attacker Main Address: ${attacker.address}`);
    console.log(`Attacker Alt Address: ${attackerAlt.address}\n`);

    // --- Scenario 1: Strict Self Referral (A refers A) ---
    console.log("1. Attempting Strict Self-Referral (Attacker refers themselves)...");
    try {
        const tx = await protocol.connect(attacker).interact(attacker.address, { value: interactionFee });
        await tx.wait();
        const balance = await token.balanceOf(attacker.address);
        // Base reward is 1000. If self-referral worked, it would be 1100.
        if (balance > ethers.parseEther("1000")) {
            console.log("❌ VULNERABILITY FOUND: Attacker received referral bonus for referring themselves.");
            console.log(`   Balance: ${ethers.formatEther(balance)} PEACE`);
        } else {
            console.log("✅ Attack Mitigated: System correctly ignored self-referral.");
        }
    } catch (error) {
        console.log(`✅ Attack Failed/Reverted: ${error.message.split('\n')[0]}`);
    }

    // --- Scenario 2: Sybil Ring Referral (A refers B, B refers A) ---
    // Note: Our current simple contract doesn't explicitly track deep cycles, 
    // but the backend does. Let's see how the contract handles basic interaction.
    console.log("\n2. Attempting Sybil Ring Referral (A -> B, B -> A)...");
    try {
        // Wait 12 hours for attacker to be able to interact again if we want to use them, 
        // but let's just use Alt referring Main
        console.log("Alt account interacting, referring Main account...");
        const tx2 = await protocol.connect(attackerAlt).interact(attacker.address, { value: interactionFee });
        await tx2.wait();
        
        const altBalance = await token.balanceOf(attackerAlt.address);
        const mainBalance = await token.balanceOf(attacker.address);
        
        console.log(`   Alt Balance (Interacted): ${ethers.formatEther(altBalance)} PEACE`);
        console.log(`   Main Balance (Referred): ${ethers.formatEther(mainBalance)} PEACE`);
        console.log("   Info: This is standard behavior. Deep Sybil rings are prevented by the backend device fingerprinting.");

    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });