import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { 
  Wallet, 
  ExternalLink, 
  RefreshCw,
  TrendingUp,
  Leaf,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { getHashScanAccountUrl } from '@/lib/hedera';

export function TokenBalanceCard() {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get user's Hedera Account ID from their EVM address
  const getUserHederaAccountId = async (evmAddress: string): Promise<string | null> => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl = network === 'mainnet' 
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
      console.error('Error converting EVM address to Hedera Account ID:', error);
      return null;
    }
  };

  // Get user's CO2e token balance
  const getUserTokenBalance = async (hederaAccountId: string): Promise<number> => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl = network === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
    
    const tokenId = '0.0.6503424'; // CO2e token ID
      
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${hederaAccountId}/tokens?token.id=${tokenId}`);
      const data = await response.json();
      
      if (data.tokens && data.tokens.length > 0) {
        return parseInt(data.tokens[0].balance) || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  };

  // Load user's token balance
  const loadTokenBalance = async () => {
    if (!user?.wallet_address) return;

    setIsLoading(true);
    try {
      const accountId = await getUserHederaAccountId(user.wallet_address);
      setHederaAccountId(accountId);
      
      if (accountId) {
        const balance = await getUserTokenBalance(accountId);
        setTokenBalance(balance);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load balance on mount and when user changes
  useEffect(() => {
    loadTokenBalance();
  }, [user?.wallet_address]);

  if (!user?.wallet_address) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Wallet className="h-5 w-5" />
          Your CO2e Credits
        </CardTitle>
        <CardDescription>
          Carbon offset credits available for retirement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Token Balance</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadTokenBalance}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? '...' : tokenBalance !== null ? tokenBalance.toLocaleString() : '0'}
            </p>
            <p className="text-xs text-muted-foreground">CO2e credits</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2 mt-2">Hedera Account</p>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-blue-600">
                  {hederaAccountId || user?.hedera_account_id || 'Not found'}
                </p>
              </div>
              {(hederaAccountId || user?.hedera_account_id) && (
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                  <a href={getHashScanAccountUrl(hederaAccountId || user?.hedera_account_id!)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span className="text-xs text-muted-foreground">View on HashScan</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href="/marketplace">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy More Credits
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/certificates">
              <Leaf className="h-4 w-4 mr-2" />
              Offset Emissions
            </Link>
          </Button>
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}