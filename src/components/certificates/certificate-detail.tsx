'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCertificate, useRetireCarbonCredits } from '@/hooks/use-api';
import { useCertificateRetirementTransactions } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Download, 
  Share2, 
  ExternalLink,
  Calendar,
  CheckCircle,
  Copy,
  ArrowLeft,
  Leaf,
  Loader2,
  AlertCircle,
  Target,
  Wallet,
  ShoppingCart,
  History,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { getHashScanUrl } from '@/lib/hedera';
import { EmissionEntry } from '@/types/ghg';
import React from 'react';

interface CertificateDetailProps {
  certificateId: string;
}

export function CertificateDetail({ certificateId }: CertificateDetailProps) {
  const [copied, setCopied] = useState(false);
  const [showRetirementForm, setShowRetirementForm] = useState(false);
  const [retirementAmount, setRetirementAmount] = useState<number>(0);
  const [userTokenBalance, setUserTokenBalance] = useState<number | null>(null);
  const [userHederaAccountId, setUserHederaAccountId] = useState<string | null>(null);

  const { data: certificate, isLoading } = useCertificate(certificateId);
  const { data: retirementTransactions, isLoading: isLoadingRetirements } = useCertificateRetirementTransactions(certificate?.id);
  const { user, getMetaMaskSigner } = useAuth();
  const { toast } = useToast();
  const retireCarbonCredits = useRetireCarbonCredits(user?.id);

  // Get user's Hedera Account ID and token balance
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

  // Helper functions for Hedera integration
  const getUserHederaAccountId = async (evmAddress: string): Promise<string | null> => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl = network === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
    
    try {
      const response = await fetch(`${mirrorNodeUrl}/api/v1/accounts/${evmAddress}`);
      const data = await response.json();
    
      if (data && data.account) {
        return data.account; // Returns "0.0.XXXXXX" format directly
      }
      return null;
    } catch (error) {
      console.error('Error converting EVM address to Hedera Account ID:', error);
      return null;
    }
  };

  const getUserTokenBalance = async (hederaAccountId: string): Promise<number> => {
    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const mirrorNodeUrl = network === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
  
    const tokenId = '0.0.6503424';
    
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

  const handleRetireCredits = async () => {
    if (!user || !certificate || !userHederaAccountId || !user.wallet_address) {
      toast({
        title: "Error",
        description: "Missing required information for retirement. Please ensure your wallet is connected.",
        variant: "destructive",
      });
      return;
    }

    if (retirementAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid retirement amount",
        variant: "destructive",
      });
      return;
    }

    if ((userTokenBalance ?? 0) !== null && retirementAmount > (userTokenBalance ?? 0)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${(userTokenBalance ?? 0)} CO2e credits available`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Get MetaMask signer for transaction confirmation
      const metaMaskSigner = await getMetaMaskSigner();
    
      if (!metaMaskSigner) {
        toast({
          title: "MetaMask Required",
          description: "Please ensure MetaMask is connected and unlocked to confirm this transaction.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Transaction Confirmation Required",
        description: "Please confirm the transaction in your MetaMask wallet to retire carbon credits.",
      });

      const result = await retireCarbonCredits.mutateAsync({
        certificateSupabaseId: certificate.id,
        amount: retirementAmount,
        ghgCertificateId: certificate.certificate_id,
        userEvmAddress: user.wallet_address!,
        userSigner: metaMaskSigner,
      });

      toast({
        title: "Retirement Initiated!",
        description: (
          <div className="space-y-2">
            <p>Successfully initiated retirement of {retirementAmount} CO2e credits</p>
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

      setShowRetirementForm(false);
      setRetirementAmount(0);

      // Refresh user's token balance
      if (userHederaAccountId) {
        const newBalance = await getUserTokenBalance(userHederaAccountId);
        setUserTokenBalance(newBalance);
      }
    } catch (error: any) {
      // Handle MetaMask user rejection
      if (error.code === 4001 || error.message?.includes('user rejected')) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction in MetaMask.",
          variant: "destructive",
        });
        return;
      }
    
      toast({
        title: "Retirement Failed",
        description: error.message || "Failed to retire carbon credits",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Certificate not found</h3>
        <p className="text-muted-foreground mb-4">
          The certificate you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{certificate.title}</h1>
          <p className="text-muted-foreground">Certificate ID: {certificate.certificate_id}</p>
        </div>
      </div>

      {/* Certificate Display */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardContent className="relative p-8">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600">
                Carbon Emissions Certificate
              </h2>
              <p className="text-muted-foreground">
                This certificate verifies the carbon footprint calculation
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-primary">
                    {certificate.total_emissions.toLocaleString()} kg CO₂e
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Offset Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      certificate.offset_status === 'fully_offset' ? 'default' :
                      certificate.offset_status === 'partially_offset' ? 'secondary' : 'outline'
                    }>
                      {certificate.offset_status === 'fully_offset' ? 'Fully Offset' :
                       certificate.offset_status === 'partially_offset' ? 'Partially Offset' : 'Not Offset'}
                    </Badge>
                    {(certificate.offset_amount ?? 0) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({(certificate.offset_amount ?? 0)} kg CO₂e retired)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{format(new Date(certificate.issue_date), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p className="font-medium">{format(new Date(certificate.valid_until), 'PPP')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(certificate.breakdown).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{certificate.certificate_id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(certificate.certificate_id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Hash</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {certificate.data_hash.substring(0, 16)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(certificate.data_hash)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {certificate.blockchain_tx && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Blockchain Transaction</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {certificate.blockchain_tx.substring(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(certificate.blockchain_tx!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getHashScanUrl(certificate.blockchain_tx)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              {certificate.hcs_message_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HCS Message Transaction</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {certificate.hcs_message_id.substring(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(certificate.hcs_message_id!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={getHashScanUrl(certificate.hcs_message_id)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              {certificate.ipfs_cid && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IPFS Metadata</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {certificate.ipfs_cid.substring(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(certificate.ipfs_cid!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {certificate.hedera_nft_serial && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hedera NFT Serial</label>
                  <p className="font-medium">#{certificate.hedera_nft_serial}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carbon Credit Retirement Section */}
      {user && userHederaAccountId && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Target className="h-5 w-5" />
              Offset This Certificate
            </CardTitle>
            <CardDescription>
              Retire carbon credits to offset the emissions in this certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Certificate Emissions</p>
                <p className="text-xl font-bold">{certificate.total_emissions.toLocaleString()} kg CO₂e</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Already Offset</p>
                <p className="text-xl font-bold text-green-600">
                  {(certificate.offset_amount ?? 0)} kg CO₂e
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Your CO2e Balance</p>
                <p className="text-xl font-bold text-blue-600">
                  {(userTokenBalance ?? 0) !== null ? (userTokenBalance ?? 0).toLocaleString() : '...'} credits
                </p>
              </div>
            </div>

            {!showRetirementForm ? (
              <div className="text-center">
                <Button 
                  onClick={() => setShowRetirementForm(true)}
                  disabled={!(userTokenBalance ?? 0) || (userTokenBalance ?? 0) === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Retire Carbon Credits
                </Button>
                {(!(userTokenBalance ?? 0) || (userTokenBalance ?? 0) === 0) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You need CO2e credits to offset emissions. Visit the marketplace to purchase credits.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retirement-amount">Amount to Retire (kg CO₂e)</Label>
                  <Input
                    id="retirement-amount"
                    type="number"
                    min="1"
                    max={Math.min(
                      (userTokenBalance ?? 0),
                      certificate.total_emissions - (certificate.offset_amount ?? 0)
                    )}
                    value={retirementAmount || ''}
                    onChange={(e) => setRetirementAmount(parseInt(e.target.value) || 0)}
                    placeholder="Enter amount to retire"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {Math.min(
                      (userTokenBalance ?? 0),
                      certificate.total_emissions - (certificate.offset_amount ?? 0)
                    ).toLocaleString()} kg CO₂e
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRetireCredits}
                    disabled={retireCarbonCredits.isPending || retirementAmount <= 0}
                    className="flex-1"
                  >
                    {retireCarbonCredits.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retiring Credits...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Retire {retirementAmount} Credits
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRetirementForm(false);
                      setRetirementAmount(0);
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Retirement Process:</p>
                      <ul className="text-sm space-y-1">
                        <li>1. Intent logged to smart contract</li>
                        <li>2. Tokens burned from your account</li>
                        <li>3. Retirement recorded on HCS</li>
                        <li>4. Certificate offset status updated</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Retirement History Section */}
      {certificate && retirementTransactions && retirementTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Retirement History
            </CardTitle>
            <CardDescription>
              Complete history of carbon credit retirements for this certificate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {retirementTransactions.map((transaction, index) => (
                <div key={transaction.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{transaction.amount} CO2e Credits Retired</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(transaction.created_at), 'PPP p')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Completed
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div>
                      <label className="text-muted-foreground">Amount Retired:</label>
                      <p className="font-medium text-green-600">{transaction.amount} kg CO₂e</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Status:</label>
                      <p className="font-medium text-green-600">Successfully Retired</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-medium mb-3">Blockchain Verification Links</h5>
                    <div className="grid gap-2 md:grid-cols-3">
                      {/* Smart Contract Transaction */}
                      {transaction.blockchain_tx && (
                        <Button variant="outline" size="sm" asChild className="justify-start">
                          <a href={getHashScanUrl(transaction.blockchain_tx)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Smart Contract Call
                          </a>
                        </Button>
                      )}
                    
                      {/* Token Burn Transaction */}
                      {transaction.hedera_tx_id && (
                        <Button variant="outline" size="sm" asChild className="justify-start">
                          <a href={getHashScanUrl(transaction.hedera_tx_id)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Token Burn
                          </a>
                        </Button>
                      )}
                    
                      {/* HCS Message Transaction */}
                      {transaction.retirement_hcs_message_id && (
                        <Button variant="outline" size="sm" asChild className="justify-start">
                          <a href={getHashScanUrl(transaction.retirement_hcs_message_id)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            HCS Audit Log
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid gap-3 md:grid-cols-2 text-xs text-muted-foreground">
                      <div>
                        <span>Transaction ID: </span>
                        <span className="font-mono">{transaction.id.substring(0, 8)}...</span>
                      </div>
                      <div>
                        <span>Processed: </span>
                        <span>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Retirement Summary</h4>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="text-green-700 dark:text-green-300">Total Retirements:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.length} transactions
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300">Total Amount Retired:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.reduce((sum, t) => sum + t.amount, 0)} kg CO₂e
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300">Latest Retirement:</span>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {retirementTransactions.length > 0 
                        ? format(new Date(retirementTransactions[0].created_at), 'MMM dd, yyyy')
                        : 'None'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emissions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(certificate.breakdown).map(([category, emissions]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{Number(emissions).toFixed(2)} kg CO₂e</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Activities - Only show if we have emission details */}
      {certificate.emission_details?.processed_data && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Activities</CardTitle>
            <CardDescription>
              Complete breakdown of all calculated emission activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificate.emission_details.processed_data.map((entry: any, index: number) => (
                <div key={entry.id || index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{entry.fuelType || entry.activity}</h4>
                        <Badge variant={entry.scope === 'Scope 1' ? 'default' : 'secondary'} className="text-xs">
                          {entry.scope}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {(entry.emissions || entry.amount)?.toFixed(2)} kg CO₂e
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(((entry.emissions || entry.amount) / certificate.total_emissions) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Category:</label>
                      <p className="font-medium">{entry.category}</p>
                    </div>
                    {entry.equipmentType && (
                      <div>
                        <label className="text-muted-foreground">Equipment:</label>
                        <p className="font-medium">{entry.equipmentType}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-muted-foreground">Fuel Category:</label>
                      <p className="font-medium">{entry.fuelCategory}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Amount:</label>
                      <p className="font-medium">{entry.amount} {entry.unit_type || entry.unit}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
                      <div>
                        <span>Emission Factor: </span>
                        <span className="font-mono">
                          {(entry.convertedFactor || entry.emissionFactor || 0).toFixed(6)} kg CO₂e/{entry.unit_type || entry.unit}
                        </span>
                      </div>
                      <div>
                        <span>Calculated: </span>
                        <span>{new Date(entry.timestamp || entry.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span>Entry ID: </span>
                        <span className="font-mono">{(entry.id || index).toString().substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">Calculation Summary</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {certificate.emission_details.processed_data.filter((e: any) => e.scope === 'Scope 1').length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Scope 1 Activities</div>
                  <div className="text-xs text-blue-600">
                    {(certificate.emission_details.processed_data
                      .filter((e: any) => e.scope === 'Scope 1')
                      .reduce((sum: number, e: any) => sum + (e.emissions || e.amount || 0), 0) / 1000).toFixed(2)} tonnes CO₂e
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {certificate.emission_details.processed_data.filter((e: any) => e.scope === 'Scope 2').length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Scope 2 Activities</div>
                  <div className="text-xs text-green-600">
                    {(certificate.emission_details.processed_data
                      .filter((e: any) => e.scope === 'Scope 2')
                      .reduce((sum: number, e: any) => sum + (e.emissions || e.amount || 0), 0) / 1000).toFixed(2)} tonnes CO₂e
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(certificate.emission_details.processed_data.map((e: any) => e.category)).size}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Categories Used</div>
                  <div className="text-xs text-purple-600">
                    {(certificate.total_emissions / 1000).toFixed(2)} tonnes CO₂e total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizational Details */}
      {certificate.emission_details?.raw_data?.[0] && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              GHG assessment configuration and scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="font-medium">{certificate.emission_details.raw_data[0].orgName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                  <p className="font-medium">{certificate.emission_details.raw_data[0].boundaryApproach || 'Not specified'}</p>
                  {certificate.emission_details.raw_data[0].controlSubtype && (
                    <p className="text-sm text-muted-foreground">→ {certificate.emission_details.raw_data[0].controlSubtype}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Operational Boundary</label>
                  <p className="font-medium">{certificate.emission_details.raw_data[0].operationalBoundary || 'Not specified'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emission Sources</label>
                  <p className="font-medium">{certificate.emission_details.raw_data[0].emissionSources || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Activities</label>
                  <p className="font-medium">{certificate.emission_details.processed_data?.length || 0} calculations</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assessment Date</label>
                  <p className="font-medium">
                    {certificate.emission_details.raw_data[0].timestamp 
                      ? format(new Date(certificate.emission_details.raw_data[0].timestamp), 'PPP')
                      : format(new Date(certificate.created_at), 'PPP')
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Certificate
        </Button>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Carbon Credits
          </Link>
        </Button>
        {certificate.blockchain_tx && (
          <Button variant="outline" asChild>
            <a href={getHashScanUrl(certificate.blockchain_tx)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View NFT on HashScan
            </a>
          </Button>
        )}
        {certificate.hcs_message_id && (
          <Button variant="outline" asChild>
            <a href={getHashScanUrl(certificate.hcs_message_id)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              HCS Log Transaction
            </a>
          </Button>
        )}
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}