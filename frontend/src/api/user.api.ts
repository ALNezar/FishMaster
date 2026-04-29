import { User } from './types';
import { apiRequest } from './client';

export const getCurrentUser = async (): Promise<User> => {
  return apiRequest('/users/me');
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  return apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAccount = async (): Promise<{ success: boolean }> => {
  return apiRequest('/users/me', {
    method: 'DELETE',
  });
};