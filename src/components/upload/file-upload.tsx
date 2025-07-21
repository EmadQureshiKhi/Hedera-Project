'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Info, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface FileUploadProps {
  onUpload: (file: File, data: any[]) => void;
}

interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  dataQuality: number; // 0-1 score
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<FileValidationResult | null>(null);

  const validateData = (data: any[]): FileValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let qualityScore = 1.0;

    // Check if data exists
    if (!data || data.length === 0) {
      errors.push('File contains no data');
      return { isValid: false, errors, warnings, suggestions, dataQuality: 0 };
    }

    // Check for headers
    const firstRow = data[0];
    if (!firstRow || Object.keys(firstRow).length === 0) {
      errors.push('No column headers found');
      qualityScore -= 0.3;
    }

    // Check for minimum required columns
    const columns = Object.keys(firstRow).map(k => k.toLowerCase());
    const hasActivityColumn = columns.some(col => 
      ['activity', 'type', 'description', 'item', 'service'].some(term => col.includes(term))
    );
    const hasAmountColumn = columns.some(col => 
      ['amount', 'quantity', 'value', 'volume', 'distance', 'consumption'].some(term => col.includes(term))
    );
    const hasDateColumn = columns.some(col => 
      ['date', 'time', 'timestamp'].some(term => col.includes(term))
    );

    if (!hasActivityColumn) {
      warnings.push('No activity/description column detected. Results may be less accurate.');
      suggestions.push('Include a column describing the activity (e.g., "Activity", "Type", "Description")');
      qualityScore -= 0.2;
    }

    if (!hasAmountColumn) {
      warnings.push('No amount/quantity column detected. Using default values.');
      suggestions.push('Include a column with quantities (e.g., "Amount", "Quantity", "Volume")');
      qualityScore -= 0.2;
    }

    if (!hasDateColumn) {
      warnings.push('No date column detected. Temporal analysis will be limited.');
      suggestions.push('Include a date column for better tracking and analysis');
      qualityScore -= 0.1;
    }

    // Check data quality
    const validRows = data.filter(row => 
      Object.values(row).some(value => value && value !== '')
    );
    const emptyRowPercentage = (data.length - validRows.length) / data.length;

    if (emptyRowPercentage > 0.1) {
      warnings.push(`${Math.round(emptyRowPercentage * 100)}% of rows are empty or incomplete`);
      qualityScore -= emptyRowPercentage * 0.3;
    }

    // Check for numeric data
    const hasNumericData = validRows.some(row =>
      Object.values(row).some(value => !isNaN(Number(value)) && Number(value) > 0)
    );

    if (!hasNumericData) {
      warnings.push('No numeric data detected. Calculations may use default values.');
      qualityScore -= 0.2;
    }

    // Suggestions for improvement
    if (validRows.length < 10) {
      suggestions.push('More data points will improve calculation accuracy');
    }

    if (columns.length < 3) {
      suggestions.push('Additional columns (date, location, category) will provide better insights');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      dataQuality: Math.max(0, qualityScore)
    };
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setValidation(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];

      setProgress(10);

      if (fileExtension === 'csv') {
        // Process CSV
        const text = await file.text();
        setProgress(30);
        
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value) => value.trim(),
        });
        
        if (result.errors.length > 0) {
          const criticalErrors = result.errors.filter(err => err.type === 'Delimiter');
          if (criticalErrors.length > 0) {
            throw new Error(`CSV parsing error: ${criticalErrors[0].message}`);
          }
        }
        
        data = result.data;
        setProgress(70);
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Process Excel
        const buffer = await file.arrayBuffer();
        setProgress(30);
        
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        
        if (!sheetName) {
          throw new Error('No worksheets found in Excel file');
        }
        
        const worksheet = workbook.Sheets[sheetName];
        setProgress(50);
        
        data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });
        
        // Convert to object format with headers
        if (data.length > 0) {
          const headers = data[0] as string[];
          data = data.slice(1).map((row: any[]) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              if (header && header.trim()) {
                obj[header.trim()] = row[index] || '';
              }
            });
            return obj;
          }).filter(row => Object.values(row).some(value => value && value !== ''));
        }
        setProgress(70);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel files (.csv, .xlsx, .xls)');
      }

      // Validate data
      setProgress(80);
      const validationResult = validateData(data);
      setValidation(validationResult);

      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join('; '));
      }

      setProgress(100);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onUpload(file, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const downloadSampleFile = () => {
    const sampleData = [
      ['Date', 'Activity', 'Amount', 'Unit', 'Category', 'Location'],
      ['2024-01-15', 'Electricity consumption', '1250', 'kWh', 'Energy', 'Office Building A'],
      ['2024-01-16', 'Natural gas heating', '850', 'm³', 'Energy', 'Office Building A'],
      ['2024-01-17', 'Business travel by car', '450', 'km', 'Transport', 'Client visit'],
      ['2024-01-18', 'Flight to conference', '1200', 'km', 'Transport', 'Business trip'],
      ['2024-01-19', 'Waste disposal', '25', 'kg', 'Waste', 'Office Building A'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Data');
    XLSX.writeFile(wb, 'sample-emissions-data.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Emissions Data
          </CardTitle>
          <CardDescription>
            Upload your emissions data in CSV or Excel format. Our enhanced engine will process and validate the data automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              {isDragActive ? (
                <p className="text-lg font-medium">Drop your file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drag & drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports CSV, Excel (.xlsx, .xls) files up to 10MB
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={downloadSampleFile}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing file...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {progress < 30 && 'Reading file...'}
                {progress >= 30 && progress < 70 && 'Parsing data...'}
                {progress >= 70 && progress < 90 && 'Validating structure...'}
                {progress >= 90 && 'Finalizing...'}
              </p>
            </div>
          )}

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validation && !error && (
            <div className="mt-4 space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  File processed successfully! Data quality score: {' '}
                  <Badge variant={validation.dataQuality >= 0.8 ? 'default' : validation.dataQuality >= 0.6 ? 'secondary' : 'destructive'}>
                    {Math.round(validation.dataQuality * 100)}%
                  </Badge>
                </AlertDescription>
              </Alert>

              {validation.warnings.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Data Quality Notes:</p>
                      <ul className="text-sm space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {validation.suggestions.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Suggestions for Better Results:</p>
                      <ul className="text-sm space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {acceptedFiles.length > 0 && !isProcessing && !error && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                File "{acceptedFiles[0].name}" uploaded successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Data Format Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recommended Data Format
          </CardTitle>
          <CardDescription>
            Follow this format for the most accurate emissions calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-left">Column</th>
                    <th className="border border-border p-2 text-left">Description</th>
                    <th className="border border-border p-2 text-left">Example</th>
                    <th className="border border-border p-2 text-left">Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-2 font-medium">Date</td>
                    <td className="border border-border p-2">When the activity occurred</td>
                    <td className="border border-border p-2">2024-01-15</td>
                    <td className="border border-border p-2">
                      <Badge variant="secondary">Optional</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-medium">Activity</td>
                    <td className="border border-border p-2">Description of the emission source</td>
                    <td className="border border-border p-2">Electricity consumption</td>
                    <td className="border border-border p-2">
                      <Badge variant="default">Recommended</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-medium">Amount</td>
                    <td className="border border-border p-2">Quantity or volume</td>
                    <td className="border border-border p-2">1250</td>
                    <td className="border border-border p-2">
                      <Badge variant="default">Recommended</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-medium">Unit</td>
                    <td className="border border-border p-2">Unit of measurement</td>
                    <td className="border border-border p-2">kWh, km, kg, m³</td>
                    <td className="border border-border p-2">
                      <Badge variant="secondary">Optional</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-medium">Category</td>
                    <td className="border border-border p-2">Emission category</td>
                    <td className="border border-border p-2">Energy, Transport, Waste</td>
                    <td className="border border-border p-2">
                      <Badge variant="secondary">Optional</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-border p-2 font-medium">Location</td>
                    <td className="border border-border p-2">Where the activity occurred</td>
                    <td className="border border-border p-2">Office Building A</td>
                    <td className="border border-border p-2">
                      <Badge variant="secondary">Optional</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Supported Activities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Electricity consumption</li>
                  <li>• Natural gas, heating oil, coal</li>
                  <li>• Vehicle travel (car, bus, train)</li>
                  <li>• Air travel (domestic, international)</li>
                  <li>• Waste disposal and recycling</li>
                  <li>• Industrial processes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Tips for Best Results</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use clear, descriptive activity names</li>
                  <li>• Include units when possible</li>
                  <li>• Separate different activities into rows</li>
                  <li>• Use consistent date formats</li>
                  <li>• Include location for regional factors</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}