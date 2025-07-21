import { supabase } from './supabase';
import type { User, EmissionData, Certificate, CarbonCredit, Transaction } from './supabase';

// Demo mode flag - set to false when using real Supabase
const DEMO_MODE = false;

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
    emissions: [],
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
        created_at: new Date().toISOString(),
      }
    ],
    transactions: []
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

  // Emissions Data
  async saveEmissionData(userId: string, data: Partial<EmissionData>): Promise<EmissionData> {
    const emissionData: EmissionData = {
      id: `emission-${Date.now()}`,
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

    if (DEMO_MODE) {
      this.demoData.emissions.push(emissionData);
      return emissionData;
    }

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
    }

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

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
    }

    const { data, error } = await supabase
      .from('emission_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Certificates
  async createCertificate(userId: string, emissionDataId: string, certificateData: Partial<Certificate>): Promise<Certificate> {
    const certificate: Certificate = {
      id: `cert-${Date.now()}`,
      user_id: userId,
      emission_data_id: emissionDataId,
      certificate_id: certificateData.certificate_id || `GHG-${Date.now()}`,
      title: certificateData.title || 'Emissions Certificate',
      total_emissions: certificateData.total_emissions || 0,
      breakdown: certificateData.breakdown || {},
      status: 'verified',
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      blockchain_tx: certificateData.blockchain_tx,
      data_hash: certificateData.data_hash || '',
      created_at: new Date().toISOString(),
    };

    if (DEMO_MODE) {
      this.demoData.certificates.push(certificate);
      return certificate;
    }

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
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

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCertificate(certificateId: string): Promise<Certificate | null> {
    if (DEMO_MODE) {
      return this.demoData.certificates.find(c => c.certificate_id === certificateId) || null;
    }

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (error) return null;
    return data;
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

  // Transactions
  async createTransaction(userId: string, creditId: string, amount: number, totalPrice: number): Promise<Transaction> {
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: userId,
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

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
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

    // Get user's wallet address for context
    const user = await supabase.from('users').select('wallet_address').eq('id', userId).single();
    if (user.data) {
      await this.setWalletContext(user.data.wallet_address);
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
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

  // Leaderboard
  async getLeaderboard() {
    if (DEMO_MODE) {
      return [
        {
          rank: 1,
          name: 'EcoTech Solutions',
          totalEmissions: 1250,
          offsetCredits: 1500,
          netEmissions: -250,
          offsetPercentage: 120,
          certificates: 8,
          change: 2,
          badge: 'Carbon Negative',
        },
        {
          rank: 2,
          name: 'Green Industries Ltd',
          totalEmissions: 2100,
          offsetCredits: 2000,
          netEmissions: 100,
          offsetPercentage: 95,
          certificates: 12,
          change: 1,
          badge: 'Climate Leader',
        }
      ];
    }

    // Real implementation would aggregate user data
    return [];
  }
}

export const apiClient = new ApiClient();