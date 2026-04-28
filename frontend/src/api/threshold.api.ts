// Alert thresholds API endpoints

import { apiRequest } from './client';
import { AlertThresholds } from './types';

export const getAlertThresholds = async (tankId: number): Promise<AlertThresholds> => {
  return apiRequest(`/tanks/${tankId}/thresholds`);
};

export const updateAlertThresholds = async (
  tankId: number,
  data: AlertThresholds
): Promise<{ success: boolean } & AlertThresholds> => {
  return apiRequest(`/tanks/${tankId}/thresholds`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};
