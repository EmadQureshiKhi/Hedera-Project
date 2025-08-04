'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCertificate } from '@/hooks/use-api';
import { 
  Award, 
  Download, 
  Share2, 
  ExternalLink,
  Calendar,
  CheckCircle,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { getHashScanUrl } from '@/lib/hedera';
import { EmissionEntry } from '@/types/ghg';

interface CertificateDetailProps {
  certificateId: string;
}

export function CertificateDetail({ certificateId }: CertificateDetailProps) {
  const [copied, setCopied] = useState(false);
  const { data: certificate, isLoading } = useCertificate(certificateId);

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