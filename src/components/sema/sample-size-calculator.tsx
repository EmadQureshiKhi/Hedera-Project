'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSema } from './sema-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  Users, 
  Target,
  TrendingUp,
  Info
} from 'lucide-react';

export default function SampleSizeCalculator() {
  const { activeClient, sampleParameters, stakeholders, refreshData } = useSema();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [parameters, setParameters] = useState({
    confidence_level: sampleParameters?.confidence_level || 0.95,
    margin_error: sampleParameters?.margin_error || 0.05,
    population_proportion: sampleParameters?.population_proportion || 0.5
  });

  const handleSave = async () => {
    if (!activeClient) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sema_sample_parameters')
        .upsert({
          client_id: activeClient.id,
          ...parameters,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Parameters Saved",
        description: "Sample size parameters have been updated successfully.",
      });

      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save parameters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeClient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Client Selected</h3>
            <p className="text-muted-foreground">
              Please select a client to calculate sample sizes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const baseSampleSize = sampleParameters?.base_sample_size || 0;
  const zScore = sampleParameters?.z_score || 1.96;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Base Sample Size</p>
                <p className="text-2xl font-bold">{baseSampleSize}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                <p className="text-2xl font-bold">{Math.round(parameters.confidence_level * 100)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margin of Error</p>
                <p className="text-2xl font-bold">{Math.round(parameters.margin_error * 100)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Z-Score</p>
                <p className="text-2xl font-bold">{zScore}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parameters Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Size Parameters</CardTitle>
          <CardDescription>
            Configure statistical parameters for sample size calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select
                value={parameters.confidence_level.toString()}
                onValueChange={(value) => setParameters(prev => ({ 
                  ...prev, 
                  confidence_level: parseFloat(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.90">90% (Z = 1.645)</SelectItem>
                  <SelectItem value="0.95">95% (Z = 1.96)</SelectItem>
                  <SelectItem value="0.99">99% (Z = 2.576)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher confidence requires larger sample sizes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Margin of Error</Label>
              <Select
                value={parameters.margin_error.toString()}
                onValueChange={(value) => setParameters(prev => ({ 
                  ...prev, 
                  margin_error: parseFloat(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.01">1%</SelectItem>
                  <SelectItem value="0.03">3%</SelectItem>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.10">10%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lower margin of error requires larger sample sizes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Population Proportion</Label>
              <Select
                value={parameters.population_proportion.toString()}
                onValueChange={(value) => setParameters(prev => ({ 
                  ...prev, 
                  population_proportion: parseFloat(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">10%</SelectItem>
                  <SelectItem value="0.3">30%</SelectItem>
                  <SelectItem value="0.5">50% (Maximum Variability)</SelectItem>
                  <SelectItem value="0.7">70%</SelectItem>
                  <SelectItem value="0.9">90%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                50% provides maximum variability (conservative estimate)
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Parameters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholder Sample Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Group Sample Sizes</CardTitle>
          <CardDescription>
            Recommended sample sizes for each stakeholder group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No stakeholders defined. Add stakeholders first to calculate sample sizes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stakeholders.map((stakeholder) => {
                const populationSize = stakeholder.population_size;
                let adjustedSampleSize = baseSampleSize;
                
                // Apply finite population correction if population is known and small
                if (populationSize > 0 && populationSize < 10000) {
                  adjustedSampleSize = Math.ceil(
                    (baseSampleSize * populationSize) / (populationSize + baseSampleSize - 1)
                  );
                  adjustedSampleSize = Math.min(adjustedSampleSize, populationSize);
                }

                const samplingRate = populationSize > 0 ? 
                  ((adjustedSampleSize / populationSize) * 100).toFixed(1) : 'N/A';

                return (
                  <div key={stakeholder.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{stakeholder.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stakeholder.stakeholder_type} • Population: {populationSize.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{adjustedSampleSize}</p>
                      <p className="text-sm text-muted-foreground">
                        {samplingRate !== 'N/A' ? `${samplingRate}% sampling rate` : 'Unknown population'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formula Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Sample Size Calculation Formula
          </CardTitle>
          <CardDescription>
            Understanding the statistical calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Infinite Population Formula (Cochran's Formula)</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                n₀ = (Z² × p × (1-p)) / E²
              </div>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <p>• n₀ = Base sample size</p>
                <p>• Z = Z-score (confidence level)</p>
                <p>• p = Population proportion ({parameters.population_proportion})</p>
                <p>• E = Margin of error ({parameters.margin_error})</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Finite Population Correction</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                n = (n₀ × N) / (N + n₀ - 1)
              </div>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <p>• n = Adjusted sample size</p>
                <p>• N = Population size</p>
                <p>• Applied when population is known and relatively small</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}