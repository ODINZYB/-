import { expect } from "chai";
import hre from "hardhat";

describe("PeaceProtocol Edge Cases & Boundary Tests", function () {
  let peaceData, peaceToken, peaceProtocol;
  let owner, feeReceiver1, feeReceiver2, user1, user2;
  const interactionFee = hre.ethers.parseEther("0.0008");

  beforeEach(async function () {
    [owner, feeReceiver1, feeReceiver2, user1, user2] = await hre.ethers.getSigners();

    const PeaceData = await hre.ethers.getContractFactory("PeaceData");
    peaceData = await PeaceData.deploy();

    const PeaceToken = await hre.ethers.getContractFactory("PeaceToken");
    peaceToken = await PeaceToken.deploy();

    const PeaceProtocol = await hre.ethers.getContractFactory("PeaceProtocol");
    peaceProtocol = await PeaceProtocol.deploy(
      await peaceData.getAddress(),
      await peaceToken.getAddress(),
      feeReceiver1.address,
      feeReceiver2.address
    );

    await peaceData.setProtocol(await peaceProtocol.getAddress());
    await peaceToken.setProtocol(await peaceProtocol.getAddress());
  });

  describe("Airdrop Cap Logic", function () {
    it("Should correctly track total airdropped amount", async function () {
      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      const totalAirdropped = await peaceProtocol.totalAirdropped();
      // Base reward is 1000
      expect(totalAirdropped).to.equal(hre.ethers.parseEther("1000"));
    });

    it("Should revert when Airdrop Cap is reached", async function () {
      // To test the cap without running 500,000 transactions, we need a mock or 
      // we can deploy a modified protocol with a very small cap just for testing.
      // Let's deploy a test-specific protocol with a 1500 PEACE cap.

      const MockPeaceProtocol = await hre.ethers.getContractFactory("MockPeaceProtocol");
      const mockProtocol = await MockPeaceProtocol.deploy(
        await peaceData.getAddress(),
        await peaceToken.getAddress(),
        feeReceiver1.address,
        feeReceiver2.address
      );

      await peaceData.setProtocol(await mockProtocol.getAddress());
      await peaceToken.setProtocol(await mockProtocol.getAddress());

      // First interaction (1000 PEACE) - Should succeed
      await mockProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: interactionFee });
      
      // Second interaction (1000 PEACE) - Total would be 2000, exceeding 1500 cap
      await expect(
        mockProtocol.connect(user2).interact(hre.ethers.ZeroAddress, { value: interactionFee })
      ).to.be.revertedWith("Airdrop cap reached");
    });
  });

  describe("Fee Division Precision", function () {
    it("Should handle odd msg.value without reverting or losing wei", async function () {
      const oddFee = interactionFee + 1n; // Add 1 wei
      
      const initialBalance1 = await hre.ethers.provider.getBalance(feeReceiver1.address);
      const initialBalance2 = await hre.ethers.provider.getBalance(feeReceiver2.address);

      await peaceProtocol.connect(user1).interact(hre.ethers.ZeroAddress, { value: oddFee });

      const finalBalance1 = await hre.ethers.provider.getBalance(feeReceiver1.address);
      const finalBalance2 = await hre.ethers.provider.getBalance(feeReceiver2.address);

      const feeHalf = oddFee / 2n;
      const feeRemaining = oddFee - feeHalf;

      expect(finalBalance1 - initialBalance1).to.equal(feeHalf);
      expect(finalBalance2 - initialBalance2).to.equal(feeRemaining);
    });
  });

  describe("Staking Pool Transfers", function () {
    it("Should allow owner to transfer remaining tokens to staking pool", async function () {
      const stakingPool = user2.address;
      await peaceProtocol.connect(owner).setStakingPool(stakingPool);
      
      await peaceProtocol.connect(owner).transferRemainingToStakingPool();

      const poolBalance = await peaceToken.balanceOf(stakingPool);
      // Max supply is 1,000,000,000.
      expect(poolBalance).to.equal(hre.ethers.parseEther("1000000000"));
    });

    it("Should prevent non-owners from transferring to staking pool", async function () {
      await expect(
        peaceProtocol.connect(user1).transferRemainingToStakingPool()
      ).to.be.revertedWith("Caller is not the owner");
    });
  });
});