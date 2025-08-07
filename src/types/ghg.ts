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
  equipmentType?: string;
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

// For Scope 1: category -> fuelCategory -> fuelType -> EmissionFactor
export type Scope1Factors = {
  [category: string]: {
    [fuelCategory: string]: {
      [fuelType: string]: EmissionFactor;
    };
  };
};

// For Scope 2: fuelCategory -> fuelType -> EmissionFactor
export type Scope2Factors = {
  [fuelCategory: string]: {
    [fuelType: string]: EmissionFactor;
  };
};

// The main database type, mapping each scope to its structure
export type EmissionFactorsDatabase = {
  'Scope 1': Scope1Factors;
  'Scope 2': Scope2Factors;
  // Add more scopes if needed
};