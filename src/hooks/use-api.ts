import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { EmissionData, Certificate } from '@/lib/supabase';

// Current user (demo)
const DEMO_USER_ID = 'demo-user-1';
const DEMO_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

// User hooks
export function useUser() {
  return useQuery({
    queryKey: ['user', DEMO_WALLET],
    queryFn: () => apiClient.getUser(DEMO_WALLET),
  });
}

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats', DEMO_USER_ID],
    queryFn: () => apiClient.getDashboardStats(DEMO_USER_ID),
  });
}

// Emissions hooks
export function useUserEmissions() {
  return useQuery({
    queryKey: ['user-emissions', DEMO_USER_ID],
    queryFn: () => apiClient.getUserEmissions(DEMO_USER_ID),
  });
}

export function useSaveEmissionData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<EmissionData>) => 
      apiClient.saveEmissionData(DEMO_USER_ID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-emissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Certificate hooks
export function useUserCertificates() {
  return useQuery({
    queryKey: ['user-certificates', DEMO_USER_ID],
    queryFn: () => apiClient.getUserCertificates(DEMO_USER_ID),
  });
}

export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => apiClient.getCertificate(certificateId),
    enabled: !!certificateId,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ emissionDataId, certificateData }: { 
      emissionDataId: string; 
      certificateData: Partial<Certificate> 
    }) => 
      apiClient.createCertificate(DEMO_USER_ID, emissionDataId, certificateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Carbon credits hooks
export function useCarbonCredits() {
  return useQuery({
    queryKey: ['carbon-credits'],
    queryFn: () => apiClient.getCarbonCredits(),
  });
}

// Transaction hooks
export function useUserTransactions() {
  return useQuery({
    queryKey: ['user-transactions', DEMO_USER_ID],
    queryFn: () => apiClient.getUserTransactions(DEMO_USER_ID),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ creditId, amount, totalPrice }: { 
      creditId: string; 
      amount: number; 
      totalPrice: number; 
    }) => 
      apiClient.createTransaction(DEMO_USER_ID, creditId, amount, totalPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Leaderboard hooks
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.getLeaderboard(),
  });
}