'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCarbonCredits, useCreateTransaction, usePurchaseCarbonCredits } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Leaf,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Wallet,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { getHashScanUrl } from '@/lib/hedera';

export function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [purchasingCredit, setPurchasingCredit] = useState<string | null>(null);
  const [userTokenBalance, setUserTokenBalance] = useState<number | null>(null);
  const [userHederaAccountId, setUserHederaAccountId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: credits, isLoading } = useCarbonCredits();
  const purchaseCarbonCredits = usePurchaseCarbonCredits(user?.id);

  // Get user's Hedera Account ID from their EVM address
  const getUserHederaAccountId = async (evmAddress: string): Promise<string | null> => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl = network === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
      
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts?account.evmaddress=${evmAddress}`);
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

  // Load user's Hedera info when component mounts
  React.useEffect(() => {
    const loadUserHederaInfo = async () => {
      if (user?.wallet_address) {
        const hederaAccountId = await getUserHederaAccountId(user.wallet_address);
        setUserHederaAccountId(hederaAccountId);
        
        if (hederaAccountId) {
          const balance = await getUserTokenBalance(hederaAccountId);
          setUserTokenBalance(balance);
        }
      }
    };

    loadUserHederaInfo();
  }, [user?.wallet_address]);

  const projectTypes = ['all', 'Forest Conservation', 'Renewable Energy', 'Reforestation', 'Waste Management', 'Ocean Conservation'];

  const filteredCredits = credits?.filter(credit => {
    const matchesSearch = credit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || credit.project_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handlePurchase = async (creditId: string, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase carbon credits",
        variant: "destructive",
      });
      return;
    }

    if (!userHederaAccountId) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your MetaMask wallet to purchase credits",
        variant: "destructive",
      });
      return;
    }

    const amount = 100; // Default purchase amount
    setPurchasingCredit(creditId);

    try {
      const result = await purchaseCarbonCredits.mutateAsync({
        creditId,
        amount,
        userHederaAccountId,
      });

      toast({
        title: "Purchase Successful!",
        description: (
          <div className="space-y-2">
            <p>Successfully purchased {amount} carbon credits</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full"
            >
              <a href={getHashScanUrl(result.hedera_tx_id!)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on HashScan
              </a>
            </Button>
          </div>
        ),
      });

      // Refresh user's token balance
      if (userHederaAccountId) {
        const newBalance = await getUserTokenBalance(userHederaAccountId);
        setUserTokenBalance(newBalance);
      }
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase carbon credits",
        variant: "destructive",
      });
    } finally {
      setPurchasingCredit(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Carbon Credit Marketplace</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Carbon Credit Marketplace</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Purchase verified carbon credits to offset your emissions and support sustainable projects worldwide
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* User Token Balance Card */}
        {user && userHederaAccountId && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Your CO2e Credits</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {userTokenBalance !== null ? userTokenBalance.toLocaleString() : '...'}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Account: {userHederaAccountId}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                <p className="text-2xl font-bold">
                  {credits?.reduce((sum, credit) => sum + credit.available, 0).toLocaleString()}
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{credits?.length || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">
                  ${credits ? (credits.reduce((sum, credit) => sum + credit.price, 0) / credits.length).toFixed(2) : '0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">
                  {new Set(credits?.map(credit => credit.location)).size || 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {projectTypes.map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All Types' : type}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits Grid */}
      {filteredCredits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No credits found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find carbon credits
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredits.map((credit) => (
            <Card key={credit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={credit.image_url}
                  alt={credit.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  {credit.verified && (
                    <Badge className="bg-green-600 text-white">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{credit.project_type}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{credit.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{credit.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {credit.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {credit.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vintage</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {credit.vintage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Token ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {credit.hedera_token_id || '0.0.6503424'}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium">
                      {credit.available.toLocaleString()} / {credit.total_supply.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        ${credit.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {credit.price_unit}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handlePurchase(credit.id, credit.price)}
                      disabled={purchasingCredit === credit.id || !userHederaAccountId}
                    >
                      {purchasingCredit === credit.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Purchasing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Credits
                        </>
                      )}
                    </Button>
                  </div>
                  {!userHederaAccountId && user && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Connect MetaMask to purchase credits
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}