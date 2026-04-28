// Onboarding API endpoints

import { apiRequest } from './client';
import { FishType } from './types';

export const getFishTypes = async (careLevel?: string | null): Promise<FishType[]> => {
  return apiRequest(
    `/api/onboarding/fish-types${careLevel ? `?careLevel=${careLevel}` : ''}`
  );
};

export const getOnboardingStatus = async (): Promise<{ completed: boolean }> => {
  return apiRequest('/api/onboarding/status');
};

export const completeOnboarding = async (data: any): Promise<{ success: boolean }> => {
  return apiRequest('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
