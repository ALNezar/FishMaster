// Tank management API endpoints

import { apiRequest } from './client';
import { Tank } from './types';

export const getTanks = async (): Promise<Tank[]> => {
  return apiRequest('/tanks');
};

export const getTank = async (id: number): Promise<Tank> => {
  return apiRequest(`/tanks/${id}`);
};

export const createTank = async (data: Partial<Tank>): Promise<Tank> => {
  return apiRequest('/tanks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateTank = async (id: number, data: Partial<Tank>): Promise<Tank> => {
  return apiRequest(`/tanks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteTank = async (id: number): Promise<{ success: boolean }> => {
  return apiRequest(`/tanks/${id}`, {
    method: 'DELETE',
  });
};
