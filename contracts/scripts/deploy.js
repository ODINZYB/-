import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting deployment on Mars-X network...");

  // 1. Deploy PeaceData
  const PeaceData = await hre.ethers.getContractFactory("PeaceData");
  const dataContract = await PeaceData.deploy();
  await dataContract.waitForDeployment();
  const dataAddress = await dataContract.getAddress();
  console.log(`PeaceData deployed to: ${dataAddress}`);

  // 2. Deploy PeaceToken
  const PeaceToken = await hre.ethers.getContractFactory("PeaceToken");
  const tokenContract = await PeaceToken.deploy();
  await tokenContract.waitForDeployment();
  const tokenAddress = await tokenContract.getAddress();
  console.log(`PeaceToken deployed to: ${tokenAddress}`);

  // 3. Deploy PeaceProtocol
  const PeaceProtocol = await hre.ethers.getContractFactory("PeaceProtocol");
  
  // 指定的两个交互手续费接收地址
  const feeReceiver1 = "0x2779a76210032e0e1358be35e212bc21078a7159";
  const feeReceiver2 = "0x1351ceb6687063b8271e4898ac38055e361a2f27";
  
  const protocolContract = await PeaceProtocol.deploy(dataAddress, tokenAddress, feeReceiver1, feeReceiver2);
  await protocolContract.waitForDeployment();
  const protocolAddress = await protocolContract.getAddress();
  console.log(`PeaceProtocol deployed to: ${protocolAddress}`);

  // 4. Setup Permissions
  console.log("Setting up permissions...");
  let tx1 = await dataContract.setProtocol(protocolAddress);
  await tx1.wait();
  let tx2 = await tokenContract.setProtocol(protocolAddress);
  await tx2.wait();
  console.log("Permissions set successfully!");

  // 5. Update Frontend Config
  updateFrontendConfig(protocolAddress, tokenAddress);
}

function updateFrontendConfig(protocolAddress, tokenAddress) {
  const configPath = path.join(__dirname, '../../frontend/lib/contracts/config.ts');
  
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Replace Protocol Address
    content = content.replace(
      /export const PEACE_PROTOCOL_ADDRESS = ".*";/,
      `export const PEACE_PROTOCOL_ADDRESS = "${protocolAddress}";`
    );
    
    // Replace Token Address
    content = content.replace(
      /export const PEACE_TOKEN_ADDRESS = ".*";/,
      `export const PEACE_TOKEN_ADDRESS = "${tokenAddress}";`
    );

    fs.writeFileSync(configPath, content);
    console.log("Frontend config updated with new contract addresses!");
  } else {
    console.warn("Frontend config file not found. Please update addresses manually.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
