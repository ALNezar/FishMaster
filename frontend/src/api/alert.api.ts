import { apiRequest } from './client';
import { AlertResponse } from './types';

export const getAlerts = async (): Promise<AlertResponse[]> => {
  return apiRequest('/api/alerts');
};

export const getAlertsByTank = async (tankId: number): Promise<AlertResponse[]> => {
  return apiRequest(`/api/alerts/tank/${tankId}`);
};

export const getOpenAlerts = async (): Promise<AlertResponse[]> => {
  return apiRequest('/api/alerts/open');
};

export const acknowledgeAlert = async (id: number): Promise<{ message: string; id: number }> => {
  return apiRequest(`/api/alerts/${id}/acknowledge`, {
    method: 'POST',
  });
};
