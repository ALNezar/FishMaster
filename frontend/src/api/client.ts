// Core API client with fetch + fallback logic

import { API_BASE_URL } from './config';
import { createHeaders } from './utils/headers';
import { normalizeResponse } from './utils/normalize';
import { ApiRequestOptions } from '../types';

export const apiRequest = async (
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<any> => {
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

    // Handle 204 No Content
    if (response.status === 204) return null;

    if (!response.ok) {
      // Extract error message
      const contentType = response.headers.get('content-type');
      const rawText = await response.text();
      let data: any;

      if (contentType && contentType.includes('application/json') && rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
      } else {
        data = rawText;
      }

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

    // Parse response
    const contentType = response.headers.get('content-type');
    const rawText = await response.text();
    let data: any;

    if (contentType && contentType.includes('application/json') && rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    } else {
      data = rawText;
    }

    // Merge mock tank fish with backend data if needed
    const tankDetailMatch = endpoint.match(/^\/tanks\/(\d+)$/);
    if (tankDetailMatch && data && data.fish) {
      // This would only apply in hybrid mode, but keeping for compatibility
    }

    return normalizeResponse(data, endpoint);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};
