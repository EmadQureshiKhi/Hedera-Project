// GHG Calculator Types
export interface QuestionnaireData {
    orgName: string;
    boundaryApproach: string;
    controlSubtype: string;
    operationalBoundary: string;
    emissionSources: string;
    timestamp: string;
  }
  
  export interface EmissionEntry {
    id: string;
    scope: string;
    category: string;
    fuelCategory: string;
    fuelType: string;
    amount: number;
    unit_type: string;
    baseFactor: number;
    convertedFactor: number;
    emissions: number;
    timestamp: string;
  }
  
  export interface CustomFuel {
    factor: number;
    custom: boolean;
    timestamp?: string;
  }
  
  export interface CalculationState {
    scope: string;
    category: string;
    equipmentType: string;
    fuelCategory: string;
    fuelType: string;
    amount: number;
    unit: string;
  }
  
  export interface CustomEquipmentData {
    name: string;
    description: string;
    category: string;
  }
  
  export interface EmissionFactor {
    factor: number;
    custom: boolean;
  }
  
  export type EmissionFactorsDatabase = {
    [scope: string]: {
      [category: string]: {
        [fuelCategory: string]: {
          [fuelType: string]: EmissionFactor;
        };
      } | {
        [fuelType: string]: EmissionFactor;
      };
    };
  };