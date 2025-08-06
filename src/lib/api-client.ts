import { supabase } from './supabase';
import type { User, EmissionData, Certificate, CarbonCredit, Transaction } from './supabase';
import { 
  Client, 
  AccountId, 
  PrivateKey, 
  TokenId, 
  TransferTransaction 
} from '@hashgraph/sdk';
import { ethers } from 'ethers';

// Demo mode flag - set to true for demo mode, false for real Supabase
const DEMO_MODE = false; // Enable real Supabase integration

// Hedera configuration
const HEDERA_OPERATOR_ID = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
const HEDERA_OPERATOR_KEY = process.env.NEXT_PUBLIC_HEDERA_PRIVATE_KEY;
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const HEDERA_EVM_PRIVATE_KEY = process.env.NEXT_PUBLIC_HEDERA_EVM_PRIVATE_KEY;
const CARBON_RETIREMENT_LOG_EVM_ADDRESS = "0x7De9dc37043E5601ceF6a306B7C77b956d4DF703";
const CO2E_TOKEN_ID = "0.0.6503424";
const CO2E_TOKEN_EVM_ADDRESS = "0x0000000000000000000000000000000006503424";

// Initialize Hedera client
let hederaClient: Client | null = null;

const getHederaClient = (): Client => {
  if (hederaClient) return hederaClient;
  
  if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
    throw new Error('Hedera credentials not configured');
  }
  
  hederaClient = HEDERA_NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  hederaClient.setOperator(
    AccountId.fromString(HEDERA_OPERATOR_ID), 
    PrivateKey.fromString(HEDERA_OPERATOR_KEY)
  );
  
  return hederaClient;
};

// Convert EVM address to Hedera Account ID using Mirror Node
export async function getHederaAccountIdFromEvmAddress(evmAddress: string): Promise<string | null> {
  const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
    ? 'https://mainnet.mirrornode.hedera.com' 
    : 'https://testnet.mirrornode.hedera.com';
    
  try {
    const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${evmAddress}`);
    const data = await response.json();
    
    if (data.account) {
      return data.account; // Returns "0.0.XXXXXX" format directly
    }
    return null;
  } catch (error) {
    console.error(`Error converting EVM address ${evmAddress} to Hedera Account ID:`, error);
    return null;
  }
}

class ApiClient {
  private demoData = {
    users: [
      {
        id: 'demo-user-1',
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'demo@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    emissions: [] as any[],
    certificates: [
      {
        id: 'cert-1',
        user_id: 'demo-user-1',
        emission_data_id: 'emission-1',
        certificate_id: 'GHG-2024-001',
        title: 'Q1 2024 Emissions Certificate',
        total_emissions: 2450,
        breakdown: { Energy: 1200, Transport: 850, Waste: 400 },
        status: 'verified' as const,
        issue_date: '2024-04-15',
        valid_until: '2025-04-15',
        blockchain_tx: '0x1234567890abcdef',
        data_hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        created_at: new Date().toISOString(),
      }
    ],
    credits: [
      {
        id: 'credit-1',
        title: 'Amazon Rainforest Conservation',
        description: 'Protecting 10,000 hectares of pristine Amazon rainforest from deforestation',
        price: 25.50,
        price_unit: 'per tonne CO₂e',
        available: 5000,
        total_supply: 10000,
        project_type: 'Forest Conservation',
        location: 'Brazil',
        vintage: '2024',
        rating: 4.8,
        verified: true,
        image_url: 'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg',
        hedera_token_id: CO2E_TOKEN_ID,
        smart_contract_address: CARBON_RETIREMENT_LOG_EVM_ADDRESS,
        created_at: new Date().toISOString(),
        hedera_account_id: '0.0.' + Math.floor(Math.random() * 1000000), // Mock Hedera Account ID
      }
    ],
    transactions: [] as any[]
  };

  // Set wallet context for RLS
  private async setWalletContext(walletAddress: string) {
    if (DEMO_MODE) return;
    
    try {
      await supabase.rpc('set_wallet_context', {
        wallet_addr: walletAddress
      });
    } catch (error) {
      console.warn('Failed to set wallet context:', error);
    }
  }

  // Convert EVM address to Hedera Account ID using Mirror Node
  async getHederaAccountIdFromEvmAddress(evmAddress: string): Promise<string | null> {
    const mirrorNodeUrl = HEDERA_NETWORK === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
      
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${evmAddress}`);
      const data = await response.json();
      
      if (data.account) {
        return data.account; // Returns "0.0.XXXXXX" format directly
      }
      return null;
    } catch (error) {
      console.error(`Error converting EVM address ${evmAddress} to Hedera Account ID:`, error);
      return null;
    }
  }

  // User Management
  async getUser(walletAddress: string): Promise<User | null> {
    if (DEMO_MODE) {
      return this.demoData.users.find(u => u.wallet_address === walletAddress) || null;
    }

    await this.setWalletContext(walletAddress);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) return null;
    return data;
  }

  async createUser(walletAddress: string, email?: string): Promise<User> {
    const userData = {
      wallet_address: walletAddress,
      email,
      auth_method: 'wallet',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (DEMO_MODE) {
      const user = { id: `user-${Date.now()}`, ...userData };
      this.demoData.users.push(user);
      return user;
    }

    await this.setWalletContext(walletAddress);

    // Use the secure registration function instead of direct insert
    const { data, error } = await supabase.rpc('register_user', {
      p_wallet_address: walletAddress,
      p_email: email,
      p_auth_method: 'wallet',
      p_display_name: null,
      p_google_id: null,
      p_avatar_url: null
    });

    if (error) {
      console.error('Registration error:', error);
      throw error;
    }
    
    return data;
  }

  // Helper method to get user profile by ID
  private async getUserProfileById(userId: string): Promise<any> {
    if (DEMO_MODE) {
      return this.demoData.users.find(u => u.id === userId) || null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  }

  // Emissions Data
  async saveEmissionData(userId: string, data: Partial<EmissionData>): Promise<EmissionData> {
    if (DEMO_MODE) {
      const emissionData: EmissionData = {
        id: crypto.randomUUID(),
        user_id: userId,
        file_name: data.file_name || 'unknown.csv',
        total_emissions: data.total_emissions || 0,
        breakdown: data.breakdown || {},
        raw_data: data.raw_data || [],
        processed_data: data.processed_data || [],
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.demoData.emissions.push(emissionData);
      return emissionData;
    }

    // For wallet users, we need to ensure they have a proper auth session
    // Try to get the authenticated user, but also allow wallet-based operations
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Use the authenticated user ID if available, otherwise use the provided userId
    const effectiveUserId = authUser?.id || userId;
    
    // If we have an authUser, use their ID; otherwise, we'll rely on wallet context
    if (!authUser && userId) {
      // For wallet users without auth session, set wallet context
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const emissionData: EmissionData = {
      id: crypto.randomUUID(),
      user_id: effectiveUserId,
      file_name: data.file_name || 'unknown.csv',
      total_emissions: data.total_emissions || 0,
      breakdown: data.breakdown || {},
      raw_data: data.raw_data || [],
      processed_data: data.processed_data || [],
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('emission_data')
      .insert([emissionData])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getUserEmissions(userId: string): Promise<EmissionData[]> {
    if (DEMO_MODE) {
      return this.demoData.emissions.filter(e => e.user_id === userId);
    }

    // Handle authentication for both email and wallet users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const effectiveUserId = authUser?.id || userId;
    
    // For wallet users without auth session, set wallet context
    if (!authUser && userId) {
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const { data, error } = await supabase
      .from('emission_data')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Certificates
  async createCertificate(userId: string, emissionDataId: string, certificateData: Partial<Certificate>): Promise<Certificate> {
    const certificate: Certificate = {
      id: crypto.randomUUID(),
      user_id: userId,
      emission_data_id: emissionDataId,
      certificate_id: certificateData.certificate_id || `GHG-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      title: certificateData.title || 'Emissions Certificate',
      total_emissions: certificateData.total_emissions || 0,
      breakdown: certificateData.breakdown || {},
      status: 'verified',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      blockchain_tx: certificateData.blockchain_tx,
      hcs_message_id: certificateData.hcs_message_id,
      ipfs_cid: certificateData.ipfs_cid,
      hedera_nft_serial: certificateData.hedera_nft_serial,
      data_hash: certificateData.data_hash || '',
      created_at: new Date().toISOString(),
    };

    if (DEMO_MODE) {
      this.demoData.certificates.push(certificate);
      return certificate;
    }

    // Handle authentication for both email and wallet users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const effectiveUserId = authUser?.id || userId;
    
    // Update certificate with effective user ID
    certificate.user_id = effectiveUserId;
    
    // For wallet users without auth session, set wallet context
    if (!authUser && userId) {
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert([certificate])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    if (DEMO_MODE) {
      return this.demoData.certificates.filter(c => c.user_id === userId);
    }

    // Handle authentication for both email and wallet users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const effectiveUserId = authUser?.id || userId;
    
    // For wallet users without auth session, set wallet context
    if (!authUser && userId) {
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCertificate(certificateId: string): Promise<Certificate | null> {
    if (DEMO_MODE) {
      return this.demoData.certificates.find(c => c.certificate_id === certificateId) || null;
    }

    // Fetch certificate with associated emission data
    const { data: certificateData, error: certificateError } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (certificateError) return null;
    if (!certificateData) return null;

    // Fetch associated emission data if emission_data_id exists
    let emissionDetails = null;
    if (certificateData.emission_data_id) {
      const { data: emissionData, error: emissionError } = await supabase
        .from('emission_data')
        .select('*')
        .eq('id', certificateData.emission_data_id)
        .single();

      if (!emissionError && emissionData) {
        emissionDetails = emissionData;
      }
    }

    // Return certificate with emission details
    return {
      ...certificateData,
      emission_details: emissionDetails
    };
  }

  // Carbon Credits
  async getCarbonCredits(): Promise<CarbonCredit[]> {
    if (DEMO_MODE) {
      return [
        {
          id: 'credit-1',
          title: 'Amazon Rainforest Conservation',
          description: 'Protecting 10,000 hectares of pristine Amazon rainforest from deforestation',
          price: 25.50,
          price_unit: 'per tonne CO₂e',
          available: 5000,
          total_supply: 10000,
          project_type: 'Forest Conservation',
          location: 'Brazil',
          vintage: '2024',
          rating: 4.8,
          verified: true,
          image_url: 'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg',
          hedera_token_id: CO2E_TOKEN_ID,
          smart_contract_address: CARBON_RETIREMENT_LOG_EVM_ADDRESS,
          created_at: new Date().toISOString(),
        },
        {
          id: 'credit-2',
          title: 'Solar Farm Development',
          description: 'Large-scale solar energy project generating clean electricity for 50,000 homes',
          price: 18.75,
          price_unit: 'per tonne CO₂e',
          available: 8500,
          total_supply: 15000,
          project_type: 'Renewable Energy',
          location: 'India',
          vintage: '2024',
          rating: 4.6,
          verified: true,
          image_url: 'https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg',
          hedera_token_id: CO2E_TOKEN_ID,
          smart_contract_address: CARBON_RETIREMENT_LOG_EVM_ADDRESS,
          created_at: new Date().toISOString(),
        }
      ];
    }

    const { data, error } = await supabase
      .from('carbon_credits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Purchase Carbon Credits with Hedera HTS Token Transfer
  async purchaseCarbonCredits(userId: string, creditId: string, amount: number, userHederaAccountId: string): Promise<Transaction> {
    if (DEMO_MODE) {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        user_id: userId,
        credit_id: creditId,
        amount,
        total_price: amount * 25.50, // Mock price
        status: 'completed',
        hedera_tx_id: `0x${Math.random().toString(16).substr(2, 40)}`,
        blockchain_tx: `0x${Math.random().toString(16).substr(2, 40)}`,
        created_at: new Date().toISOString(),
      };
      this.demoData.transactions.push(transaction);
      return transaction;
    }

    // 1. Fetch CarbonCredit details from Supabase
    const { data: carbonCredit, error: creditError } = await supabase
      .from('carbon_credits')
      .select('hedera_token_id, price, available')
      .eq('id', creditId)
      .single();

    if (creditError) throw creditError;
    if (!carbonCredit) throw new Error('Carbon credit not found.');
    if (carbonCredit.available < amount) throw new Error('Insufficient credits available.');

    const { hedera_token_id, price, available } = carbonCredit;
    const totalPrice = amount * price;

    try {
      // 2. Use Hedera SDK to transfer tokens from marketplace treasury to user
      console.log(`Transferring ${amount} tokens from treasury to user ${userHederaAccountId}...`);
      
      const client = getHederaClient();
      const treasuryAccountId = AccountId.fromString(HEDERA_OPERATOR_ID!);
      const userAccount = AccountId.fromString(userHederaAccountId);
      const tokenId = TokenId.fromString(hedera_token_id || CO2E_TOKEN_ID);

      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, treasuryAccountId, -amount)
        .addTokenTransfer(tokenId, userAccount, amount)
        .freezeWith(client);

      const transferTxSigned = await transferTx.sign(PrivateKey.fromString(HEDERA_OPERATOR_KEY!));
      const transferTxResponse = await transferTxSigned.execute(client);
      const transferReceipt = await transferTxResponse.getReceipt(client);
      const hederaTxId = transferTxResponse.transactionId.toString();

      console.log(`✅ Token transfer successful! Transaction ID: ${hederaTxId}`);
      console.log(`Transfer status: ${transferReceipt.status.toString()}`);

      // 3. Record transaction in Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const effectiveUserId = authUser?.id || userId;

      const transactionData: Omit<Transaction, 'id'> = {
        user_id: effectiveUserId,
        credit_id: creditId,
        amount: amount,
        total_price: totalPrice,
        status: 'completed',
        hedera_tx_id: hederaTxId,
        blockchain_tx: hederaTxId, // For backward compatibility
        created_at: new Date().toISOString(),
      };

      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 4. Update available quantity in carbon_credits table
      const { error: updateError } = await supabase
        .from('carbon_credits')
        .update({ available: available - amount })
        .eq('id', creditId);

      if (updateError) throw updateError;

      return newTransaction;
    } catch (error) {
      console.error('Error in purchaseCarbonCredits:', error);
      throw new Error(`Failed to purchase carbon credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Retire Carbon Credits by logging intent to smart contract
  async retireCarbonCredits(
    userId: string, 
    certificateSupabaseId: string, 
    amount: number, 
    ghgCertificateId: string,
    userEvmAddress: string
  ): Promise<Transaction> {
    if (DEMO_MODE) {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        user_id: userId,
        credit_id: null,
        amount,
        total_price: 0,
        status: 'pending_retirement',
        hedera_tx_id: `0x${Math.random().toString(16).substr(2, 40)}`,
        ghg_certificate_id: certificateSupabaseId,
        blockchain_tx: `0x${Math.random().toString(16).substr(2, 40)}`,
        created_at: new Date().toISOString(),
      };
      this.demoData.transactions.push(transaction);
      return transaction;
    }

    try {
      // 1. Setup ethers.js provider and contract
      const rpcUrl = HEDERA_NETWORK === 'mainnet' 
        ? 'https://mainnet.hashio.io/api' 
        : 'https://testnet.hashio.io/api';
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      if (!HEDERA_EVM_PRIVATE_KEY) {
        throw new Error('Hedera EVM private key not configured (NEXT_PUBLIC_HEDERA_EVM_PRIVATE_KEY)');
      }
      const signer = new ethers.Wallet(HEDERA_EVM_PRIVATE_KEY, provider);

      // CarbonRetirementLog ABI (just the function we need)
      const carbonRetirementLogABI = [
        "function logRetirementIntent(address tokenAddress, uint256 amount, string memory ghgCertificateId) external",
        "event RetirementLogged(address indexed retiree, address indexed tokenAddress, uint256 amount, string ghgCertificateId)"
      ];

      const carbonRetirementLogContract = new ethers.Contract(
        CARBON_RETIREMENT_LOG_EVM_ADDRESS, 
        carbonRetirementLogABI, 
        signer
      );

      // 2. Call logRetirementIntent on the smart contract
      console.log(`Calling logRetirementIntent for ${amount} tokens with GHG ID: ${ghgCertificateId}...`);
      
      const tx = await carbonRetirementLogContract.logRetirementIntent(
        CO2E_TOKEN_EVM_ADDRESS, // Token EVM address
        amount,
        ghgCertificateId,
        { 
          gasLimit: 1000000, // Ensure sufficient gas
          from: userEvmAddress // Specify the user as the caller
        }
      );

      const receipt = await tx.wait();
      const hederaTxId = receipt.hash;

      console.log(`✅ logRetirementIntent successful! Transaction hash: ${hederaTxId}`);

      // 3. Record transaction in Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const effectiveUserId = authUser?.id || userId;

      const transactionData: Omit<Transaction, 'id'> = {
        user_id: effectiveUserId,
        credit_id: null, // This is a retirement, not a credit purchase
        amount: amount,
        total_price: 0, // Retirement doesn't involve a price
        status: 'pending_retirement', // Custom status to indicate waiting for backend listener
        hedera_tx_id: hederaTxId,
        ghg_certificate_id: certificateSupabaseId,
        blockchain_tx: hederaTxId, // For backward compatibility
        created_at: new Date().toISOString(),
      };

      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      return newTransaction;
    } catch (error) {
      console.error('Error in retireCarbonCredits:', error);
      throw new Error(`Failed to retire carbon credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Transactions
  async createTransaction(userId: string, creditId: string, amount: number, totalPrice: number): Promise<Transaction> {
    // Handle authentication for both email and wallet users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const effectiveUserId = authUser?.id || userId;
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      user_id: effectiveUserId,
      credit_id: creditId,
      amount,
      total_price: totalPrice,
      status: 'completed',
      blockchain_tx: `0x${Math.random().toString(16).substr(2, 40)}`,
      created_at: new Date().toISOString(),
    };

    if (DEMO_MODE) {
      this.demoData.transactions.push(transaction);
      return transaction;
    }

    // For wallet users without auth session, set wallet context
    if (!authUser && userId) {
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    if (DEMO_MODE) {
      return this.demoData.transactions.filter(t => t.user_id === userId);
    }

    // Handle authentication for both email and wallet users
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const effectiveUserId = authUser?.id || userId;
    
    // For wallet users without auth session, set wallet context
    if (!authUser && userId) {
      const userProfile = await this.getUserProfileById(userId);
      if (userProfile?.wallet_address) {
        await this.setWalletContext(userProfile.wallet_address);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get retirement transactions for a specific certificate
  async getCertificateRetirementTransactions(certificateId: string): Promise<Transaction[]> {
    if (DEMO_MODE) {
      return this.demoData.transactions.filter(t => 
        t.ghg_certificate_id === certificateId && t.status === 'completed_retirement'
      );
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('ghg_certificate_id', certificateId)
      .eq('status', 'completed_retirement')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Dashboard Stats
  async getDashboardStats(userId: string) {
    const emissions = await this.getUserEmissions(userId);
    const certificates = await this.getUserCertificates(userId);
    const transactions = await this.getUserTransactions(userId);

    const totalEmissions = emissions.reduce((sum, e) => sum + e.total_emissions, 0);
    const offsetCredits = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEmissions,
      offsetCredits,
      certificates: certificates.length,
      marketplaceTransactions: transactions.length,
      emissionsChange: -12.5, // Mock data
      offsetsChange: 23.8, // Mock data
    };
  }

}

export const apiClient = new ApiClient();