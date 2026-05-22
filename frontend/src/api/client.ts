// Core API client with fetch + fallback logic

import { API_BASE_URL, getApiMode } from './config';
import { createHeaders } from './utils/headers';
import { normalizeResponse } from './utils/normalize';
import { ApiRequestOptions } from './types';
import { getMockResponse } from './mock/mockHandlers';

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return /failed to fetch|networkerror|load failed/i.test(error.message);
  }
  return false;
};

const parseResponseBody = async (response: Response): Promise<any> => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  const rawText = await response.text();

  if (contentType && contentType.includes('application/json') && rawText) {
    try {
      return JSON.parse(rawText);
    } catch {
      return rawText;
    }
  }

  return rawText;
};

const getMockApiData = (endpoint: string, options: ApiRequestOptions): any => {
  const mockResponse = getMockResponse(endpoint, options);
  if (mockResponse === null || mockResponse === undefined) {
    throw new Error(`No mock response configured for ${endpoint}`);
  }

  return normalizeResponse(mockResponse, endpoint);
};

export const apiRequest = async (
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<any> => {
  const apiMode = getApiMode();

  if (apiMode === 'mock') {
    return getMockApiData(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(
    options.includeAuth !== false,
    options.headers || {}
  );
  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      // Extract error message
      const data = await parseResponseBody(response);

      let errorMessage: string;
      if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      } else if (typeof data === 'object' && data !== null) {
        errorMessage = data.error || data.message || JSON.stringify(data);
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }

      throw new Error(errorMessage);
    }

    const data = await parseResponseBody(response);

    // Merge mock tank fish with backend data if needed
    const tankDetailMatch = endpoint.match(/^\/tanks\/(\d+)$/);
    if (tankDetailMatch && data && data.fish) {
      // This would only apply in hybrid mode, but keeping for compatibility
    }

    return normalizeResponse(data, endpoint);
  } catch (error) {
    if (apiMode !== 'backend' && isNetworkError(error)) {
      return getMockApiData(endpoint, options);
    }

    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};
