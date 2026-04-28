// Fish management API endpoints

import { apiRequest } from './client';
import { Fish } from './types';

export const addFishToTank = async (
  tankId: number,
  fishData: Partial<Fish>
): Promise<Fish> => {
  return apiRequest(`/tanks/${tankId}/fish`, {
    method: 'POST',
    body: JSON.stringify(fishData),
  });
};

export const removeFishFromTank = async (
  tankId: number,
  fishId: number
): Promise<{ success: boolean }> => {
  return apiRequest(`/tanks/${tankId}/fish/${fishId}`, {
    method: 'DELETE',
  });
};

export const updateFish = async (
  tankId: number,
  fishId: number,
  fishData: Partial<Fish>
): Promise<Fish> => {
  return apiRequest(`/tanks/${tankId}/fish/${fishId}`, {
    method: 'PUT',
    body: JSON.stringify(fishData),
  });
};
