const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // --- Configuration ---
  // CRITICAL: UPDATED WITH YOUR LATEST DEPLOYED CARBONRETIREMENTLOG CONTRACT ADDRESS
  const CARBON_RETIREMENT_CONTRACT_ADDRESS = ethers.getAddress("0x7De9dc37043E5601ceF6a306B7C77b956d4DF703"); // <--- THIS IS THE ADDRESS FROM YOUR LAST DEPLOYMENT
  
  // This HTS token EVM address is still needed for the logRetirementIntent event
  const HTS_TOKEN_EVM_ADDRESS = ethers.getAddress("0x0000000000000000000000000000000000633c00"); // Your HTS token EVM address (0.0.6503424)
  
  const AMOUNT_TO_RETIRE = 10; // Amount of tokens to log for retirement
  const GHG_CERTIFICATE_ID = "GHG-TEST-001"; // A sample GHG Certificate ID

  console.log("--- Interacting with CarbonRetirementLog Contract ---");

  // Get the signer (your operator account)
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // --- Load CarbonRetirementLog Contract ABI ---
  const CarbonRetirementLogArtifactPath = path.resolve(__dirname, '../artifacts/contracts/CarbonRetirementLog.sol/CarbonRetirementLog.json');
  const CarbonRetirementLogArtifact = JSON.parse(fs.readFileSync(CarbonRetirementLogArtifactPath, 'utf8'));
  const CarbonRetirementLogABI = CarbonRetirementLogArtifact.abi;

  // Get the CarbonRetirementLog contract instance
  const carbonRetirementLog = new ethers.Contract(
    CARBON_RETIREMENT_CONTRACT_ADDRESS,
    CarbonRetirementLogABI,
    deployer
  );
  // Add this line to confirm the address being used
  console.log(`Attempting to attach to CarbonRetirementLog at: ${CARBON_RETIREMENT_CONTRACT_ADDRESS}`);
  console.log(`Attached to CarbonRetirementLog at: ${carbonRetirementLog.target}`); // Use .target for ethers v6

  // --- Step 1: Call logRetirementIntent on the CarbonRetirementLog contract ---
  console.log(`Calling logRetirementIntent for ${AMOUNT_TO_RETIRE} tokens with GHG ID: ${GHG_CERTIFICATE_ID}...`);
  try {
    const logTx = await carbonRetirementLog.logRetirementIntent(
      HTS_TOKEN_EVM_ADDRESS, // Pass the token address for logging
      AMOUNT_TO_RETIRE,
      GHG_CERTIFICATE_ID,
      { gasLimit: 1_000_000 } // Set a higher gas limit for the transaction
    );
    const receipt = await logTx.wait();
    console.log("logRetirementIntent transaction successful!");
    console.log(`Transaction hash: ${logTx.hash}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    console.log("\n--- Verification ---");
    console.log("Check the transaction on HashScan for the 'RetirementLogged' event.");
    console.log("Your backend SDK should now listen for this event to trigger the actual token burn via Hedera SDK.");

  } catch (error) {
    console.error("Error calling logRetirementIntent:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
