import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("PeaceProtocol Vulnerability Tests", function () {
  let peaceData, peaceToken, peaceProtocol;
  let owner, feeReceiver1, feeReceiver2, user1, user2, attacker;
  const interactionFee = hre.ethers.parseEther("0.0008");

  beforeEach(async function () {
    [owner, feeReceiver1, feeReceiver2, user1, user2, attacker] = await hre.ethers.getSigners();

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

  describe("Reentrancy Attack Test", function () {
    let attackerContract;

    beforeEach(async function () {
      const ReentrancyAttacker = await hre.ethers.getContractFactory("ReentrancyAttacker");
      attackerContract = await ReentrancyAttacker.connect(attacker).deploy(
        await peaceProtocol.getAddress()
      );
    });

    it("Should prevent reentrancy during fee transfer", async function () {
      // We simulate an attack where the feeReceiver is a malicious contract
      // that tries to re-enter the interact function during the ETH transfer.
      
      // Update fee receiver to the attacker contract
      await peaceProtocol.connect(owner).setFeeReceivers(await attackerContract.getAddress(), feeReceiver2.address);

      // Attack
      await expect(
        attackerContract.connect(attacker).attack({ value: interactionFee })
      ).to.be.reverted; // We expect it to revert due to lack of gas or explicit reentrancy guard
    });
  });

  describe("Unauthorized Minting Test", function () {
    it("Should prevent arbitrary users from minting tokens directly", async function () {
      await expect(
        peaceToken.connect(attacker).mint(attacker.address, hre.ethers.parseEther("1000000"))
      ).to.be.revertedWith("Caller is not the protocol");
    });

    it("Should prevent arbitrary users from modifying data directly", async function () {
      await expect(
        peaceData.connect(attacker).setLastInteraction(attacker.address, 0)
      ).to.be.revertedWith("Caller is not the protocol");
    });
  });
});