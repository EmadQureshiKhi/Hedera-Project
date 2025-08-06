import {
    Client,
    PrivateKey,
    AccountId,
    TopicCreateTransaction,
    TopicId,
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
  
    console.log(`Attempting to create HCS Topic on ${network} network...`);
  
    try {
      // Create the HCS Topic
      const topicCreateTx = await new TopicCreateTransaction()
        .setTopicMemo('Carbon Credit Retirement Audit Trail')
        .freezeWith(client);
  
      // Sign the transaction with the operator key
      const topicCreateSign = await topicCreateTx.sign(PrivateKey.fromString(operatorKey));
  
      // Execute the transaction
      const topicCreateSubmit = await topicCreateSign.execute(client);
  
      // Get the receipt of the transaction
      const topicCreateRx = await topicCreateSubmit.getReceipt(client);
  
      const topicId = topicCreateRx.topicId;
  
      if (!topicId) {
        throw new Error('Topic ID not found in transaction receipt.');
      }
  
      // Get the Topic's EVM address (needed for Solidity contract interaction)
      // This requires a Hedera mirror node query or a specific SDK function if available
      // For simplicity in this script, we'll derive it from the Topic ID (shard.realm.num -> 0x[num])
      const topicNum = topicId.num.toString();
      const topicEVMAddress = `0x${'0'.repeat(40 - topicNum.length)}${topicNum}`; // Simple derivation, verify with mirror node
  
      console.log(`\n✅ HCS Topic created successfully!`); // Corrected line
      console.log(`   Topic ID: ${topicId.toString()}`);
      console.log(`   Topic EVM Address: ${topicEVMAddress}`); // This is the address to use in Solidity
      console.log(`   Transaction ID: ${topicCreateSubmit.transactionId.toString()}`);
  
      const hashScanBaseUrl = `https://hashscan.io/${network}/transaction/`;
      const hashScanUrl = `${hashScanBaseUrl}${topicCreateSubmit.transactionId.toString().replace('@', '-')}`;
      console.log(`\n🔗 View transaction on HashScan: ${hashScanUrl}`);
  
      console.log(`\n💡 IMPORTANT: Copy the Topic EVM Address (${topicEVMAddress}) and use it in your CarbonRetirement.sol contract constructor.`);
  
    } catch (error) {
      console.error('\n❌ Error creating HCS Topic:', error);
    } finally {
      if (client) {
        client.close();
      }
    }
  }
  
  main();
  