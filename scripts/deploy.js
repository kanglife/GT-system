const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy(deployer.address);
  
  await governanceToken.waitForDeployment();
  console.log("✅ GovernanceToken deployed to:", await governanceToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});