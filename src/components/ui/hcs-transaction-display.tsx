'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Clock,
  AlertCircle,
  Hash,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { getHashScanUrl } from '@/lib/hedera';

export interface SemaTransaction {
  txId: string;
  hashScanUrl: string;
  status: 'success' | 'pending' | 'error';
  message: string;
  dataHash: string;
  timestamp: string;
  action: string;
  error?: string;
}

interface HcsTransactionDisplayProps {
  transaction: SemaTransaction | null;
  title?: string;
  description?: string;
  className?: string;
}

export function HcsTransactionDisplay({ 
  transaction, 
  title = "Hedera Verification",
  description = "Immutable audit trail on Hedera Consensus Service",
  className = ""
}: HcsTransactionDisplayProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!transaction) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No Hedera transactions yet. Perform an action to see verification.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${
      transaction.status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950' :
      transaction.status === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
      'border-yellow-200 bg-yellow-50 dark:bg-yellow-950'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {transaction.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {transaction.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            {transaction.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={
            transaction.status === 'success' ? 'default' :
            transaction.status === 'error' ? 'destructive' : 'secondary'
          }>
            {transaction.status === 'success' ? 'Verified' :
             transaction.status === 'error' ? 'Failed' : 'Pending'}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transaction.status === 'error' && transaction.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{transaction.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Transaction ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Transaction ID</label>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1">
                {transaction.txId.length > 20 ? 
                  `${transaction.txId.substring(0, 20)}...` : 
                  transaction.txId
                }
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(transaction.txId, 'txId')}
                className="h-7 w-7 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                <a href={transaction.hashScanUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          {/* Data Hash */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Data Hash</label>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1">
                {transaction.dataHash.substring(0, 16)}...
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(transaction.dataHash, 'dataHash')}
                className="h-7 w-7 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action and Timestamp */}
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">Action:</span>
            <p className="font-medium">{transaction.action}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Timestamp:</span>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(transaction.timestamp), 'PPP p')}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">{transaction.message}</p>
        </div>

        {/* Copy feedback */}
        {copied && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {copied === 'txId' ? 'Transaction ID' : 'Data Hash'} copied!
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}