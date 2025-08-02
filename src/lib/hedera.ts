import { 
    Client, 
    PrivateKey, 
    AccountId, 
    TopicId,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenType,
    TokenSupplyType
  } from '@hashgraph/sdk';
  
  // `client` is declared here but not initialized, so it can be reused
  let client: Client;
  
  // Function to get the Hedera client instance
  export const getHederaClient = (): Client => {
    // If client is already initialized, return it
    if (client) return client;
  
    // Load environment variables here, ensuring they are accessed after dotenv has run
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
  
    // Basic validation for Hedera credentials
    if (!operatorId || !operatorKey) {
      console.warn('Hedera OPERATOR_ID or OPERATOR_KEY not set. Hedera functionality will be limited.');
      throw new Error('Hedera account ID and private key must be set in your .env.local file. Please ensure NEXT_PUBLIC_HEDERA_ACCOUNT_ID and NEXT_PUBLIC_HEDERA_PRIVATE_KEY are configured.');
    }
  
    // Configure client based on network
    if (network === 'mainnet') {
      client = Client.forMainnet();
    } else if (network === 'testnet') {
      client = Client.forTestnet();
    } else if (network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      throw new Error('Unknown Hedera network specified. Use "mainnet", "testnet", or "previewnet".');
    }
  
    console.log("Loaded account:", process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID);
console.log("Loaded key:", process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY?.slice(0, 10), '...');

    // Set the operator for the client
    client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
    
    return client;
  };
  
  // Check if Hedera is properly configured by checking environment variables
  export const isHederaConfigured = (): boolean => {
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
    return !!(operatorId && operatorKey);
  };
  
  // Get HashScan URL for transaction
  export const getHashScanUrl = (txId: string): string => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet'; // Get network dynamically
    const hashScanBaseUrl = `https://hashscan.io/${network}/transaction/`;
    // Convert SDK transaction ID format to HashScan format
    const formattedTxId = txId.replace('-', '@');
    return `${hashScanBaseUrl}${formattedTxId}`;
  };
  
  // --- Hedera Consensus Service (HCS) Functions ---
  
  // Function to create a new HCS topic (run once per topic needed)
  export const createHederaTopic = async (): Promise<TopicId> => {
    const client = getHederaClient();
    try {
      const transaction = await new TopicCreateTransaction().execute(client);
      const receipt = await transaction.getReceipt(client);
      const topicId = receipt.topicId;
      if (!topicId) throw new Error('TopicId not found in receipt.');
      console.log(`HCS Topic created: ${topicId.toString()}`);
      return topicId;
    } catch (error) {
      console.error('Error creating HCS topic:', error);
      throw error;
    }
  };
  
  // Function to submit a message to an HCS topic
  export const submitHCSMessage = async (topicId: string, message: string): Promise<string> => {
    const client = getHederaClient();
    try {
      const transaction = await new TopicMessageSubmitTransaction({
        topicId: TopicId.fromString(topicId),
        message: message,
      }).execute(client);
      
      const receipt = await transaction.getReceipt(client);
      console.log(`Message submitted to topic ${topicId}: ${receipt.status.toString()}`);
      return transaction.transactionId.toString();
    } catch (error) {
      console.error(`Error submitting message to HCS topic ${topicId}:`, error);
      throw error;
    }
  };
  
  // --- Hedera Token Service (HTS) Functions ---
  
  // Function to create an NFT token (run once per token type)
  export const createNFTToken = async (tokenName: string, tokenSymbol: string): Promise<string> => {
    const client = getHederaClient();
    // Retrieve operator details again to ensure they are fresh
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
  
    if (!operatorId || !operatorKey) {
      throw new Error('Hedera operator ID and key are required to create NFT token.');
    }
  
    const treasuryId = AccountId.fromString(operatorId);
    const treasuryKey = PrivateKey.fromString(operatorKey);
  
    try {
      const createTokenTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(250000000)
        .setSupplyKey(treasuryKey.publicKey)
        .freezeWith(client); // Freeze with the client to automatically set transaction ID
  
      const createTokenTxSign = await createTokenTx.sign(treasuryKey);
      const createTokenSubmit = await createTokenTxSign.execute(client);
      const createTokenRx = await createTokenSubmit.getReceipt(client);
      const tokenId = createTokenRx.tokenId;
  
      if (!tokenId) throw new Error('TokenId not found in receipt.');
  
      console.log(`NFT Token created: ${tokenId.toString()}`);
      return tokenId.toString();
    } catch (error) {
      console.error('Error creating NFT token:', error);
      throw error;
    }
  };
  
  // Function to mint an NFT
  export const mintNFT = async (tokenId: string, metadataCid: string): Promise<string> => {
    const client = getHederaClient();
    // Retrieve operator details again to ensure they are fresh
    const operatorId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
    const operatorKey = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
  
    if (!operatorId || !operatorKey) {
      throw new Error('Hedera operator ID and key are required to mint NFT.');
    }
  
    const treasuryId = AccountId.fromString(operatorId);
    const treasuryKey = PrivateKey.fromString(operatorKey);
  
    try {
      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from(metadataCid)])
        .freezeWith(client); // Freeze with the client to automatically set transaction ID
  
      const mintTxSign = await mintTx.sign(treasuryKey);
      const mintTxSubmit = await mintTxSign.execute(client);
      const mintRx = await mintTxSubmit.getReceipt(client);
      
      console.log(`NFT Minted: ${mintRx.status.toString()} - Serial: ${mintRx.serials?.[0]}`);
      return mintTx.transactionId.toString();
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  };
  
  // Function to log certificate data to HCS
  export const logCertificateToHCS = async (
    topicId: string, 
    certificateData: {
      certificateId: string;
      dataHash: string;
      totalEmissions: number;
      breakdown: Record<string, number>;
      timestamp: string;
    }
  ): Promise<string> => {
    const message = JSON.stringify({
      type: 'CARBON_CERTIFICATE',
      version: '1.0',
      ...certificateData
    });
    
    return await submitHCSMessage(topicId, message);
  };
  
  // Mock IPFS upload function (for hackathon demo)
  export const uploadToIPFS = async (data: any): Promise<string> => {
    // In a real implementation, you'd upload to IPFS
    // For hackathon demo, we'll generate a mock CID based on the data hash
    const dataString = JSON.stringify(data);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataString));
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Generate a mock IPFS CID (QmHash format)
    return `Qm${hashHex.substring(0, 44)}`;
  };
  