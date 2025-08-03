import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { EmissionData, Certificate } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

// User hooks
export function useUser() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user', user?.wallet_address],
    queryFn: () => user?.wallet_address ? apiClient.getUser(user.wallet_address) : Promise.resolve(null),
    enabled: !!user?.wallet_address,
  });
}

// Dashboard hooks
export function useDashboardStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['dashboard-stats', targetUserId],
    queryFn: () => targetUserId ? apiClient.getDashboardStats(targetUserId) : Promise.resolve(null),
    enabled: !!targetUserId,
  });
}

// Emissions hooks
export function useUserEmissions(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['user-emissions', targetUserId],
    queryFn: () => targetUserId ? apiClient.getUserEmissions(targetUserId) : Promise.resolve([]),
    enabled: !!targetUserId,
  });
}

export function useSaveEmissionData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<EmissionData> }) => 
      apiClient.saveEmissionData(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-emissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

// Certificate hooks
export function useUserCertificates(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['user-certificates', targetUserId],
    queryFn: () => targetUserId ? apiClient.getUserCertificates(targetUserId) : Promise.resolve([]),
    enabled: !!targetUserId,
  });
}

export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => apiClient.getCertificate(certificateId),
    enabled: !!certificateId,
  });
}

export function useCreateCertificate(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useMutation({
    mutationFn: ({ emissionDataId, certificateData }: { 
      emissionDataId: string; 
      certificateData: Partial<Certificate> 
    }) => 
      targetUserId ? apiClient.createCertificate(targetUserId, emissionDataId, certificateData) : Promise.reject(new Error('No user ID available')),
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
export function useUserTransactions(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['user-transactions', targetUserId],
    queryFn: () => targetUserId ? apiClient.getUserTransactions(targetUserId) : Promise.resolve([]),
    enabled: !!targetUserId,
  });
}

export function useCreateTransaction(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useMutation({
    mutationFn: ({ creditId, amount, totalPrice }: {
      creditId: string; 
      amount: number; 
      totalPrice: number; 
    }) => 
      targetUserId ? apiClient.createTransaction(targetUserId, creditId, amount, totalPrice) : Promise.reject(new Error('No user ID available')),
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