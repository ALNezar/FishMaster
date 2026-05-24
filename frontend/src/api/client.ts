// Core API client with fetch handling

import { API_BASE_URL } from './config';
import { createHeaders } from './utils/headers';
import { normalizeResponse } from './utils/normalize';
import { ApiRequestOptions } from './types';

interface HttpError extends Error {
  status?: number;
  responseBody?: any;
}

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
    if (!response.ok) {
      const data = await parseResponseBody(response);

      let errorMessage: string;
      if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      } else if (typeof data === 'object' && data !== null) {
        errorMessage = data.error || data.message || JSON.stringify(data);
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }

      const error = new Error(errorMessage) as HttpError;
      error.status = response.status;
      error.responseBody = data;
      throw error;
    }

    const data = await parseResponseBody(response);
    return normalizeResponse(data, endpoint);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};