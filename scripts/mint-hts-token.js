import {
    Client,
    PrivateKey,
    AccountId,
    TokenMintTransaction,
    Hbar,
  } from '@hashgraph/sdk';
  import dotenv from 'dotenv';
  
  dotenv.config({ path: './.env.local' });
  
  async function main() {
    // Ensure environment variables are set
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  
    
    const tokenIdToMint = "0.0.6503424"; // Replace with the Token ID 
    const amountToMint = 1000000; // 
  
    if (!operatorId || !operatorKey) {
      console.error(
        'Error: Hedera OPERATOR_ID and OPERATOR_KEY must be set in your .env.local file.'
      );
      return;
    }
  
    let client;
    if (network === 'mainnet') {
      client = Client.forMainnet();
    } else if (network === 'testnet') {
      client = Client.forTestnet();
    } else if (network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      console.error(
        'Error: Unknown Hedera network specified. Use "mainnet", "testnet", or "previewnet".'
      );
      return;
    }
  
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
  
    console.log(`Attempting to mint ${amountToMint} tokens for Token ID ${tokenIdToMint} on ${network} network...`);
  
    try {
      // Mint the fungible token
      const tokenMintTx = await new TokenMintTransaction()
        .setTokenId(tokenIdToMint)
        .setAmount(amountToMint)
        .freezeWith(client);
  
      // Sign the transaction with the supply key (which iz operator key)
      const tokenMintSign = await tokenMintTx.sign(PrivateKey.fromString(operatorKey));
  
      // Execute the transaction
      const tokenMintSubmit = await tokenMintSign.execute(client);
  
      // Get the receipt of the transaction
      const tokenMintRx = await tokenMintSubmit.getReceipt(client);
  
      console.log(`\n✅ HTS Fungible Token minted successfully!`);
      console.log(`   Token ID: ${tokenIdToMint}`);
      console.log(`   Amount Minted: ${amountToMint}`);
      console.log(`   Transaction ID: ${tokenMintSubmit.transactionId.toString()}`);
  
      // Construct the HashScan URL
      const hashScanBaseUrl = `https://hashscan.io/${network}/transaction/`;
      const hashScanUrl = `${hashScanBaseUrl}${tokenMintSubmit.transactionId.toString().replace('@', '-')}`;
      console.log(`\n🔗 View minting transaction on HashScan: ${hashScanUrl}`);
  
    } catch (error) {
      console.error('\n❌ Error minting HTS fungible token:', error);
    } finally {
      if (client) {
        client.close();
      }
    }
  }
  
  main();
  