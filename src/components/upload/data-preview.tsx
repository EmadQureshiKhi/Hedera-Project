'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye
} from 'lucide-react';

interface DataPreviewProps {
  data: any[];
  fileName?: string;
  onNext: () => void;
  onPrevious: () => void;
}

export function DataPreview({ data, fileName, onNext, onPrevious }: DataPreviewProps) {
  // Analyze data quality
  const totalRows = data.length;
  const columns = Object.keys(data[0] || {});
  const emptyRows = data.filter(row => 
    Object.values(row).every(value => !value || value === '')
  ).length;
  const validRows = totalRows - emptyRows;

  // Sample data for preview (first 5 rows)
  const previewData = data.slice(0, 5);

  // Data quality checks
  const hasDateColumn = columns.some(col => 
    col.toLowerCase().includes('date') || col.toLowerCase().includes('time')
  );
  const hasAmountColumn = columns.some(col => 
    col.toLowerCase().includes('amount') || col.toLowerCase().includes('quantity') || col.toLowerCase().includes('value')
  );
  const hasActivityColumn = columns.some(col => 
    col.toLowerCase().includes('activity') || col.toLowerCase().includes('type') || col.toLowerCase().includes('category')
  );

  const qualityScore = [hasDateColumn, hasAmountColumn, hasActivityColumn].filter(Boolean).length;
  const qualityPercentage = (qualityScore / 3) * 100;

  return (
    <div className="space-y-6">
      {/* File Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Preview
          </CardTitle>
          <CardDescription>
            Review your uploaded data before processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalRows}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validRows}</div>
              <div className="text-sm text-muted-foreground">Valid Rows</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{columns.length}</div>
              <div className="text-sm text-muted-foreground">Columns</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(qualityPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <FileText className="h-4 w-4" />
              <span>File: {fileName}</span>
            </div>
          )}

          {/* Data Quality Alerts */}
          {emptyRows > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {emptyRows} empty rows that will be filtered out during processing.
              </AlertDescription>
            </Alert>
          )}

          {qualityScore < 3 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some recommended columns are missing. We'll do our best to process your data, but results may vary.
                {!hasDateColumn && ' Missing: Date column.'}
                {!hasAmountColumn && ' Missing: Amount/Quantity column.'}
                {!hasActivityColumn && ' Missing: Activity/Category column.'}
              </AlertDescription>
            </Alert>
          )}

          {qualityScore === 3 && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great! Your data contains all recommended columns and looks ready for processing.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Column Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Column Analysis</CardTitle>
          <CardDescription>
            Detected columns and their data types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {columns.map((column, index) => {
              const sampleValues = data.slice(0, 10).map(row => row[column]).filter(Boolean);
              const isNumeric = sampleValues.every(val => !isNaN(Number(val)));
              const isDate = sampleValues.some(val => !isNaN(Date.parse(val)));
              
              let type = 'Text';
              let color = 'bg-gray-100 text-gray-800';
              
              if (isNumeric) {
                type = 'Number';
                color = 'bg-blue-100 text-blue-800';
              } else if (isDate) {
                type = 'Date';
                color = 'bg-green-100 text-green-800';
              }

              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{column}</span>
                    <Badge className={color}>{type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sampleValues.length > 0 ? `e.g., "${sampleValues[0]}"` : 'No data'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Sample Data
          </CardTitle>
          <CardDescription>
            First 5 rows of your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  {columns.map((column, index) => (
                    <th key={index} className="border border-border p-2 text-left font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="border border-border p-2">
                        {row[column] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalRows > 5 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing 5 of {totalRows} rows
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={validRows === 0}>
          Continue to Calculate
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}