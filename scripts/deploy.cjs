const { ethers } = require("hardhat");

async function main() {
  console.log("--- Deploying CarbonRetirementLog Contract ---");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Get the ContractFactory for CarbonRetirementLog
  const CarbonRetirementLog = await ethers.getContractFactory("CarbonRetirementLog");

  // Deploy the contract
  const carbonRetirementLog = await CarbonRetirementLog.deploy();
  await carbonRetirementLog.waitForDeployment(); // Wait for the contract to be deployed

  console.log(`CarbonRetirementLog deployed to: ${carbonRetirementLog.target}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
