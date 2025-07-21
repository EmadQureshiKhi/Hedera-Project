import { createClient } from '@supabase/supabase-js';

// Demo configuration - replace with real Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  wallet_address: string | null; // Allow null wallet addresses
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface EmissionData {
  id: string;
  user_id: string;
  file_name: string;
  total_emissions: number;
  breakdown: Record<string, number>;
  raw_data: any[];
  processed_data: any[];
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  emission_data_id: string;
  certificate_id: string;
  title: string;
  total_emissions: number;
  breakdown: Record<string, number>;
  status: 'pending' | 'verified' | 'expired';
  issue_date: string;
  valid_until: string;
  blockchain_tx?: string;
  data_hash: string;
  created_at: string;
}

export interface CarbonCredit {
  id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  available: number;
  total_supply: number;
  project_type: string;
  location: string;
  vintage: string;
  rating: number;
  verified: boolean;
  image_url: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  credit_id: string;
  amount: number;
  total_price: number;
  status: 'pending' | 'completed' | 'failed';
  blockchain_tx?: string;
  created_at: string;
}

// Database schema for production
export const createTables = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE, -- Allow NULL wallet addresses
  email TEXT UNIQUE,
  auth_method TEXT NOT NULL DEFAULT 'email',
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emission data table
CREATE TABLE IF NOT EXISTS emission_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_emissions DECIMAL NOT NULL,
  breakdown JSONB NOT NULL,
  raw_data JSONB NOT NULL,
  processed_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emission_data_id UUID REFERENCES emission_data(id) ON DELETE CASCADE,
  certificate_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  total_emissions DECIMAL NOT NULL,
  breakdown JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  issue_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  blockchain_tx TEXT,
  data_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carbon credits table
CREATE TABLE IF NOT EXISTS carbon_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL NOT NULL,
  price_unit TEXT NOT NULL,
  available INTEGER NOT NULL,
  total_supply INTEGER NOT NULL,
  project_type TEXT NOT NULL,
  location TEXT NOT NULL,
  vintage TEXT NOT NULL,
  rating DECIMAL NOT NULL,
  verified BOOLEAN DEFAULT true,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credit_id UUID REFERENCES carbon_credits(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  total_price DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  blockchain_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own emissions" ON emission_data;
DROP POLICY IF EXISTS "Users can insert own emissions" ON emission_data;
DROP POLICY IF EXISTS "Users can read own certificates" ON certificates;
DROP POLICY IF EXISTS "Users can insert own certificates" ON certificates;
DROP POLICY IF EXISTS "Everyone can read carbon credits" ON carbon_credits;
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Updated RLS Policies for Users table
-- Allow anyone to insert new users (for wallet registration)
CREATE POLICY "Allow user registration" ON users 
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to read their own data (by wallet address or auth.uid)
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT 
  USING (
    auth.uid()::text = id OR 
    (wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true))
  );

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users 
  FOR UPDATE 
  USING (
    auth.uid()::text = id OR 
    (wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true))
  );

-- Emission data policies
CREATE POLICY "Users can read own emissions" ON emission_data 
  FOR SELECT 
  USING (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert own emissions" ON emission_data 
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );

-- Certificate policies
CREATE POLICY "Users can read own certificates" ON certificates 
  FOR SELECT 
  USING (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert own certificates" ON certificates 
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );

-- Carbon credits (public read access)
CREATE POLICY "Everyone can read carbon credits" ON carbon_credits 
  FOR SELECT 
  TO authenticated, anon;

-- Transaction policies
CREATE POLICY "Users can read own transactions" ON transactions 
  FOR SELECT 
  USING (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert own transactions" ON transactions 
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = user_id OR
    user_id IN (
      SELECT id FROM users 
      WHERE wallet_address IS NOT NULL AND wallet_address = current_setting('app.current_wallet', true)
    )
  );
`;