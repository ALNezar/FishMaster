// api.js
const DEV_MODE = false; // toggle to true for local development without backend

const API_BASE_URL = 'http://localhost:8080';

const getToken = () => localStorage.getItem('fishmaster_token');
export const setToken = (token) => localStorage.setItem('fishmaster_token', token);
export const removeToken = () => localStorage.removeItem('fishmaster_token');

export const isAuthenticated = () => {
  if (DEV_MODE) return true;
  return !!getToken();
};

const createHeaders = (includeAuth = true, customHeaders = {}) => {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  if (includeAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const apiRequest = async (endpoint, options = {}) => {
  if (DEV_MODE) {
    switch (endpoint) {
      case '/users/me':
        return { id: 1, username: 'Dev User', email: 'dev@fishmaster.app' };
      case '/api/onboarding/fish-types':
        return [
          { id: 1, name: 'Goldfish', careLevel: 'Easy' },
          { id: 2, name: 'Betta', careLevel: 'Medium' },
          { id: 3, name: 'Guppy', careLevel: 'Easy' },
        ];
      case '/api/onboarding/status':
        return { completed: true };
      case '/api/onboarding/complete':
        return { success: true };
      // Mock Tank Data
      case '/tanks':
        return [
          { id: 1, name: 'Living Room Tank', sizeLiters: 120, fish: [] },
          { id: 2, name: 'Betta Bowl', sizeLiters: 20, fish: [] }
        ];
      default:
        // Handle dynamic routes for mocks
        if (endpoint.match(/^\/tanks\/\d+$/)) {
             return { id: 1, name: 'Living Room Tank', sizeLiters: 120, fish: [] };
        }
        return {}; // fallback
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(options.includeAuth !== false, options.headers || {});
  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);
    if (response.status === 204) return null; // Handle no content
    
    const contentType = response.headers.get('content-type');
    let data;
    const rawText = await response.text();
    
    // Try to parse as JSON if content-type suggests it
    if (contentType && contentType.includes('application/json') && rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    } else {
      data = rawText;
    }
    
    // Debug logging for errors
    if (!response.ok) {
      console.error(`API Error Details [${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        contentType,
        rawResponse: rawText,
        parsedData: data
      });
      
      // Handle different error response formats from backend
      let errorMessage;
      if (typeof data === 'string' && data.length > 0) {
        errorMessage = data;
      } else if (typeof data === 'object' && data !== null) {
        errorMessage = data.error || data.message || JSON.stringify(data);
      } else {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Export endpoints
export const signup = async (username, email, password) => apiRequest('/auth/signup', { method: 'POST', includeAuth: false, body: JSON.stringify({ username, email, password }) });
export const verifyEmail = async (email, verificationCode) => apiRequest('/auth/verify', { method: 'POST', includeAuth: false, body: JSON.stringify({ email, verificationCode }) });
export const resendVerificationCode = async (email) => apiRequest('/auth/resend', { method: 'POST', includeAuth: false, body: email, headers: { 'Content-Type': 'text/plain' } });
export const login = async (email, password) => { const res = await apiRequest('/auth/login', { method: 'POST', includeAuth: false, body: JSON.stringify({ email, password }) }); if (res.token) setToken(res.token); return res; };
export const logout = () => removeToken();
export const getFishTypes = async (careLevel = null) => apiRequest(`/api/onboarding/fish-types${careLevel ? `?careLevel=${careLevel}` : ''}`);
export const getOnboardingStatus = async () => apiRequest('/api/onboarding/status');
export const completeOnboarding = async (data) => apiRequest('/api/onboarding/complete', { method: 'POST', body: JSON.stringify(data) });
export const getCurrentUser = async () => apiRequest('/users/me');
export const updateProfile = async (data) => apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(data) });
export const deleteAccount = async () => apiRequest('/users/me', { method: 'DELETE' });

// Tank endpoints
export const getTanks = async () => apiRequest('/tanks');
export const getTank = async (id) => apiRequest(`/tanks/${id}`);
export const createTank = async (data) => apiRequest('/tanks', { method: 'POST', body: JSON.stringify(data) });
export const updateTank = async (id, data) => apiRequest(`/tanks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTank = async (id) => apiRequest(`/tanks/${id}`, { method: 'DELETE' });

// Export apiRequest for direct use (backwards compatibility)
export { apiRequest };

export default { signup, verifyEmail, resendVerificationCode, login, logout, getFishTypes, getOnboardingStatus, completeOnboarding, getCurrentUser, updateProfile, deleteAccount, isAuthenticated, setToken, removeToken, getTanks, getTank, createTank, updateTank, deleteTank, apiRequest };
