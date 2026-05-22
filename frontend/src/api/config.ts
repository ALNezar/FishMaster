// Configuration for API client

export type ApiMode = 'auto' | 'backend' | 'mock';

export const DEV_MODE = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'fishmaster_token';

export const LEARNING_PROGRESS_KEY = 'fishmaster_learning_progress_v1';

export const API_MODE_KEY = 'fishmaster_api_mode';

// Request defaults
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 2;

const VALID_API_MODES: ApiMode[] = ['auto', 'backend', 'mock'];

const normalizeApiMode = (value: unknown): ApiMode | null => {
  if (typeof value !== 'string') return null;
  const next = value.trim().toLowerCase() as ApiMode;
  return VALID_API_MODES.includes(next) ? next : null;
};

export const getApiMode = (): ApiMode => {
  if (typeof window !== 'undefined') {
    const storedMode = normalizeApiMode(window.localStorage.getItem(API_MODE_KEY));
    if (storedMode) return storedMode;
  }

  const envMode = normalizeApiMode(import.meta.env.VITE_API_MODE);
  if (envMode) return envMode;

  if (String(import.meta.env.VITE_USE_MOCK_API).toLowerCase() === 'true') {
    return 'mock';
  }

  return DEV_MODE ? 'mock' : 'backend';
};

export const setApiMode = (mode: ApiMode): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(API_MODE_KEY, mode);
};

export const clearApiMode = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(API_MODE_KEY);
};

export const isMockApiEnabled = (): boolean => getApiMode() === 'mock';
