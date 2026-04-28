import { User } from './types';

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