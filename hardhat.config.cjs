require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: './.env.local' }); // Load environment variables
// const { PrivateKey } = require("@hashgraph/sdk"); // No longer needed for this key format

const OPERATOR_ID = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
// Use the new EVM private key variable
const OPERATOR_EVM_KEY = process.env.NEXT_PUBLIC_HEDERA_EVM_PRIVATE_KEY; 

if (!OPERATOR_ID || !OPERATOR_EVM_KEY) { // Check for the new EVM key
  throw new Error("Hedera OPERATOR_ID and NEXT_PUBLIC_HEDERA_EVM_PRIVATE_KEY must be set in your .env.local file.");
}

// No need to parse the private key if it's already in hex format
// let rawPrivateKey;
// try {
//   rawPrivateKey = PrivateKey.fromString(OPERATOR_KEY).toStringRaw();
// } catch (e) {
//   throw new Error(`Failed to parse Hedera private key: ${e.message}. Please ensure it's a valid Hedera private key format.`);
// }


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28", // Ensure this matches your contract's pragma
  networks: {
    hederaTestnet: {
      url: "https://testnet.hashio.io/api", // Hedera Testnet JSON-RPC relay
      chainId: 296, // Hedera Testnet Chain ID
      accounts: [
        OPERATOR_EVM_KEY // Use the directly provided hex-encoded private key
      ],
      gasPrice: 400000000000, // Example gas price, adjust as needed
      gas: 2000000 // Example gas limit, adjust as needed
    },
    // You can add other networks like mainnet, previewnet here
  },
  defaultNetwork: "hederaTestnet",
};
