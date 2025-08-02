import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import { createHederaTopic, createNFTToken } from '../src/lib/hedera';

async function main() {
  // Ensure environment variables are set
  if (!process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || !process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY) {
    console.error('Error: Hedera account ID and private key must be set in your .env.local file.');
    console.error('Please ensure NEXT_PUBLIC_HEDERA_ACCOUNT_ID and NEXT_PUBLIC_HEDERA_PRIVATE_KEY are configured.');
    return;
  }

  console.log('Attempting to create Hedera assets...');

  try {
    // Create HCS Topic
    console.log('\n--- Creating HCS Topic ---');
    const topicId = await createHederaTopic();
    console.log(`✅ HCS Topic ID: ${topicId.toString()}`);
    console.log('Please add this to your .env.local as NEXT_PUBLIC_HEDERA_HCS_TOPIC_ID');

    // Create NFT Token
    console.log('\n--- Creating NFT Token ---');
    const nftTokenId = await createNFTToken("GHG Certificates", "GHGCERT");
    console.log(`✅ NFT Token ID: ${nftTokenId.toString()}`);
    console.log('Please add this to your .env.local as NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID');

    console.log('\nAsset creation complete. Remember to update your .env.local file!');

  } catch (error) {
    console.error('\n❌ Failed to create Hedera assets:', error);
    console.error('Please ensure your Hedera account ID and private key are correct and have sufficient testnet HBAR.');
  }
}

main();
