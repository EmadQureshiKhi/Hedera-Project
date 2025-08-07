import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TokenId, 
  TokenBurnTransaction,
  AccountBalanceQuery,
  TopicId,
  TopicMessageSubmitTransaction
} from '@hashgraph/sdk';
import { ethers } from 'ethers';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Supabase client for backend operations with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('🔧 Supabase URL for listener:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 Supabase Service Role Key loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Environment configuration
const OPERATOR_ID = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
const OPERATOR_KEY = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const CARBON_RETIREMENT_LOG_EVM_ADDRESS = "0x7De9dc37043E5601ceF6a306B7C77b956d4DF703";
const HCS_TOPIC_ID = "0.0.6503501";
const CO2E_TOKEN_ID = "0.0.6503424";

if (!OPERATOR_ID || !OPERATOR_KEY) {
  console.error('❌ Hedera operator ID or key not set. Exiting listener.');
  process.exit(1);
}

// Initialize Hedera client
const client = HEDERA_NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
client.setOperator(AccountId.fromString(OPERATOR_ID), PrivateKey.fromString(OPERATOR_KEY));

console.log(`🚀 Hedera Backend Listener starting on ${HEDERA_NETWORK}...`);
console.log(`📋 Monitoring contract: ${CARBON_RETIREMENT_LOG_EVM_ADDRESS}`);
console.log(`📝 HCS Topic: ${HCS_TOPIC_ID}`);
console.log(`🪙 CO2e Token: ${CO2E_TOKEN_ID}`);

// CarbonRetirementLog ABI (just the event we need)
const carbonRetirementLogABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "retiree", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "tokenAddress", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "ghgCertificateId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "RetirementLogged",
    "type": "event"
  }
];
const iface = new ethers.Interface(carbonRetirementLogABI);

// Function to convert EVM address to Hedera Account ID
async function getHederaAccountIdFromEvmAddress(evmAddress: string): Promise<string | null> {
  const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
    ? 'https://mainnet.mirrornode.hedera.com' 
    : 'https://testnet.mirrornode.hedera.com';

  // Ensure the EVM address is properly formatted (e.g., starts with 0x)
  const formattedEvmAddress = evmAddress.startsWith('0x') ? evmAddress : `0x${evmAddress}`;
    
  try {
    const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${formattedEvmAddress}`);
    const data = await response.json();
    console.log(`🔍 Mirror Node response for ${formattedEvmAddress}:`, data);
    
    if (data.account) {
      return data.account;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error converting EVM address ${evmAddress} to Hedera Account ID:`, error);
    return null;
  }
}

// Process retirement event from smart contract
async function processRetirementEvent(
  retireeEvmAddress: string, 
  tokenEvmAddress: string, 
  amount: ethers.BigNumberish, 
  ghgCertificateId: string, 
  smartContractTxHash: string
) {
  console.log(`\n🔄 Processing retirement for GHG ID: ${ghgCertificateId}`);
  console.log(`👤 Retiree EVM: ${retireeEvmAddress}`);
  console.log(`🪙 Token EVM: ${tokenEvmAddress}`);
  console.log(`📊 Amount: ${amount.toString()}`);

  try {
    // 1. Find the certificate's internal Supabase ID (UUID) using its public ghgCertificateId
    console.log(`🔍 Searching for certificate with public ID: ${ghgCertificateId}`);
    const { data: certificate, error: fetchCertError } = await supabase
      .from('certificates')
      .select('id, total_emissions, offset_amount')
      .eq('certificate_id', ghgCertificateId)
      .single();

    if (fetchCertError || !certificate) {
      console.error(`❌ Error finding certificate with public ID ${ghgCertificateId}:`, fetchCertError?.message || 'Certificate not found.');
      return;
    }
    const certificateSupabaseId = certificate.id;
    console.log(`✅ Found certificate Supabase ID: ${certificateSupabaseId}`);

    // 2. Convert Retiree EVM Address to Hedera Account ID
    const retireeHederaAccountId = await getHederaAccountIdFromEvmAddress(retireeEvmAddress);
    if (!retireeHederaAccountId) {
      console.error(`❌ Could not find Hedera Account ID for EVM address: ${retireeEvmAddress}. Skipping burn.`);
      return;
    }
    console.log(`✅ Retiree Hedera Account ID: ${retireeHederaAccountId}`);

    // Log operator's token balance before burn
    const operatorBalance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(OPERATOR_ID!))
      .execute(client);
    console.log(`📊 Operator CO2e Token Balance (before burn): ${operatorBalance.tokens.get(CO2E_TOKEN_ID) || 0}`);

    // 3. Convert Token EVM Address to Hedera Token ID (we know this is our CO2e token)
    const hederaTokenId = TokenId.fromString(CO2E_TOKEN_ID);
    console.log(`✅ Hedera Token ID: ${hederaTokenId.toString()}`);

    // 4. Perform Token Burn
    console.log(`🔥 Attempting to burn ${amount.toString()} tokens...`);
    
    const burnTx = await new TokenBurnTransaction()
      .setTokenId(hederaTokenId)
      .setAmount(Number(amount.toString()))
      .freezeWith(client);

    // Sign with the supply key (operator's private key)
    const burnTxSigned = await burnTx.sign(PrivateKey.fromString(OPERATOR_KEY));
    const burnTxResponse = await burnTxSigned.execute(client);
    const burnReceipt = await burnTxResponse.getReceipt(client);

    if (burnReceipt.status.toString() !== 'SUCCESS') {
      console.error(`❌ Token Burn failed. Status: ${burnReceipt.status.toString()}`);
      return; // Stop processing if burn failed
    }
    const burnHederaTxId = burnTxResponse.transactionId.toString();
    
    console.log(`✅ Token Burn successful! Transaction ID: ${burnHederaTxId}`);
    console.log(`🔥 Burn status: ${burnReceipt.status.toString()}`);

    // 5. Submit HCS Message for Audit Trail
    console.log(`📝 Submitting HCS message to topic ${HCS_TOPIC_ID}...`);
    
    const hcsMessageContent = JSON.stringify({
      type: 'CARBON_RETIREMENT_BURN',
      version: '1.0',
      ghgCertificateId: ghgCertificateId,
      retireeEvmAddress: retireeEvmAddress,
      retireeHederaAccountId: retireeHederaAccountId,
      tokenEvmAddress: tokenEvmAddress,
      hederaTokenId: hederaTokenId.toString(),
      amountBurned: amount.toString(),
      burnTransactionId: burnHederaTxId,
      smartContractLogTxHash: smartContractTxHash,
      timestamp: new Date().toISOString()
    });

    const hcsSubmitTx = await new TopicMessageSubmitTransaction({
      topicId: TopicId.fromString(HCS_TOPIC_ID),
      message: hcsMessageContent,
    }).execute(client);
    
    const hcsReceipt = await hcsSubmitTx.getReceipt(client);
    const retirementHcsMessageId = hcsSubmitTx.transactionId.toString();
    
    console.log(`✅ HCS Message submitted! Transaction ID: ${retirementHcsMessageId}`);
    console.log(`📝 HCS status: ${hcsReceipt.status.toString()}`);

    // 6. Update Supabase
    console.log(`💾 Updating Supabase for certificate Supabase ID: ${certificateSupabaseId}...`);
    
    // Find the transaction that initiated this retirement
    const { data: transactionToUpdate, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*')
      .eq('ghg_certificate_id', certificateSupabaseId)
      .eq('hedera_tx_id', smartContractTxHash)
      .eq('status', 'pending_retirement')
      .single();

    if (fetchTxError && fetchTxError.code === 'PGRST116') {
      console.log(`ℹ️ Transaction for GHG ID ${ghgCertificateId} (Tx Hash: ${smartContractTxHash}) already processed or not found in pending state. Skipping.`);
      return;
    }
    if (fetchTxError || !transactionToUpdate) {
      console.error(`❌ Error finding transaction to update for certificate Supabase ID ${certificateSupabaseId}:`, fetchTxError?.message || 'Transaction not found.');
      return;
    }

    // Update transaction with burn details
    const { error: updateTxError } = await supabase
      .from('transactions')
      .update({
        status: 'completed_retirement',
        hedera_tx_id: burnHederaTxId, // Update to the actual burn transaction ID
        retirement_hcs_message_id: retirementHcsMessageId,
      })
      .eq('id', transactionToUpdate.id);

    if (updateTxError) {
      console.error(`❌ Error updating transaction ${transactionToUpdate.id}:`, updateTxError);
      return;
    }
    console.log(`✅ Supabase transaction updated: ${transactionToUpdate.id}`);

    // Update certificate offset status
    const newOffsetAmount = (certificate.offset_amount || 0) + Number(amount.toString());
    const newOffsetStatus = newOffsetAmount >= certificate.total_emissions ? 'fully_offset' : 'partially_offset';

    const { error: updateCertError } = await supabase
      .from('certificates')
      .update({
        offset_amount: newOffsetAmount,
        offset_status: newOffsetStatus,
      })
      .eq('id', certificateSupabaseId);

    if (updateCertError) {
      console.error(`❌ Error updating certificate ${certificateSupabaseId}:`, updateCertError);
      return;
    }
    console.log(`✅ Certificate ${certificateSupabaseId} updated - Status: ${newOffsetStatus}, Amount: ${newOffsetAmount}`);

  } catch (error) {
    console.error(`❌ Error processing retirement event for GHG ID ${ghgCertificateId}:`, error);
    
    // Optionally update transaction status to 'failed_retirement' in Supabase
    try {
      await supabase
        .from('transactions')
        .update({ status: 'failed_retirement' })
        .eq('ghg_certificate_id', certificateSupabaseId)
        .eq('hedera_tx_id', smartContractTxHash);
    } catch (updateError) {
      console.error(`❌ Error updating failed transaction status:`, updateError);
    }
  }
}

// Main listener function using Mirror Node polling
async function startListener() {
  console.log(`👂 Listening for RetirementLogged events from ${CARBON_RETIREMENT_LOG_EVM_ADDRESS}...`);
  
  let lastTimestamp = Math.floor(Date.now() / 1000) - 1800; // Start 30 minutes ago (reduced from 1 hour)
  
  setInterval(async () => {
    try {
      const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
        ? 'https://mainnet.mirrornode.hedera.com' 
        : 'https://testnet.mirrornode.hedera.com';
        
      const response = await fetch(
        `${mirrorNodeUrl}/api/v1/contracts/${CARBON_RETIREMENT_LOG_EVM_ADDRESS}/results/logs?order=asc&timestamp=gt:${lastTimestamp}`
      );
      const data = await response.json();

      if (data.logs && data.logs.length > 0) {
        console.log(`📋 Found ${data.logs.length} new log(s) to process...`);
        
        // Sort logs by consensus_timestamp to ensure proper chronological processing
        const sortedLogs = data.logs.sort((a, b) => {
          const timestampA = parseFloat(a.consensus_timestamp || a.timestamp);
          const timestampB = parseFloat(b.consensus_timestamp || b.timestamp);
          return timestampA - timestampB;
        });
        
        for (const log of sortedLogs) {
          try {
            // Use consensus_timestamp if available, fallback to timestamp
            const logTimestamp = parseFloat(log.consensus_timestamp || log.timestamp);
            
            // Skip if this log is not newer than our last processed timestamp
            if (logTimestamp <= lastTimestamp) {
              console.log(`⏭️ Skipping log with timestamp ${logTimestamp} (not newer than ${lastTimestamp})`);
              continue;
            }
            
            // Decode the log data using ethers.js ABI decoder
            const decodedLog = iface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            // Only log details for RetirementLogged events to reduce noise
            if (decodedLog && decodedLog.name === 'RetirementLogged') {
              console.log(`🔍 Processing RetirementLogged event from log:`, {
                timestamp: logTimestamp,
                transaction_hash: log.transaction_hash,
                contract_id: log.contract_id
              });
            }

            if (decodedLog && decodedLog.name === 'RetirementLogged') {
              const { retiree, tokenAddress, amount, ghgCertificateId } = decodedLog.args;
              
              console.log(`\n🎯 --- RetirementLogged Event Detected ---`);
              console.log(`👤 Retiree EVM: ${retiree}`);
              console.log(`🪙 Token EVM: ${tokenAddress}`);
              console.log(`📊 Amount: ${amount.toString()}`);
              console.log(`📋 GHG ID: ${ghgCertificateId}`);
              console.log(`🔗 Transaction Hash: ${log.transaction_hash}`);
              console.log(`⏰ Log Timestamp: ${logTimestamp}`);

              // Process the event
              await processRetirementEvent(
                retiree, 
                tokenAddress, 
                amount, 
                ghgCertificateId, 
                log.transaction_hash
              );
            }
            
            // Update lastTimestamp to this log's timestamp + small epsilon
            // This ensures the next query will only fetch logs newer than this one
            lastTimestamp = logTimestamp + 0.000000001;
            
          } catch (decodeError) {
            console.error(`❌ Error decoding log:`, decodeError);
            // Still update timestamp even if decoding fails to avoid getting stuck
            const logTimestamp = parseFloat(log.consensus_timestamp || log.timestamp);
            if (logTimestamp > lastTimestamp) {
              lastTimestamp = logTimestamp + 0.000000001;
            }
          }
        }
        
        console.log(`📊 Updated lastTimestamp to: ${lastTimestamp}`);
      } else {
        console.log(`📋 No new logs found since timestamp: ${lastTimestamp}`);
      }
    } catch (error) {
      console.error('❌ Error fetching Mirror Node logs:', error);
    }
  }, 10000); // Poll every 10 seconds (reduced frequency to be more efficient)
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  if (client) {
    client.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  if (client) {
    client.close();
  }
  process.exit(0);
});

// Start the listener
console.log('🎬 Starting event listener...');
startListener().catch((error) => {
  console.error('❌ Fatal error in listener:', error);
  process.exit(1);
});