// Token management utilities

import { TOKEN_KEY } from '../config';

export const getToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token === 'dev-preview-token') {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return token;
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
