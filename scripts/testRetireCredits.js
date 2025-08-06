import { ethers } from "ethers";

// 🔐 Hardcoded private key from MetaMask (Testnet only!)
const PRIVATE_KEY = "0x02d9c86909af72980d952546b16e92abba9d3fd633dd51ab7a3634121ad1cf56";

// ✅ Hedera JSON-RPC Relay (Hashio Testnet)
const RPC_URL = "https://testnet.hashio.io/api";

// ✅ Your deployed contract and HTS token EVM addresses
const CARBON_RETIREMENT_CONTRACT_ADDRESS = "0xA1618621D0cE50CE9400C6BFE5370F9b3e7F30CE";
const HTS_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000000633c00";

// 🎯 Test inputs
const RETIRE_AMOUNT = ethers.parseUnits("10", 0); // Assuming 0 decimals
const GHG_CERTIFICATE_ID = "GHG-CERT-TEST-001";

// ✅ Minimal ABIs
const carbonRetirementAbi = [
  "function retireCredits(address _tokenAddress, uint256 _amount, string memory _ghgCertificateId) external"
];

const erc20Abi = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`🔑 Using wallet: ${wallet.address}`);

  const token = new ethers.Contract(HTS_TOKEN_EVM_ADDRESS, erc20Abi, wallet);
  const retirementContract = new ethers.Contract(CARBON_RETIREMENT_CONTRACT_ADDRESS, carbonRetirementAbi, wallet);

  try {
    // 1. Approve the contract to spend tokens
    console.log("🔄 Approving token transfer...");
    const approveTx = await token.approve(CARBON_RETIREMENT_CONTRACT_ADDRESS, RETIRE_AMOUNT);
    await approveTx.wait();
    console.log(`✅ Approved ${RETIRE_AMOUNT.toString()} tokens`);

    // 2. Call retireCredits
    console.log("🔥 Calling retireCredits...");
    const retireTx = await retirementContract.retireCredits(
      HTS_TOKEN_EVM_ADDRESS,
      RETIRE_AMOUNT,
      GHG_CERTIFICATE_ID,
      { gasLimit: 1_000_000 }
    );
    console.log(`📤 Transaction submitted: ${retireTx.hash}`);

    const receipt = await retireTx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
  } catch (err) {
    console.error("❌ Error during test:", err);
  }
}

main();
