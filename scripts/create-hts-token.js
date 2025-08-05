import {
    Client,
    PrivateKey,
    AccountId,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Hbar,
  } from '@hashgraph/sdk';
  import dotenv from 'dotenv';
  
  dotenv.config({ path: './.env.local' });
  
  async function main() {
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  
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
  
    console.log(`Attempting to create HTS fungible token on ${network} network...`);
  
    try {
      const tokenName = 'Carbon Credit';
      const tokenSymbol = 'CO2e';
      const decimals = 0;
      const initialSupply = 0;
      const maxSupply = 1000000000;
  
      const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(AccountId.fromString(operatorId))
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(maxSupply)
        .setSupplyKey(PrivateKey.fromString(operatorKey).publicKey)
        .freezeWith(client);
  
      const tokenCreateSign = await tokenCreateTx.sign(PrivateKey.fromString(operatorKey));
      const tokenCreateSubmit = await tokenCreateSign.execute(client);
      const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
      const tokenId = tokenCreateRx.tokenId;
  
      if (!tokenId) {
        throw new Error('Token ID not found in transaction receipt.');
      }
  
      console.log(`\n✅ HTS Fungible Token "${tokenName}" created successfully!`);
      console.log(`   Token ID: ${tokenId.toString()}`);
      console.log(`   Transaction ID: ${tokenCreateSubmit.transactionId.toString()}`); // Added this line
      console.log(`   Token Symbol: ${tokenSymbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Initial Supply: ${initialSupply}`);
      console.log(`   Max Supply: ${maxSupply}`);
      console.log(`\n💡 Remember to add this Token ID (${tokenId.toString()}) to your Supabase 'carbon_credits' table.`);
  
      // construct the HashScan URL here
      const hashScanBaseUrl = `https://hashscan.io/${network}/transaction/`;
      const hashScanUrl = `${hashScanBaseUrl}${tokenCreateSubmit.transactionId.toString().replace('@', '-')}`;
      console.log(`\n🔗 View transaction on HashScan: ${hashScanUrl}`);
  
    } catch (error) {
      console.error('\n❌ Error creating HTS fungible token:', error);
    } finally {
      if (client) {
        client.close();
      }
    }
  }
  
  main();
  