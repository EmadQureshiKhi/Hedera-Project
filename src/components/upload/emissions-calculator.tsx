'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Zap, 
  Car, 
  Factory,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info,
  TrendingUp,
  Target,
  Lightbulb
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { EmissionsCalculator as EmissionsEngine, CalculationResult } from '@/lib/emissions-calculator';

interface EmissionsCalculatorProps {
  data: any[];
  onCalculate: (calculations: CalculationResult) => void;
  onPrevious: () => void;
}

export function EmissionsCalculator({ data, onCalculate, onPrevious }: EmissionsCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('Global');

  const calculateEmissions = async () => {
    setIsCalculating(true);
    setProgress(0);

    // Simulate calculation process with realistic steps
    const steps = [
      'Initializing calculation engine...',
      'Analyzing data structure and quality...',
      'Mapping activities to emission factors...',
      'Calculating individual emissions...',
      'Applying regional adjustments...',
      'Aggregating results and generating insights...',
      'Finalizing calculations...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Perform actual calculations using the enhanced calculator
    const calculator = new EmissionsEngine(selectedRegion);
    const results = calculator.calculateEmissions(data);
    
    setCalculations(results);
    setIsCalculating(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Energy':
        return Zap;
      case 'Transport':
        return Car;
      case 'Industrial':
      case 'Waste':
        return Factory;
      default:
        return Calculator;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

  useEffect(() => {
    // Auto-start calculation when component mounts
    calculateEmissions();
  }, [selectedRegion]);

  return (
    <div className="space-y-6">
      {/* Region Selection */}
      {!isCalculating && !calculations && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Settings</CardTitle>
            <CardDescription>
              Select your region for more accurate emission factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Global', 'US', 'EU', 'UK', 'Canada', 'Australia'].map((region) => (
                <Button
                  key={region}
                  variant={selectedRegion === region ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation Progress */}
      {isCalculating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Calculating Emissions
            </CardTitle>
            <CardDescription>
              Processing your data with enhanced calculation algorithms...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {progress < 15 && 'Initializing calculation engine...'}
              {progress >= 15 && progress < 30 && 'Analyzing data structure and quality...'}
              {progress >= 30 && progress < 45 && 'Mapping activities to emission factors...'}
              {progress >= 45 && progress < 60 && 'Calculating individual emissions...'}
              {progress >= 60 && progress < 75 && 'Applying regional adjustments...'}
              {progress >= 75 && progress < 90 && 'Aggregating results and generating insights...'}
              {progress >= 90 && 'Finalizing calculations...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {calculations && !isCalculating && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Emissions</p>
                    <p className="text-3xl font-bold text-primary">
                      {calculations.totalEmissions.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">kg CO₂e</p>
                  </div>
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                    <p className="text-3xl font-bold">
                      {Math.round(calculations.confidence * 100)}%
                    </p>
                    <p className={`text-sm font-medium ${getConfidenceColor(calculations.confidence)}`}>
                      {getConfidenceLabel(calculations.confidence)} Confidence
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processed</p>
                    <p className="text-3xl font-bold">
                      {calculations.summary.processedRows}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {calculations.summary.totalRows} rows
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-3xl font-bold">
                      {calculations.summary.categories}
                    </p>
                    <p className="text-sm text-muted-foreground">identified</p>
                  </div>
                  <Factory className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings and Recommendations */}
          {(calculations.warnings.length > 0 || calculations.recommendations.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {calculations.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Data Quality Issues:</p>
                      <ul className="text-sm space-y-1">
                        {calculations.warnings.slice(0, 3).map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                        {calculations.warnings.length > 3 && (
                          <li>• And {calculations.warnings.length - 3} more issues...</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {calculations.recommendations.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {calculations.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                        {calculations.recommendations.length > 2 && (
                          <li>• And {calculations.recommendations.length - 2} more suggestions...</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Charts and Analysis */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Emissions by Category</CardTitle>
                    <CardDescription>
                      Breakdown of your carbon footprint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(calculations.categoryBreakdown).map(([category, emissions], index) => ({
                              category,
                              emissions: Math.round(emissions * 100) / 100,
                              percentage: Math.round((emissions / calculations.totalEmissions) * 100),
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ category, percentage }) => `${category} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="emissions"
                          >
                            {Object.keys(calculations.categoryBreakdown).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} kg CO₂e`, 'Emissions']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                    <CardDescription>
                      Detailed emissions by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(calculations.categoryBreakdown).map(([category, emissions]) => ({
                          category,
                          emissions: Math.round(emissions * 100) / 100,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} kg CO₂e`, 'Emissions']} />
                          <Bar dataKey="emissions" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Category Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of emissions by category with insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(calculations.categoryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, emissions], index) => {
                        const Icon = getCategoryIcon(category);
                        const percentage = (emissions / calculations.totalEmissions) * 100;
                        return (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                                <Icon className="h-5 w-5" style={{ color: COLORS[index % COLORS.length] }} />
                              </div>
                              <div>
                                <p className="font-medium">{category}</p>
                                <p className="text-sm text-muted-foreground">
                                  {percentage.toFixed(1)}% of total emissions
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{emissions.toLocaleString()} kg</p>
                              <p className="text-sm text-muted-foreground">CO₂e</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Activities</CardTitle>
                  <CardDescription>
                    Highest emitting activities in your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(calculations.breakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([activity, emissions], index) => {
                        const percentage = (emissions / calculations.totalEmissions) * 100;
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium capitalize">{activity}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground min-w-[3rem]">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold">{emissions.toFixed(1)} kg</p>
                              <p className="text-xs text-muted-foreground">CO₂e</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Calculation Details</CardTitle>
                  <CardDescription>
                    Technical details about the emissions calculation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="font-medium">Data Processing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total rows:</span>
                          <span>{calculations.summary.totalRows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processed rows:</span>
                          <span>{calculations.summary.processedRows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Skipped rows:</span>
                          <span>{calculations.summary.skippedRows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Success rate:</span>
                          <span>{Math.round((calculations.summary.processedRows / calculations.summary.totalRows) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Quality Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Overall confidence:</span>
                          <span className={getConfidenceColor(calculations.confidence)}>
                            {Math.round(calculations.confidence * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Categories identified:</span>
                          <span>{calculations.summary.categories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Region:</span>
                          <span>{selectedRegion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculation method:</span>
                          <span>IPCC Guidelines</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Success Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Emissions calculation completed successfully! Your total carbon footprint is{' '}
              <strong>{calculations.totalEmissions.toLocaleString()} kg CO₂e</strong> with{' '}
              <strong>{getConfidenceLabel(calculations.confidence).toLowerCase()} confidence</strong>.
              Ready to generate your certificate?
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isCalculating}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {calculations && !isCalculating && (
          <Button onClick={() => onCalculate(calculations)}>
            Generate Certificate
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}