'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateCertificate } from '@/hooks/use-api';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import CryptoJS from 'crypto-js';
import { 
  submitHCSMessage, 
  mintNFT, 
  logCertificateToHCS,
  uploadToIPFS,
  getHashScanUrl,
  isHederaConfigured 
} from '@/lib/hedera';
import { useAuth } from '@/hooks/use-auth';

interface CertificatePreviewProps {
  calculations: any;
  emissionDataId?: string;
  onGenerate: (certificate: any) => void;
  onPrevious: () => void;
}

const HEDERA_CERTIFICATE_NFT_TOKEN_ID = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID;
const HEDERA_HCS_TOPIC_ID = process.env.NEXT_PUBLIC_HEDERA_HCS_TOPIC_ID;

export function CertificatePreview({ calculations, emissionDataId, onGenerate, onPrevious }: CertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [hederaTxId, setHederaTxId] = useState<string | null>(null);
  const [hcsTxId, setHcsTxId] = useState<string | null>(null);
  const [hederaError, setHederaError] = useState<string | null>(null);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Check if we have a valid emission data ID
  const hasValidEmissionDataId = emissionDataId && emissionDataId !== 'temp-emission-id' && emissionDataId.length > 10;
  
  const createCertificate = useCreateCertificate(user?.id);

  const generateCertificate = async () => {
    setIsGenerating(true);
    setHederaError(null);

    try {
      // 1. Generate IPFS CID for certificate metadata
      const certificateMetadata = {
        title: `Emissions Certificate - ${format(new Date(), 'MMM yyyy')}`,
        totalEmissions: calculations.totalEmissions,
        breakdown: calculations.breakdown || calculations.categoryBreakdown,
        summary: calculations.summary,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const ipfsCid = await uploadToIPFS(certificateMetadata);
      setIpfsCid(ipfsCid);

      // 2. Generate certificate data
      const certificateData = {
        certificate_id: `GHG-${Date.now()}`,
        title: certificateMetadata.title,
        total_emissions: calculations.totalEmissions,
        breakdown: calculations.breakdown || calculations.categoryBreakdown,
        data_hash: CryptoJS.SHA256(JSON.stringify(calculations)).toString(),
        blockchain_tx: null, // Will be updated with Hedera transaction ID
        ipfs_cid: ipfsCid,
      };
        let hcsLogTxId: string | null = null;

      // 3. Save certificate to Supabase
      const result = await createCertificate.mutateAsync({
        emissionDataId: emissionDataId || 'temp-emission-id',
        certificateData,
      });

      // 4. Hedera integrations (if configured)
      if (isHederaConfigured()) {
        try {
          // 4a. Mint NFT on Hedera (if token ID is configured)
          if (HEDERA_CERTIFICATE_NFT_TOKEN_ID) {
            const nftTxId = await mintNFT(HEDERA_CERTIFICATE_NFT_TOKEN_ID, ipfsCid);
            setHederaTxId(nftTxId);
            
            // Update certificate with Hedera transaction ID
            certificateData.blockchain_tx = nftTxId;
            console.log('✅ NFT minted on Hedera:', nftTxId);
          }

          // 4b. Log to HCS (if topic ID is configured)
          if (HEDERA_HCS_TOPIC_ID) {
            const hcsLogTxId = await logCertificateToHCS(HEDERA_HCS_TOPIC_ID, {
              certificateId: result.certificate_id,
              dataHash: result.data_hash,
              totalEmissions: result.total_emissions,
              breakdown: result.breakdown,
              timestamp: new Date().toISOString()
            }); // Assign to hcsLogTxId
            setHcsTxId(hcsLogTxId);
            console.log('✅ Certificate logged to HCS:', hcsLogTxId);
          }
        } catch (hederaErr: any) {
          console.error('Hedera integration error:', hederaErr);
          setHederaError(`Hedera integration failed: ${hederaErr.message || hederaErr}`);
          // Continue with certificate generation even if Hedera fails
        }
      } else {
        setHederaError('Hedera not configured. Certificate saved locally only.');
      }

      setCertificate(result);
      onGenerate(result);
    } catch (error) {
      console.error('Failed to create certificate:', error); // Log the full error object
      // Ensure the error message is properly extracted
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      setHederaError(`Failed to create certificate: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    // Mock PDF download
    const element = document.createElement('a');
    const file = new Blob(['Certificate PDF content would be here'], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `GHG-Certificate-${certificate?.certificate_id}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-green-600" />
            GHG Emissions Certificate
          </CardTitle>
          <CardDescription>
            Blockchain-verified carbon footprint certificate
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Certificate Content */}
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
                    {calculations.totalEmissions.toLocaleString()} kg CO₂e
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{format(new Date(), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valid Until</label>
                  <p className="font-medium">{format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'PPP')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(calculations.breakdown || calculations.categoryBreakdown || {}).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Points</label>
                  <p className="font-medium">{calculations.summary?.processedRows || 0} entries</p>
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

            {certificate && (
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
                        onClick={() => copyToClipboard(certificate.blockchain_tx)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {hederaTxId && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={getHashScanUrl(hederaTxId)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {ipfsCid && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">IPFS Metadata</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {ipfsCid.substring(0, 16)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(ipfsCid)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {hcsTxId && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">HCS Log Transaction</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {hcsTxId.substring(0, 16)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(hcsTxId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={getHashScanUrl(hcsTxId)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hedera Integration Status */}
          {hederaError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{hederaError}</AlertDescription>
            </Alert>
          )}

          {(hederaTxId || hcsTxId) && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Certificate successfully recorded on Hedera Hashgraph! 
                {hederaTxId && ' NFT minted.'}
                {hcsTxId && ' Data logged to consensus service.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Button */}
          {!certificate && (
            <div className="text-center">
              {!hasValidEmissionDataId && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    Cannot generate certificate: Emission data ID is missing. Please go back and ensure your emission data is saved properly.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                size="lg"
                onClick={generateCertificate}
                disabled={isGenerating || createCertificate.isPending || !hasValidEmissionDataId}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating || createCertificate.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Award className="h-5 w-5 mr-2" />
                    Generate Certificate
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                {hasValidEmissionDataId 
                  ? 'This will create a blockchain-verified certificate on Hedera Hashgraph'
                  : 'Please ensure emission data is saved before generating certificate'
                }
              </p>
            </div>
          )}

          {/* Success Actions */}
          {certificate && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Certificate generated successfully! Your emissions data has been verified and recorded.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={downloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
                {hederaTxId && (
                  <Button variant="outline" asChild>
                    <a href={getHashScanUrl(hederaTxId)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on HashScan
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emissions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Breakdown</CardTitle>
          <CardDescription>
            Detailed breakdown included in your certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(calculations.breakdown || calculations.categoryBreakdown || {}).map(([category, emissions]: [string, any]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{category}</span>
                <span className="font-bold">{emissions.toFixed(2)} kg CO₂e</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {certificate && (
          <Button asChild>
            <a href="/certificates">
              View All Certificates
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