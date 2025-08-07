'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSema } from './sema-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { HcsTransactionDisplay } from '@/components/ui/hcs-transaction-display';
import { 
  Calculator, 
  Users, 
  Target,
  TrendingUp,
  Info,
  BarChart3
} from 'lucide-react';

// Custom Button Group Component for Confidence Level
function ConfidenceLevelSelector({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  label: string;
}) {
  const options = [
    { value: 0.90, label: '90%' },
    { value: 0.95, label: '95%' },
    { value: 0.99, label: '99%' }
  ];

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onChange(option.value)}
            className={`px-6 py-3 text-sm font-medium rounded-xl transition-colors ${
              value === option.value 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Custom Slider Component for other parameters
function CustomSlider({ 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  options, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  min: number; 
  max: number; 
  step: number; 
  options: { value: number; label: string }[]; 
  label: string;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between mt-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onChange(option.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                value === option.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SampleSizeCalculator() {
  const { 
    activeClient, 
    sampleParameters, 
    stakeholders, 
    refreshData, 
    latestSampleParamsHcsTx,
    updateSampleParameters
  } = useSema();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [parameters, setParameters] = useState({
    confidence_level: sampleParameters?.confidence_level || 0.95,
    margin_error: sampleParameters?.margin_error || 0.05,
    population_proportion: sampleParameters?.population_proportion || 0.5
  });

  const handleSave = async () => {
    if (!activeClient) return;

    // Don't allow saving for demo client
    if (activeClient.status === 'demo') {
      toast({
        title: "Demo Mode",
        description: "Sample parameters cannot be saved in demo mode. Create a new client to save parameters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateSampleParameters(parameters);

      toast({
        title: "Parameters Saved",
        description: "Sample size parameters have been updated successfully.",
      });
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
      {/* Header Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6 pb-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200">Sample Size Calculator</h2>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Determine statistically significant sample sizes for {activeClient.name} stakeholder engagement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters and Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Parameters Section */}
        <Card className="bg-white dark:bg-gray-900 border-2">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <ConfidenceLevelSelector
                label="Confidence Level"
                value={parameters.confidence_level}
                onChange={(value) => setParameters(prev => ({ ...prev, confidence_level: value }))}
              />
              
              <CustomSlider
                label="Margin of Error"
                value={parameters.margin_error}
                onChange={(value) => setParameters(prev => ({ ...prev, margin_error: value }))}
                min={0.01}
                max={0.10}
                step={0.01}
                options={[
                  { value: 0.01, label: '1%' },
                  { value: 0.03, label: '3%' },
                  { value: 0.05, label: '5%' },
                  { value: 0.10, label: '10%' },
                ]}
              />
              
              <CustomSlider
                label="Population Proportion"
                value={parameters.population_proportion}
                onChange={(value) => setParameters(prev => ({ ...prev, population_proportion: value }))}
                min={0.1}
                max={0.9}
                step={0.1}
                options={[
                  { value: 0.1, label: '0.1' },
                  { value: 0.3, label: '0.3' },
                  { value: 0.5, label: '0.5' },
                  { value: 0.7, label: '0.7' },
                  { value: 0.9, label: '0.9' }
                ]}
              />
              
              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                {isLoading ? 'Saving...' : activeClient?.status === 'demo' ? 'Demo Mode - Cannot Save' : 'Save Parameters'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Base Parameters Results */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-100 dark:bg-green-900 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <TrendingUp className="h-5 w-5" />
              Base Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-green-600 mb-2">{baseSampleSize}</div>
                <p className="text-green-700 dark:text-green-300 font-medium">Base Sample Size (Infinite Population)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{zScore}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Z-Score</p>
                  <p className="text-xs text-green-600">{Math.round(parameters.confidence_level * 100)}% Confidence</p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(parameters.margin_error * 100)}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Margin of Error</p>
                  <p className="text-xs text-green-600">±{Math.round(parameters.margin_error * 100)}% precision</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Base Formula</h4>
                <code className="text-sm text-yellow-700 dark:text-yellow-300">
                  n = (Z² × p × (1-p)) / E²
                </code>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  This base calculation is used for all stakeholders, with finite population correction applied individually when selected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Size by Stakeholder Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Sample Size by Stakeholder Category
          </CardTitle>
          <CardDescription>
            Configure population sizes and view calculated sample sizes for each stakeholder group
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stakeholders.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Stakeholders Defined</h3>
              <p className="text-muted-foreground mb-4">
                Add stakeholders first to calculate sample sizes for each group.
              </p>
              <Button asChild>
                <a href="#" onClick={() => window.history.back()}>
                  Add Stakeholders
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Configure Population Sizes */}
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Configure Population Sizes</h4>
                <div className="grid gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Auto Formula Selection</span>
                  </div>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-5">
                    <li>• <strong>Population ≤100:</strong> Uses finite population formula (appropriate for small groups)</li>
                    <li>• <strong>Population &gt;100:</strong> Uses infinite population formula (standard for large populations)</li>
                    <li>• <strong>No population specified:</strong> Uses infinite population formula (conservative estimate)</li>
                  </ul>
                </div>
              </div>

              {/* Stakeholder Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left p-4 font-semibold">Stakeholder</th>
                      <th className="text-left p-4 font-semibold">Category</th>
                      <th className="text-center p-4 font-semibold">Population Size</th>
                      <th className="text-center p-4 font-semibold">Formula Type</th>
                      <th className="text-center p-4 font-semibold">Priority</th>
                      <th className="text-center p-4 font-semibold">Sample Size</th>
                      <th className="text-center p-4 font-semibold">Sampling Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakeholders.map((stakeholder) => {
                      const populationSize = stakeholder.population_size;
                      let adjustedSampleSize = baseSampleSize;
                      let formulaType = 'infinite';
                      
                      // Apply finite population correction if population is known and small
                      if (populationSize > 0 && populationSize <= 100) {
                        adjustedSampleSize = Math.ceil(
                          (baseSampleSize * populationSize) / (populationSize + baseSampleSize - 1)
                        );
                        adjustedSampleSize = Math.min(adjustedSampleSize, populationSize);
                        formulaType = 'finite';
                      }

                      const samplingRate = populationSize > 0 ? 
                        ((adjustedSampleSize / populationSize) * 100).toFixed(1) : 'N/A';

                      return (
                        <tr key={stakeholder.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{stakeholder.name}</p>
                              <p className="text-sm text-gray-500">{stakeholder.stakeholder_type}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={stakeholder.category === 'Internal' ? 'default' : 'secondary'}>
                              {stakeholder.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <span className={populationSize === 0 ? 'text-gray-400 italic' : 'font-medium'}>
                              {populationSize === 0 ? 'Not specified' : populationSize.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={formulaType === 'finite' ? 'default' : 'outline'} className="text-xs">
                              {formulaType}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={stakeholder.is_priority ? 'default' : 'outline'} 
                                   className={stakeholder.is_priority ? 'bg-green-100 text-green-800' : ''}>
                              {stakeholder.is_priority ? 'High' : 'Standard'}
                            </Badge>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-2xl font-bold text-blue-600">{adjustedSampleSize}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={samplingRate !== 'N/A' ? 'font-medium' : 'text-gray-400 italic'}>
                              {samplingRate !== 'N/A' ? `${samplingRate}%` : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-green-50 dark:bg-green-950 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4">Summary</h4>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {(() => {
                        const totalPopulation = stakeholders.reduce((sum, s) => sum + s.population_size, 0);
                        const hasUnknownPopulation = stakeholders.some(s => s.population_size === 0);
                        
                        if (hasUnknownPopulation) {
                          return '∞';
                        } else {
                          return totalPopulation.toLocaleString();
                        }
                      })()}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Population</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {stakeholders.reduce((sum, s) => {
                        const populationSize = s.population_size;
                        let adjustedSampleSize = baseSampleSize;
                        if (populationSize > 0 && populationSize <= 100) {
                          adjustedSampleSize = Math.ceil(
                            (baseSampleSize * populationSize) / (populationSize + baseSampleSize - 1)
                          );
                          adjustedSampleSize = Math.min(adjustedSampleSize, populationSize);
                        }
                        return sum + adjustedSampleSize;
                      }, 0)}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">Total Sample Size</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {stakeholders.filter(s => s.is_priority).length}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">High Priority Groups</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HCS Transaction Display */}
      <HcsTransactionDisplay 
        transaction={latestSampleParamsHcsTx}
        title="Sample Parameters Verification"
        description="Latest sample size parameters logged to Hedera Consensus Service"
      />

      {/* Statistical Methodology */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">Statistical Methodology</CardTitle>
          <CardDescription>Understanding the mathematical foundations of sample size calculations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Infinite Population Formula */}
            <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-xl">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">Infinite Population Formula</h4>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
                <code className="text-lg font-mono text-blue-600">n = (Z² × p × (1-p)) / E²</code>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Used when population is large (&gt;100) or unknown. Provides conservative estimates suitable for large populations.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Auto-Detection Logic</span>
                </div>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>• Population &gt;100: Finite correction</li>
                  <li>• Population &gt;100: Infinite formula</li>
                  <li>• No population: Infinite formula (default)</li>
                </ul>
              </div>
            </div>

            {/* Finite Population Correction */}
            <div className="bg-green-100 dark:bg-green-900 p-6 rounded-xl">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4">Finite Population Correction</h4>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
                <code className="text-lg font-mono text-green-600">n = (n₀ × N) / (N + n₀ - 1)</code>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Automatically used when population is ≤100. Reduces required sample size for small, known populations.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Variables</span>
                </div>
                <ul className="text-green-700 dark:text-green-300 space-y-1 text-xs">
                  <li>• Z = Z-score for confidence level</li>
                  <li>• p = Population proportion</li>
                  <li>• E = Margin of error</li>
                  <li>• N = Population size</li>
                  <li>• n₀ = Infinite population sample size</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}