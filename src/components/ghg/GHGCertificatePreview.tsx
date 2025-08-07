'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateCertificate, useSaveEmissionData } from '@/hooks/use-api';
import { supabase } from '@/lib/supabase';
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
import { QuestionnaireData, EmissionEntry } from '@/types/ghg';

interface GHGCertificatePreviewProps {
  questionnaire: QuestionnaireData;
  entries: EmissionEntry[];
  totalEmissions: number;
  calculations: {
    totalEmissions: number;
    categoryBreakdown: Record<string, number>;
    breakdown: Record<string, number>;
    summary: {
      processedRows: number;
      totalRows: number;
      categories: number;
    };
    processedData?: any[];
  };
  onGenerate: (certificate: any) => void;
  onPrevious: () => void;
}

const HEDERA_CERTIFICATE_NFT_TOKEN_ID = process.env.NEXT_PUBLIC_HEDERA_NFT_TOKEN_ID;
const HEDERA_HCS_TOPIC_ID = process.env.NEXT_PUBLIC_HEDERA_HCS_TOPIC_ID;

export function GHGCertificatePreview({
  questionnaire,
  entries,
  totalEmissions,
  calculations,
  onGenerate,
  onPrevious
}: GHGCertificatePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [hederaTxId, setHederaTxId] = useState<string | null>(null);
  const [hcsTxId, setHcsTxId] = useState<string | null>(null);
  const [hederaError, setHederaError] = useState<string | null>(null);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if user has email linked
  const hasEmailLinked = user?.email && user.email.trim().length > 0;

  const createCertificate = useCreateCertificate(user?.id);
  const saveEmissionData = useSaveEmissionData();

  const generateCertificate = async () => {
    setIsGenerating(true);
    setHederaError(null);

    try {
      // 1. First save the GHG calculator session data to emission_data table
      const emissionDataResult = await saveEmissionData.mutateAsync({
        userId: user!.id,
        data: {
          file_name: `GHG_Calculator_${questionnaire.orgName || 'Session'}_${format(new Date(), 'yyyy-MM-dd')}.json`,
          total_emissions: totalEmissions,
          breakdown: calculations.categoryBreakdown,
          raw_data: [questionnaire],
          processed_data: entries,
          status: 'completed'
        }
      });

      // 2. Generate certificate data structure
      const certificateData: {
        certificate_id: string;
        title: string;
        total_emissions: number;
        breakdown: Record<string, number>;
        blockchain_tx?: string;
        hcs_message_id?: string;
        ipfs_cid?: string;
        hedera_nft_serial?: string;
        data_hash?: string;
      } = {
        certificate_id: `GHG-CALC-${Date.now()}`,
        title: `${questionnaire.orgName || 'Organization'} - GHG Calculator Certificate - ${format(new Date(), 'MMM yyyy')}`,
        total_emissions: totalEmissions,
        breakdown: calculations.categoryBreakdown,
        blockchain_tx: undefined,
        hcs_message_id: undefined,
        ipfs_cid: undefined,
        hedera_nft_serial: undefined,
        data_hash: undefined,
      };

      // Generate comprehensive data hash from GHG calculator session
      const hashData = {
        questionnaire: {
          orgName: questionnaire.orgName,
          boundaryApproach: questionnaire.boundaryApproach,
          controlSubtype: questionnaire.controlSubtype,
          operationalBoundary: questionnaire.operationalBoundary,
          emissionSources: questionnaire.emissionSources
        },
        totalEmissions: totalEmissions,
        categoryBreakdown: calculations.categoryBreakdown,
        breakdown: calculations.breakdown,
        summary: calculations.summary,
        entriesCount: entries.length,
        entries: entries.map(entry => ({
          scope: entry.scope,
          category: entry.category,
          fuelType: entry.fuelType,
          amount: entry.amount,
          emissions: entry.emissions
        })),
        timestamp: new Date().toISOString()
      };

      certificateData.data_hash = CryptoJS.SHA256(JSON.stringify(hashData)).toString();

      // 3. Generate IPFS CID for certificate metadata
      const certificateMetadata = {
        title: certificateData.title,
        organization: questionnaire.orgName,
        assessmentScope: questionnaire.emissionSources,
        boundaryApproach: questionnaire.boundaryApproach,
        operationalBoundary: questionnaire.operationalBoundary,
        totalEmissions: totalEmissions,
        categoryBreakdown: calculations.categoryBreakdown,
        entriesCount: entries.length,
        calculationMethod: 'GHG Calculator Tool',
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };

      const ipfsCid = await uploadToIPFS(certificateMetadata);
      certificateData.ipfs_cid = ipfsCid;
      setIpfsCid(ipfsCid);

      // 4. Hedera integrations (if configured)
      if (isHederaConfigured()) {
        try {
          if (HEDERA_CERTIFICATE_NFT_TOKEN_ID) {
            const nftTxId = await mintNFT(HEDERA_CERTIFICATE_NFT_TOKEN_ID, ipfsCid);
            certificateData.blockchain_tx = nftTxId;
            setHederaTxId(nftTxId);
          }
          if (HEDERA_HCS_TOPIC_ID) {
            const hcsLogTxId = await logCertificateToHCS(HEDERA_HCS_TOPIC_ID, {
              certificateId: certificateData.certificate_id,
              dataHash: certificateData.data_hash,
              totalEmissions: certificateData.total_emissions,
              breakdown: certificateData.breakdown,
              timestamp: new Date().toISOString()
            });
            certificateData.hcs_message_id = hcsLogTxId;
            setHcsTxId(hcsLogTxId);
          }
        } catch (hederaErr: any) {
          setHederaError(`Hedera integration failed: ${hederaErr.message || hederaErr}`);
        }
      } else {
        setHederaError('Hedera not configured. Certificate saved locally only.');
      }

      // 5. Save certificate to Supabase with all Hedera transaction IDs
      const result = await createCertificate.mutateAsync({
        emissionDataId: emissionDataResult.id,
        certificateData,
      });

      setCertificate(result);
      onGenerate(result);
    } catch (error) {
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

  const downloadCertificatePDF = () => {
    const content = `
GHG CALCULATOR CERTIFICATE
==========================

Organization: ${questionnaire.orgName}
Certificate ID: ${certificate?.certificate_id}
Assessment Type: GHG Calculator Tool

ORGANIZATIONAL DETAILS:
Boundary Approach: ${questionnaire.boundaryApproach}
${questionnaire.controlSubtype ? `Control Type: ${questionnaire.controlSubtype}` : ''}
Operational Boundary: ${questionnaire.operationalBoundary}
Emission Sources: ${questionnaire.emissionSources}

EMISSIONS SUMMARY:
Total Emissions: ${totalEmissions.toLocaleString()} kg CO₂e
Total Activities: ${entries.length}
Assessment Date: ${format(new Date(), 'PPP')}

EMISSIONS BREAKDOWN BY CATEGORY:
${Object.entries(calculations.categoryBreakdown).map(([category, emissions]) =>
  `${category}: ${Number(emissions).toFixed(2)} kg CO₂e`
).join('\n')}

DETAILED CALCULATIONS:
${entries.map((entry, index) =>
  `${index + 1}. ${entry.scope} - ${entry.fuelType}: ${entry.amount} ${entry.unit_type} = ${entry.emissions.toFixed(2)} kg CO₂e`
).join('\n')}

BLOCKCHAIN VERIFICATION:
${certificate?.blockchain_tx ? `NFT Transaction: ${certificate.blockchain_tx}` : 'No blockchain transaction'}
${certificate?.hcs_message_id ? `HCS Message: ${certificate.hcs_message_id}` : 'No HCS message'}
${certificate?.data_hash ? `Data Hash: ${certificate.data_hash}` : 'No data hash'}
${certificate?.ipfs_cid ? `IPFS CID: ${certificate.ipfs_cid}` : 'No IPFS metadata'}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GHG_Certificate_${certificate?.certificate_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-green-600" />
            GHG Calculator Certificate
          </CardTitle>
          <CardDescription>
            Blockchain-verified carbon footprint certificate from GHG Calculator
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-lg">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-600">
                GHG Calculator Certificate
              </h2>
              <p className="text-muted-foreground">
                This certificate verifies the carbon footprint calculation from GHG Calculator
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organization</label>
                  <p className="text-xl font-bold text-primary">
                    {questionnaire.orgName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Emissions</label>
                  <p className="text-2xl font-bold text-primary">
                    {totalEmissions.toLocaleString()} kg CO₂e
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
                  <label className="text-sm font-medium text-muted-foreground">Assessment Scope</label>
                  <p className="font-medium">{questionnaire.emissionSources}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                  <p className="font-medium">{questionnaire.boundaryApproach}</p>
                  {questionnaire.controlSubtype && (
                    <p className="text-sm text-muted-foreground">→ {questionnaire.controlSubtype}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(calculations.categoryBreakdown).map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Activities Calculated</label>
                  <p className="font-medium">{entries.length} entries</p>
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
                        onClick={() => copyToClipboard(certificate.blockchain_tx!)}
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
              {!hasEmailLinked && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Email Authentication Required</p>
                      <p>
                        Certificates can only be generated for users with a linked email address. Please link an email to your account to continue.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <Button
                size="lg"
                onClick={generateCertificate}
                disabled={isGenerating || createCertificate.isPending || !hasEmailLinked}
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
                {!hasEmailLinked
                  ? 'Please link an email to generate certificates'
                  : 'This will create a blockchain-verified certificate on Hedera Hashgraph'
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
                  GHG Calculator certificate generated successfully! Your emissions data has been verified and recorded.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-4 justify-center">
                <Button onClick={downloadCertificatePDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
                {hederaTxId && (
                  <Button variant="outline" asChild>
                    <a href={getHashScanUrl(hederaTxId)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View NFT on HashScan
                    </a>
                  </Button>
                )}
                {hcsTxId && (
                  <Button variant="outline" asChild>
                    <a href={getHashScanUrl(hcsTxId)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      HCS Log Transaction
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Activities Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Activities</CardTitle>
          <CardDescription>
            Complete breakdown of all calculated emission activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{entry.fuelType}</h4>
                      <Badge variant={entry.scope === 'Scope 1' ? 'default' : 'secondary'} className="text-xs">
                        {entry.scope}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{entry.emissions.toFixed(2)} kg CO₂e</p>
                    <p className="text-sm text-muted-foreground">
                      {((entry.emissions / totalEmissions) * 100).toFixed(1)}% of total
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
                    <p className="font-medium">{entry.amount} {entry.unit_type}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
                    <div>
                      <span>Emission Factor: </span>
                      <span className="font-mono">{entry.convertedFactor.toFixed(6)} kg CO₂e/{entry.unit_type}</span>
                    </div>
                    <div>
                      <span>Calculated: </span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>Entry ID: </span>
                      <span className="font-mono">{entry.id.substring(0, 8)}...</span>
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
                  {entries.filter(e => e.scope === 'Scope 1').length}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Scope 1 Activities</div>
                <div className="text-xs text-blue-600">
                  {(entries.filter(e => e.scope === 'Scope 1').reduce((sum, e) => sum + e.emissions, 0) / 1000).toFixed(2)} tonnes CO₂e
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {entries.filter(e => e.scope === 'Scope 2').length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Scope 2 Activities</div>
                <div className="text-xs text-green-600">
                  {(entries.filter(e => e.scope === 'Scope 2').reduce((sum, e) => sum + e.emissions, 0) / 1000).toFixed(2)} tonnes CO₂e
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(calculations.categoryBreakdown).length}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Categories Used</div>
                <div className="text-xs text-purple-600">
                  {(totalEmissions / 1000).toFixed(2)} tonnes CO₂e total
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Organizational Details */}
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
                <p className="font-medium">{questionnaire.orgName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Boundary Approach</label>
                <p className="font-medium">{questionnaire.boundaryApproach}</p>
                {questionnaire.controlSubtype && (
                  <p className="text-sm text-muted-foreground">→ {questionnaire.controlSubtype}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Operational Boundary</label>
                <p className="font-medium">{questionnaire.operationalBoundary}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Emission Sources</label>
                <p className="font-medium">{questionnaire.emissionSources}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Activities</label>
                <p className="font-medium">{entries.length} calculations</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assessment Date</label>
                <p className="font-medium">{format(new Date(questionnaire.timestamp), 'PPP')}</p>
              </div>
            </div>
          </div>
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
            {Object.entries(calculations.categoryBreakdown).map(([category, emissions]: [string, any]) => (
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
          Back to Results
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