'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

// Export SemaModule type for use in other components
export type SemaModule = 
  | 'dashboard' 
  | 'stakeholders' 
  | 'sample-size' 
  | 'questionnaire' 
  | 'internal-assessment' 
  | 'materiality-matrix' 
  | 'reporting' 
  | 'admin';

// Demo client that's always available
const DEMO_CLIENT: SemaClient = {
  id: 'demo-client',
  name: 'Demo Organization',
  description: 'Complete SEMA demonstration with sample data',
  industry: 'Technology',
  size: 'Medium',
  status: 'demo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface SemaClient {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'inactive' | 'demo';
  created_at: string;
  updated_at: string;
}

export interface SemaStakeholder {
  id: string;
  client_id: string;
  name: string;
  category: 'Internal' | 'External';
  stakeholder_type?: string;
  dependency_economic: number;
  dependency_social: number;
  dependency_environmental: number;
  influence_economic: number;
  influence_social: number;
  influence_environmental: number;
  total_score: number;
  normalized_score: number;
  influence_category: 'High' | 'Medium' | 'Low';
  is_priority: boolean;
  population_size: number;
  created_at: string;
  updated_at: string;
}

export interface SemaSampleParameters {
  id: string;
  client_id: string;
  confidence_level: number;
  margin_error: number;
  population_proportion: number;
  z_score: number;
  base_sample_size: number;
  created_at: string;
  updated_at: string;
}

export interface SemaMaterialTopic {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  category: 'Economic' | 'Environmental' | 'Social';
  gri_code?: string;
  average_score: number;
  response_count: number;
  is_material: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemaInternalTopic {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  category: 'Economic' | 'Environmental' | 'Social';
  severity: number;
  likelihood: number;
  significance: number;
  is_material: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemaQuestionnaireResponse {
  id: string;
  topic_id: string;
  stakeholder_type: string;
  respondent_name?: string;
  score: number;
  comments?: string;
  response_time: number;
  created_at: string;
}

export interface SemaReport {
  id: string;
  client_id: string;
  title: string;
  report_type: 'materiality_assessment' | 'stakeholder_engagement' | 'full_sema';
  material_topics: any[];
  gri_disclosures: Record<string, any>;
  process_summary: Record<string, any>;
  status: 'draft' | 'final' | 'published';
  generated_at: string;
  created_at: string;
  updated_at: string;
}

interface SemaContextType {
  // Client management
  clients: SemaClient[];
  activeClient: SemaClient | null;
  setActiveClient: (client: SemaClient | null) => void;
  addClient: (client: Omit<SemaClient, 'id' | 'created_at' | 'updated_at'>) => Promise<SemaClient>;
  updateClient: (id: string, updates: Partial<SemaClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Data management
  stakeholders: SemaStakeholder[];
  sampleParameters: SemaSampleParameters | null;
  materialTopics: SemaMaterialTopic[];
  internalTopics: SemaInternalTopic[];
  questionnaireResponses: SemaQuestionnaireResponse[];
  reports: SemaReport[];
  
  // Data operations
  refreshData: () => Promise<void>;
  reloadClients: () => Promise<void>;
  isLoading: boolean;
  
  // Navigation and form control
  setActiveSemaModule: (module: SemaModule) => void;
  setOpenAdminClientForm: (isOpen: boolean) => void;
}

const SemaContext = createContext<SemaContextType | undefined>(undefined);

interface SemaProviderProps {
  children: ReactNode;
  setActiveSemaModule: (module: SemaModule) => void;
  setOpenAdminClientForm: (isOpen: boolean) => void;
}

export function SemaProvider({ 
  children, 
  setActiveSemaModule, 
  setOpenAdminClientForm 
}: SemaProviderProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<SemaClient[]>([]);
  const [activeClient, setActiveClient] = useState<SemaClient | null>(null);
  const [stakeholders, setStakeholders] = useState<SemaStakeholder[]>([]);
  const [sampleParameters, setSampleParameters] = useState<SemaSampleParameters | null>(null);
  const [materialTopics, setMaterialTopics] = useState<SemaMaterialTopic[]>([]);
  const [internalTopics, setInternalTopics] = useState<SemaInternalTopic[]>([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<SemaQuestionnaireResponse[]>([]);
  const [reports, setReports] = useState<SemaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Demo data for showcase
  const getDemoData = () => ({
    stakeholders: [
      {
        id: 'demo-stakeholder-1',
        client_id: 'demo-client',
        name: 'Employees',
        category: 'Internal' as const,
        stakeholder_type: 'Employees',
        dependency_economic: 5,
        dependency_social: 4,
        dependency_environmental: 3,
        influence_economic: 4,
        influence_social: 5,
        influence_environmental: 3,
        total_score: 24,
        normalized_score: 0.8,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-2',
        client_id: 'demo-client',
        name: 'Customers',
        category: 'External' as const,
        stakeholder_type: 'Customers',
        dependency_economic: 5,
        dependency_social: 3,
        dependency_environmental: 2,
        influence_economic: 5,
        influence_social: 4,
        influence_environmental: 2,
        total_score: 21,
        normalized_score: 0.7,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-3',
        client_id: 'demo-client',
        name: 'Investors',
        category: 'External' as const,
        stakeholder_type: 'Investors',
        dependency_economic: 5,
        dependency_social: 2,
        dependency_environmental: 3,
        influence_economic: 5,
        influence_social: 3,
        influence_environmental: 4,
        total_score: 22,
        normalized_score: 0.73,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-4',
        client_id: 'demo-client',
        name: 'Suppliers',
        category: 'External' as const,
        stakeholder_type: 'Suppliers',
        dependency_economic: 4,
        dependency_social: 3,
        dependency_environmental: 4,
        influence_economic: 3,
        influence_social: 2,
        influence_environmental: 4,
        total_score: 20,
        normalized_score: 0.67,
        influence_category: 'Medium' as const,
        is_priority: true,
        population_size: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-stakeholder-5',
        client_id: 'demo-client',
        name: 'Local Community',
        category: 'External' as const,
        stakeholder_type: 'Community',
        dependency_economic: 2,
        dependency_social: 4,
        dependency_environmental: 5,
        influence_economic: 3,
        influence_social: 4,
        influence_environmental: 5,
        total_score: 23,
        normalized_score: 0.77,
        influence_category: 'High' as const,
        is_priority: true,
        population_size: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    sampleParameters: {
      id: 'demo-sample-params',
      client_id: 'demo-client',
      confidence_level: 0.95,
      margin_error: 0.05,
      population_proportion: 0.5,
      z_score: 1.96,
      base_sample_size: 384,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    materialTopics: [
      {
        id: 'demo-material-1',
        client_id: 'demo-client',
        name: 'GHG Emissions',
        description: 'Direct and indirect greenhouse gas emissions',
        category: 'Environmental' as const,
        gri_code: 'GRI 305',
        average_score: 8.5,
        response_count: 45,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-2',
        client_id: 'demo-client',
        name: 'Economic Performance',
        description: 'Financial performance and economic impact',
        category: 'Economic' as const,
        gri_code: 'GRI 201',
        average_score: 9.2,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-3',
        client_id: 'demo-client',
        name: 'Employee Health & Safety',
        description: 'Occupational health and safety practices',
        category: 'Social' as const,
        gri_code: 'GRI 403',
        average_score: 8.8,
        response_count: 48,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-4',
        client_id: 'demo-client',
        name: 'Data Privacy',
        description: 'Customer data protection and privacy',
        category: 'Social' as const,
        gri_code: 'GRI 418',
        average_score: 7.9,
        response_count: 42,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-5',
        client_id: 'demo-client',
        name: 'Water Management',
        description: 'Water usage and conservation',
        category: 'Environmental' as const,
        gri_code: 'GRI 303',
        average_score: 6.5,
        response_count: 38,
        is_material: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-6',
        client_id: 'demo-client',
        name: 'Supply Chain Ethics',
        description: 'Ethical sourcing and supplier practices',
        category: 'Social' as const,
        gri_code: 'GRI 414',
        average_score: 7.2,
        response_count: 40,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-7',
        client_id: 'demo-client',
        name: 'Cybersecurity Threats',
        description: 'External stakeholder importance of cybersecurity threats and data breaches',
        category: 'Social' as const,
        gri_code: 'GRI 418',
        average_score: 8.0,
        response_count: 55,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-8',
        client_id: 'demo-client',
        name: 'Supply Chain Disruption',
        description: 'External stakeholder importance of supply chain resilience and continuity',
        category: 'Economic' as const,
        gri_code: 'GRI 204',
        average_score: 7.5,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-9',
        client_id: 'demo-client',
        name: 'Renewable Energy Transition',
        description: 'Transitioning to renewable energy sources and reducing reliance on fossil fuels',
        category: 'Environmental' as const,
        gri_code: 'GRI 302',
        average_score: 8.0,
        response_count: 60,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-10',
        client_id: 'demo-client',
        name: 'Employee Well-being & Diversity',
        description: 'Importance of employee health, safety, well-being, and diversity & inclusion initiatives',
        category: 'Social' as const,
        gri_code: 'GRI 401',
        average_score: 7.5,
        response_count: 55,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-11',
        client_id: 'demo-client',
        name: 'Circular Economy Practices',
        description: 'Importance of adopting circular economy principles in product design and operations',
        category: 'Environmental' as const,
        gri_code: 'GRI 306',
        average_score: 7.0,
        response_count: 50,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-material-12',
        client_id: 'demo-client',
        name: 'Ethical AI Development',
        description: 'Importance of developing and deploying artificial intelligence ethically and responsibly',
        category: 'Social' as const,
        gri_code: null,
        average_score: 7.8,
        response_count: 48,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    internalTopics: [
      {
        id: 'demo-internal-1',
        client_id: 'demo-client',
        name: 'Regulatory Compliance',
        description: 'Risk of non-compliance with environmental regulations',
        category: 'Environmental' as const,
        severity: 4,
        likelihood: 3,
        significance: 12,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-2',
        client_id: 'demo-client',
        name: 'Talent Retention',
        description: 'Risk of losing key employees',
        category: 'Social' as const,
        severity: 3,
        likelihood: 4,
        significance: 12,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-3',
        client_id: 'demo-client',
        name: 'Supply Chain Disruption',
        description: 'Risk of supply chain interruptions',
        category: 'Economic' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-4',
        client_id: 'demo-client',
        name: 'Cybersecurity Threats',
        description: 'Risk of data breaches and cyber attacks',
        category: 'Social' as const,
        severity: 5,
        likelihood: 3,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-5',
        client_id: 'demo-client',
        name: 'Climate Change Impact',
        description: 'Physical risks from climate change',
        category: 'Environmental' as const,
        severity: 3,
        likelihood: 3,
        significance: 9,
        is_material: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-6',
        client_id: 'demo-client',
        name: 'GHG Emissions',
        description: 'Internal business impact of greenhouse gas emissions',
        category: 'Environmental' as const,
        severity: 5,
        likelihood: 5,
        significance: 25,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-7',
        client_id: 'demo-client',
        name: 'Economic Performance',
        description: 'Internal business impact of financial performance and stability',
        category: 'Economic' as const,
        severity: 5,
        likelihood: 4,
        significance: 20,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-8',
        client_id: 'demo-client',
        name: 'Employee Health & Safety',
        description: 'Internal business impact of occupational health and safety practices',
        category: 'Social' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-9',
        client_id: 'demo-client',
        name: 'Renewable Energy Transition',
        description: 'Internal impact of shifting to renewable energy, including costs and operational changes',
        category: 'Environmental' as const,
        severity: 4,
        likelihood: 5,
        significance: 20,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-10',
        client_id: 'demo-client',
        name: 'Employee Well-being & Diversity',
        description: 'Internal impact of employee morale, productivity, and talent retention due to well-being and diversity efforts',
        category: 'Social' as const,
        severity: 4,
        likelihood: 4,
        significance: 16,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-11',
        client_id: 'demo-client',
        name: 'Circular Economy Practices',
        description: 'Internal impact of implementing circular economy models, including resource efficiency and waste reduction',
        category: 'Environmental' as const,
        severity: 3,
        likelihood: 5,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'demo-internal-12',
        client_id: 'demo-client',
        name: 'Ethical AI Development',
        description: 'Internal impact of ethical considerations in AI development, including bias and transparency',
        category: 'Social' as const,
        severity: 5,
        likelihood: 3,
        significance: 15,
        is_material: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    questionnaireResponses: [
      {
        id: 'demo-response-1',
        topic_id: 'demo-material-1',
        stakeholder_type: 'Employees',
        respondent_name: 'John Smith',
        score: 9,
        comments: 'Very important for our future',
        response_time: 120,
        created_at: new Date().toISOString(),
      },
      {
        id: 'demo-response-2',
        topic_id: 'demo-material-1',
        stakeholder_type: 'Customers',
        respondent_name: 'Sarah Johnson',
        score: 8,
        comments: 'Critical for brand reputation',
        response_time: 95,
        created_at: new Date().toISOString(),
      },
    ],
    reports: [
      {
        id: 'demo-report-1',
        client_id: 'demo-client',
        title: 'Materiality Assessment Report 2024',
        report_type: 'materiality_assessment' as const,
        material_topics: [],
        gri_disclosures: {},
        process_summary: {},
        status: 'final' as const,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });

  // Load clients on mount
  useEffect(() => {
    // Always load clients (demo client will be available even without user)
    if (user) {
      loadClients();
    } else {
      // No user logged in, just show demo client
      setClients([DEMO_CLIENT]);
      setActiveClient(DEMO_CLIENT);
    }
  }, [user]);

  // Load data when active client changes
  useEffect(() => {
    if (activeClient) {
      if (activeClient.status === 'demo') {
        loadDemoData();
      } else {
        refreshData();
      }
    }
  }, [activeClient]);

  const loadClients = async () => {
    if (!user) return;

    console.log('Loading clients for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('sema_clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        throw error;
      }

      console.log('Loaded clients:', data);

      // Always include demo client in the list
      const allClients = [DEMO_CLIENT, ...(data || [])];
      setClients(allClients);
      
      // Set active client priority: current active > first user client > demo client
      if (!activeClient) {
        if (data && data.length > 0) {
          // User has clients, set first user client as active
          setActiveClient(data[0]);
        } else {
          // No user clients, set demo as active
          setActiveClient(DEMO_CLIENT);
        }
      }
    } catch (error) {
      console.error('Error loading SEMA clients:', error);
      // On error, still provide demo client
      setClients([DEMO_CLIENT]);
      if (!activeClient) {
        setActiveClient(DEMO_CLIENT);
      }
    }
  };

  const loadDemoData = () => {
    const demoData = getDemoData();
    setStakeholders(demoData.stakeholders);
    setSampleParameters(demoData.sampleParameters);
    setMaterialTopics(demoData.materialTopics);
    setInternalTopics(demoData.internalTopics);
    setQuestionnaireResponses(demoData.questionnaireResponses);
    setReports(demoData.reports);
    setIsLoading(false);
  };

  // Expose loadClients for external use
  const reloadClients = loadClients;
  const addClient = async (clientData: Omit<SemaClient, 'id' | 'created_at' | 'updated_at'>): Promise<SemaClient> => {
    if (!user) throw new Error('User not authenticated');

    // Ensure we're passing the user_id correctly
    const { data, error } = await supabase
      .from('sema_clients')
      .insert([{ 
        ...clientData, 
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Add new client after demo client
    setClients(prev => [DEMO_CLIENT, data, ...prev.filter(c => c.id !== 'demo-client')]);
    
    // Set as active client if it's the first user client
    const userClients = clients.filter(c => c.status !== 'demo');
    if (userClients.length === 0) {
      setActiveClient(data);
    }
    
    return data;
  };

  const updateClient = async (id: string, updates: Partial<SemaClient>) => {
    const { error } = await supabase
      .from('sema_clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (activeClient?.id === id) {
      setActiveClient(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteClient = async (id: string) => {
    // Don't allow deleting demo client
    const client = clients.find(c => c.id === id);
    if (client?.status === 'demo') {
      throw new Error('Cannot delete demo client');
    }

    const { error } = await supabase
      .from('sema_clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setClients(prev => prev.filter(c => c.id !== id));
    if (activeClient?.id === id) {
      setActiveClient(null);
    }
  };

  const refreshData = async () => {
    if (!activeClient) return;

    setIsLoading(true);
    try {
      // Load all data for the active client
      const [
        stakeholdersRes,
        sampleParamsRes,
        materialTopicsRes,
        internalTopicsRes,
        responsesRes,
        reportsRes
      ] = await Promise.all([
        supabase.from('sema_stakeholders').select('*').eq('client_id', activeClient.id),
        supabase.from('sema_sample_parameters').select('*').eq('client_id', activeClient.id).single(),
        supabase.from('sema_material_topics').select('*').eq('client_id', activeClient.id),
        supabase.from('sema_internal_topics').select('*').eq('client_id', activeClient.id),
        supabase.from('sema_questionnaire_responses').select('*').eq('topic_id', activeClient.id), // This needs a proper join
        supabase.from('sema_reports').select('*').eq('client_id', activeClient.id)
      ]);

      setStakeholders(stakeholdersRes.data || []);
      setSampleParameters(sampleParamsRes.data || null);
      setMaterialTopics(materialTopicsRes.data || []);
      setInternalTopics(internalTopicsRes.data || []);
      setQuestionnaireResponses(responsesRes.data || []);
      setReports(reportsRes.data || []);
    } catch (error) {
      console.error('Error refreshing SEMA data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SemaContext.Provider value={{
      clients,
      activeClient,
      setActiveClient,
      addClient,
      updateClient,
      deleteClient,
      stakeholders,
      sampleParameters,
      materialTopics,
      internalTopics,
      questionnaireResponses,
      reports,
      refreshData,
      reloadClients,
      isLoading,
      setActiveSemaModule,
      setOpenAdminClientForm
    }}>
      {children}
    </SemaContext.Provider>
  );
}

export function useSema() {
  const context = useContext(SemaContext);
  if (context === undefined) {
    throw new Error('useSema must be used within a SemaProvider');
  }
  return context;
}