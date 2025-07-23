'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

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
}

const SemaContext = createContext<SemaContextType | undefined>(undefined);

export function SemaProvider({ children }: { children: ReactNode }) {
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

  // Load clients on mount
  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  // Load data when active client changes
  useEffect(() => {
    if (activeClient) {
      refreshData();
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

      setClients(data || []);
      
      // Set demo client as active if no active client
      if (!activeClient && data?.length > 0) {
        const demoClient = data.find(c => c.status === 'demo') || data[0];
        setActiveClient(demoClient);
      }
    } catch (error) {
      console.error('Error loading SEMA clients:', error);
    }
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

    setClients(prev => [data, ...prev]);
    
    // Set as active client if it's the first one
    if (clients.length === 0) {
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
      isLoading
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