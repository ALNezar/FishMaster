// Configuration for API client

export const DEV_MODE = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'fishmaster_token';

export const LEARNING_PROGRESS_KEY = 'fishmaster_learning_progress_v1';

// Request defaults
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_RETRY_ATTEMPTS = 2;
