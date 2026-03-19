import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PeaceProtocol Core Logic Tests", function () {
  let peaceData, peaceToken, peaceProtocol;
  let owner, feeReceiver1, feeReceiver2, user1, user2, referrer;
  const interactionFee = hre.ethers.parseEther("0.0008");

  beforeEach(async function () {
    [owner, feeReceiver1, feeReceiver2, user1, user2, referrer] = await hre.ethers.getSigners();

    // Deploy PeaceData
    const PeaceData = await hre.ethers.getContractFactory("PeaceData");
    peaceData = await PeaceData.deploy();

    // Deploy PeaceToken
    const PeaceToken = await hre.ethers.getContractFactory("PeaceToken");
    peaceToken = await PeaceToken.deploy();

    // Deploy PeaceProtocol
    const PeaceProtocol = await hre.ethers.getContractFactory("PeaceProtocol");
    peaceProtocol = await PeaceProtocol.deploy(
      await peaceData.getAddress(),
      await peaceToken.getAddress(),
      feeReceiver1.address,
      feeReceiver2.address
    );

    // Setup Permissions
    await peaceData.setProtocol(await peaceProtocol.getAddress());
    await peaceToken.setProtocol(await peaceProtocol.getAddress());
  });

  describe("1. Basic Interaction & Fee Split", function () {
    it("Should fail if fee is insufficient", async function () {
      await expect(
        peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: hre.ethers.parseEther("0.0001") })
      ).to.be.revertedWith("Insufficient interaction fee");
    });

    it("Should process basic interaction and split fee correctly", async function () {
      const initialBalance1 = await hre.ethers.provider.getBalance(feeReceiver1.address);
      const initialBalance2 = await hre.ethers.provider.getBalance(feeReceiver2.address);

      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });

      const finalBalance1 = await hre.ethers.provider.getBalance(feeReceiver1.address);
      const finalBalance2 = await hre.ethers.provider.getBalance(feeReceiver2.address);

      // Fee is 0.0008, half is 0.0004
      expect(finalBalance1 - initialBalance1).to.equal(hre.ethers.parseEther("0.0004"));
      expect(finalBalance2 - initialBalance2).to.equal(hre.ethers.parseEther("0.0004"));

      // User should get base reward 1000 PEACE
      const userBalance = await peaceToken.balanceOf(user1.address);
      expect(userBalance).to.equal(hre.ethers.parseEther("1000"));
    });
  });

  describe("2. Cooldown & Streak Logic", function () {
    it("Should enforce 12-hour cooldown", async function () {
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      
      // Try again immediately
      await expect(
        peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee })
      ).to.be.revertedWith("Cool down active: Please wait 12 hours between interactions");

      // Advance time by 6 hours
      await time.increase(6 * 3600);
      await expect(
        peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee })
      ).to.be.revertedWith("Cool down active: Please wait 12 hours between interactions");

      // Advance to 12+ hours
      await time.increase(7 * 3600);
      await expect(
        peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee })
      ).to.not.be.reverted;
    });

    it("Should calculate streak bonus correctly across days", async function () {
      // Day 1: Interact
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      let balance = await peaceToken.balanceOf(user1.address);
      expect(balance).to.equal(hre.ethers.parseEther("1000"));

      // Advance 1 day (24 hours)
      await time.increase(24 * 3600);

      // Day 2: Interact (Streak +1) -> Reward: 1000 + 100 = 1100
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      balance = await peaceToken.balanceOf(user1.address);
      expect(balance).to.equal(hre.ethers.parseEther("2100")); // 1000 + 1100

      // Advance 1 day
      await time.increase(24 * 3600);

      // Day 3: Interact (Streak +2) -> Reward: 1000 + 200 = 1200
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      balance = await peaceToken.balanceOf(user1.address);
      expect(balance).to.equal(hre.ethers.parseEther("3300")); // 2100 + 1200
    });

    it("Should break streak if more than 1 day skipped", async function () {
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      
      // Advance 3 days (breaking the streak)
      await time.increase(3 * 24 * 3600);

      // Should reset to base reward (1000)
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      const balance = await peaceToken.balanceOf(user1.address);
      expect(balance).to.equal(hre.ethers.parseEther("2000")); // 1000 + 1000 (no bonus)
    });
  });

  describe("3. Referral Rewards", function () {
    it("Should mint 10% extra to referrer", async function () {
      await peaceProtocol.connect(user1).interact(referrer.address, { value: interactionFee });

      const userBalance = await peaceToken.balanceOf(user1.address);
      const referrerBalance = await peaceToken.balanceOf(referrer.address);

      expect(userBalance).to.equal(hre.ethers.parseEther("1000"));
      // 10% of 1000 = 100
      expect(referrerBalance).to.equal(hre.ethers.parseEther("100")); 
    });

    it("Should not give referral reward if referrer is self", async function () {
      await peaceProtocol.connect(user1).interact(user1.address, { value: interactionFee });
      const userBalance = await peaceToken.balanceOf(user1.address);
      expect(userBalance).to.equal(hre.ethers.parseEther("1000")); // No extra 100
    });
  });
});
