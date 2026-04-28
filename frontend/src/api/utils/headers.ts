// HTTP header utilities

import { getToken } from './token';

export const createHeaders = (
  includeAuth: boolean = true,
  customHeaders: Record<string, string> = {}
): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};
