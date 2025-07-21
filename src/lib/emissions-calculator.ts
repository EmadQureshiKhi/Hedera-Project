// Enhanced emissions calculation engine
export interface EmissionFactor {
    id: string;
    activity: string;
    category: string;
    factor: number; // kg CO2e per unit
    unit: string;
    source: string;
    region?: string;
    year: number;
  }
  
  export interface CalculationResult {
    totalEmissions: number;
    breakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    confidence: number; // 0-1 score
    warnings: string[];
    recommendations: string[];
    processedData: ProcessedDataPoint[];
    summary: {
      totalRows: number;
      processedRows: number;
      skippedRows: number;
      categories: number;
      averageConfidence: number;
    };
  }
  
  export interface ProcessedDataPoint {
    originalRow: any;
    activity: string;
    category: string;
    amount: number;
    unit: string;
    emissionFactor: number;
    emissions: number;
    confidence: number;
    date?: Date;
    location?: string;
  }
  
  // Comprehensive emission factors database
  export const EMISSION_FACTORS: EmissionFactor[] = [
    // Energy - Electricity
    {
      id: 'electricity_grid_us',
      activity: 'electricity',
      category: 'Energy',
      factor: 0.4,
      unit: 'kWh',
      source: 'EPA eGRID 2022',
      region: 'US',
      year: 2022
    },
    {
      id: 'electricity_grid_eu',
      activity: 'electricity',
      category: 'Energy',
      factor: 0.3,
      unit: 'kWh',
      source: 'EEA 2022',
      region: 'EU',
      year: 2022
    },
    {
      id: 'electricity_renewable',
      activity: 'renewable electricity',
      category: 'Energy',
      factor: 0.05,
      unit: 'kWh',
      source: 'IPCC 2014',
      region: 'Global',
      year: 2014
    },
  
    // Energy - Fuels
    {
      id: 'natural_gas',
      activity: 'natural gas',
      category: 'Energy',
      factor: 2.0,
      unit: 'm³',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'heating_oil',
      activity: 'heating oil',
      category: 'Energy',
      factor: 2.7,
      unit: 'liter',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'coal',
      activity: 'coal',
      category: 'Energy',
      factor: 2.4,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'propane',
      activity: 'propane',
      category: 'Energy',
      factor: 1.5,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
  
    // Transport - Road
    {
      id: 'petrol_car',
      activity: 'petrol car',
      category: 'Transport',
      factor: 0.18,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'diesel_car',
      activity: 'diesel car',
      category: 'Transport',
      factor: 0.17,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'electric_car',
      activity: 'electric car',
      category: 'Transport',
      factor: 0.05,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'hybrid_car',
      activity: 'hybrid car',
      category: 'Transport',
      factor: 0.12,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'motorcycle',
      activity: 'motorcycle',
      category: 'Transport',
      factor: 0.11,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'bus',
      activity: 'bus',
      category: 'Transport',
      factor: 0.08,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'train_electric',
      activity: 'electric train',
      category: 'Transport',
      factor: 0.04,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
    {
      id: 'train_diesel',
      activity: 'diesel train',
      category: 'Transport',
      factor: 0.06,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'UK',
      year: 2023
    },
  
    // Transport - Aviation
    {
      id: 'flight_domestic',
      activity: 'domestic flight',
      category: 'Transport',
      factor: 0.25,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'Global',
      year: 2023
    },
    {
      id: 'flight_short_haul',
      activity: 'short haul flight',
      category: 'Transport',
      factor: 0.15,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'Global',
      year: 2023
    },
    {
      id: 'flight_long_haul',
      activity: 'long haul flight',
      category: 'Transport',
      factor: 0.12,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'Global',
      year: 2023
    },
  
    // Transport - Shipping
    {
      id: 'ferry',
      activity: 'ferry',
      category: 'Transport',
      factor: 0.11,
      unit: 'km',
      source: 'DEFRA 2023',
      region: 'Global',
      year: 2023
    },
    {
      id: 'cargo_ship',
      activity: 'cargo ship',
      category: 'Transport',
      factor: 0.01,
      unit: 'tonne-km',
      source: 'IMO 2020',
      region: 'Global',
      year: 2020
    },
  
    // Waste
    {
      id: 'landfill_waste',
      activity: 'landfill waste',
      category: 'Waste',
      factor: 0.5,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'recycled_waste',
      activity: 'recycled waste',
      category: 'Waste',
      factor: 0.1,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'composted_waste',
      activity: 'composted waste',
      category: 'Waste',
      factor: 0.05,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'incinerated_waste',
      activity: 'incinerated waste',
      category: 'Waste',
      factor: 0.3,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
  
    // Industrial Processes
    {
      id: 'cement_production',
      activity: 'cement production',
      category: 'Industrial',
      factor: 0.9,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'steel_production',
      activity: 'steel production',
      category: 'Industrial',
      factor: 2.3,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
    {
      id: 'aluminum_production',
      activity: 'aluminum production',
      category: 'Industrial',
      factor: 11.5,
      unit: 'kg',
      source: 'IPCC 2006',
      region: 'Global',
      year: 2006
    },
  
    // Agriculture
    {
      id: 'beef_production',
      activity: 'beef production',
      category: 'Agriculture',
      factor: 60,
      unit: 'kg',
      source: 'FAO 2019',
      region: 'Global',
      year: 2019
    },
    {
      id: 'dairy_production',
      activity: 'dairy production',
      category: 'Agriculture',
      factor: 3.2,
      unit: 'liter',
      source: 'FAO 2019',
      region: 'Global',
      year: 2019
    },
    {
      id: 'rice_production',
      activity: 'rice production',
      category: 'Agriculture',
      factor: 2.5,
      unit: 'kg',
      source: 'FAO 2019',
      region: 'Global',
      year: 2019
    },
  ];
  
  export class EmissionsCalculator {
    private emissionFactors: EmissionFactor[];
    private region: string;
  
    constructor(region: string = 'Global') {
      this.emissionFactors = EMISSION_FACTORS;
      this.region = region;
    }
  
    // Main calculation method
    calculateEmissions(data: any[]): CalculationResult {
      const processedData: ProcessedDataPoint[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];
      let totalEmissions = 0;
      let totalConfidence = 0;
      let skippedRows = 0;
  
      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          const processed = this.processDataRow(row, i);
          if (processed) {
            processedData.push(processed);
            totalEmissions += processed.emissions;
            totalConfidence += processed.confidence;
          } else {
            skippedRows++;
          }
        } catch (error) {
          warnings.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Processing error'}`);
          skippedRows++;
        }
      }
  
      // Calculate breakdowns
      const breakdown = this.calculateBreakdown(processedData);
      const categoryBreakdown = this.calculateCategoryBreakdown(processedData);
  
      // Generate recommendations
      recommendations.push(...this.generateRecommendations(processedData, categoryBreakdown));
  
      // Add warnings for data quality
      if (skippedRows > data.length * 0.1) {
        warnings.push(`${skippedRows} rows were skipped due to insufficient data`);
      }
  
      const averageConfidence = processedData.length > 0 ? totalConfidence / processedData.length : 0;
  
      if (averageConfidence < 0.7) {
        warnings.push('Low confidence in calculations due to unclear activity descriptions');
      }
  
      return {
        totalEmissions: Math.round(totalEmissions * 100) / 100,
        breakdown,
        categoryBreakdown,
        confidence: averageConfidence,
        warnings,
        recommendations,
        processedData,
        summary: {
          totalRows: data.length,
          processedRows: processedData.length,
          skippedRows,
          categories: Object.keys(categoryBreakdown).length,
          averageConfidence,
        },
      };
    }
  
    // Process individual data row
    private processDataRow(row: any, index: number): ProcessedDataPoint | null {
      // Extract activity description
      const activity = this.extractActivity(row);
      if (!activity) {
        throw new Error('No activity description found');
      }
  
      // Extract amount/quantity
      const amount = this.extractAmount(row);
      if (amount <= 0) {
        throw new Error('No valid amount/quantity found');
      }
  
      // Find best matching emission factor
      const match = this.findBestEmissionFactor(activity);
      if (!match.factor) {
        throw new Error(`No emission factor found for activity: ${activity}`);
      }
  
      // Extract optional fields
      const date = this.extractDate(row);
      const location = this.extractLocation(row);
  
      // Calculate emissions
      const emissions = amount * match.factor.factor;
  
      return {
        originalRow: row,
        activity: match.normalizedActivity,
        category: match.factor.category,
        amount,
        unit: match.factor.unit,
        emissionFactor: match.factor.factor,
        emissions,
        confidence: match.confidence,
        date,
        location,
      };
    }
  
    // Extract activity from row data
    private extractActivity(row: any): string | null {
      const activityFields = [
        'activity', 'type', 'category', 'description', 'item', 'service',
        'fuel_type', 'transport_mode', 'energy_source', 'waste_type'
      ];
  
      for (const field of activityFields) {
        const value = this.findFieldValue(row, field);
        if (value && typeof value === 'string' && value.trim().length > 0) {
          return value.trim().toLowerCase();
        }
      }
  
      // Fallback: look for any text field that might contain activity description
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && value.trim().length > 2 && !this.isNumericString(value)) {
          return value.trim().toLowerCase();
        }
      }
  
      return null;
    }
  
    // Extract amount/quantity from row data
    private extractAmount(row: any): number {
      const amountFields = [
        'amount', 'quantity', 'value', 'volume', 'distance', 'consumption',
        'usage', 'kwh', 'liters', 'litres', 'km', 'miles', 'kg', 'tonnes'
      ];
  
      for (const field of amountFields) {
        const value = this.findFieldValue(row, field);
        if (value !== null && !isNaN(Number(value))) {
          const num = Number(value);
          if (num > 0) return num;
        }
      }
  
      // Fallback: look for any numeric field
      for (const [key, value] of Object.entries(row)) {
        if (value !== null && !isNaN(Number(value))) {
          const num = Number(value);
          if (num > 0) return num;
        }
      }
  
      return 0;
    }
  
    // Extract date from row data
    private extractDate(row: any): Date | undefined {
      const dateFields = ['date', 'timestamp', 'time', 'created_at', 'occurred_at'];
  
      for (const field of dateFields) {
        const value = this.findFieldValue(row, field);
        if (value) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
  
      return undefined;
    }
  
    // Extract location from row data
    private extractLocation(row: any): string | undefined {
      const locationFields = ['location', 'country', 'region', 'city', 'site', 'facility'];
  
      for (const field of locationFields) {
        const value = this.findFieldValue(row, field);
        if (value && typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
  
      return undefined;
    }
  
    // Find field value with flexible matching
    private findFieldValue(row: any, fieldName: string): any {
      // Direct match
      if (row[fieldName] !== undefined) {
        return row[fieldName];
      }
  
      // Case-insensitive match
      const lowerFieldName = fieldName.toLowerCase();
      for (const [key, value] of Object.entries(row)) {
        if (key.toLowerCase() === lowerFieldName) {
          return value;
        }
      }
  
      // Partial match
      for (const [key, value] of Object.entries(row)) {
        if (key.toLowerCase().includes(lowerFieldName) || lowerFieldName.includes(key.toLowerCase())) {
          return value;
        }
      }
  
      return null;
    }
  
    // Check if string represents a number
    private isNumericString(str: string): boolean {
      return !isNaN(Number(str)) && !isNaN(parseFloat(str));
    }
  
    // Find best matching emission factor
    private findBestEmissionFactor(activity: string): { factor: EmissionFactor | null; confidence: number; normalizedActivity: string } {
      let bestMatch: EmissionFactor | null = null;
      let bestScore = 0;
      let bestConfidence = 0;
  
      const normalizedActivity = this.normalizeActivity(activity);
  
      for (const factor of this.emissionFactors) {
        const score = this.calculateMatchScore(normalizedActivity, factor);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = factor;
          bestConfidence = Math.min(score, 1.0);
        }
      }
  
      // Apply region preference
      if (bestMatch && this.region !== 'Global') {
        const regionSpecificMatch = this.emissionFactors.find(f => 
          f.activity === bestMatch!.activity && f.region === this.region
        );
        if (regionSpecificMatch) {
          bestMatch = regionSpecificMatch;
          bestConfidence = Math.min(bestConfidence + 0.1, 1.0);
        }
      }
  
      return {
        factor: bestMatch,
        confidence: bestConfidence,
        normalizedActivity: bestMatch ? bestMatch.activity : normalizedActivity,
      };
    }
  
    // Normalize activity description
    private normalizeActivity(activity: string): string {
      return activity
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  
    // Calculate match score between activity and emission factor
    private calculateMatchScore(activity: string, factor: EmissionFactor): number {
      const activityWords = activity.split(' ');
      const factorWords = factor.activity.split(' ');
      
      let score = 0;
      let totalWords = Math.max(activityWords.length, factorWords.length);
  
      // Exact match
      if (activity === factor.activity) {
        return 1.0;
      }
  
      // Word-by-word matching
      for (const activityWord of activityWords) {
        for (const factorWord of factorWords) {
          if (activityWord === factorWord) {
            score += 1.0;
          } else if (activityWord.includes(factorWord) || factorWord.includes(activityWord)) {
            score += 0.7;
          } else if (this.areSimilarWords(activityWord, factorWord)) {
            score += 0.5;
          }
        }
      }
  
      // Normalize score
      return Math.min(score / totalWords, 1.0);
    }
  
    // Check if words are similar (basic implementation)
    private areSimilarWords(word1: string, word2: string): boolean {
      // Simple similarity check - could be enhanced with Levenshtein distance
      if (word1.length < 3 || word2.length < 3) return false;
      
      const longer = word1.length > word2.length ? word1 : word2;
      const shorter = word1.length > word2.length ? word2 : word1;
      
      return longer.includes(shorter) || shorter.includes(longer);
    }
  
    // Calculate breakdown by activity
    private calculateBreakdown(processedData: ProcessedDataPoint[]): Record<string, number> {
      const breakdown: Record<string, number> = {};
  
      for (const point of processedData) {
        const key = point.activity;
        breakdown[key] = (breakdown[key] || 0) + point.emissions;
      }
  
      // Round values
      for (const key in breakdown) {
        breakdown[key] = Math.round(breakdown[key] * 100) / 100;
      }
  
      return breakdown;
    }
  
    // Calculate breakdown by category
    private calculateCategoryBreakdown(processedData: ProcessedDataPoint[]): Record<string, number> {
      const breakdown: Record<string, number> = {};
  
      for (const point of processedData) {
        const key = point.category;
        breakdown[key] = (breakdown[key] || 0) + point.emissions;
      }
  
      // Round values
      for (const key in breakdown) {
        breakdown[key] = Math.round(breakdown[key] * 100) / 100;
      }
  
      return breakdown;
    }
  
    // Generate recommendations based on emissions data
    private generateRecommendations(processedData: ProcessedDataPoint[], categoryBreakdown: Record<string, number>): string[] {
      const recommendations: string[] = [];
      const totalEmissions = Object.values(categoryBreakdown).reduce((sum, val) => sum + val, 0);
  
      // Category-specific recommendations
      for (const [category, emissions] of Object.entries(categoryBreakdown)) {
        const percentage = (emissions / totalEmissions) * 100;
  
        if (percentage > 30) {
          switch (category) {
            case 'Energy':
              recommendations.push(`Energy accounts for ${percentage.toFixed(1)}% of emissions. Consider switching to renewable energy sources.`);
              break;
            case 'Transport':
              recommendations.push(`Transport accounts for ${percentage.toFixed(1)}% of emissions. Consider electric vehicles or public transport.`);
              break;
            case 'Waste':
              recommendations.push(`Waste accounts for ${percentage.toFixed(1)}% of emissions. Implement better recycling and waste reduction programs.`);
              break;
            case 'Industrial':
              recommendations.push(`Industrial processes account for ${percentage.toFixed(1)}% of emissions. Look into process optimization and cleaner technologies.`);
              break;
            case 'Agriculture':
              recommendations.push(`Agriculture accounts for ${percentage.toFixed(1)}% of emissions. Consider sustainable farming practices.`);
              break;
          }
        }
      }
  
      // General recommendations
      if (totalEmissions > 10000) {
        recommendations.push('Consider purchasing carbon offsets to achieve carbon neutrality.');
      }
  
      if (recommendations.length === 0) {
        recommendations.push('Great job! Your emissions are relatively low. Continue monitoring and look for further reduction opportunities.');
      }
  
      return recommendations;
    }
  
    // Get available emission factors for reference
    getAvailableFactors(): EmissionFactor[] {
      return this.emissionFactors.filter(f => f.region === this.region || f.region === 'Global');
    }
  
    // Add custom emission factor
    addCustomFactor(factor: EmissionFactor): void {
      this.emissionFactors.push(factor);
    }
  }
  
  // Export default calculator instance
  export const defaultCalculator = new EmissionsCalculator();