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
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
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
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </Button>
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}