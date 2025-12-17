// api.js
const DEV_MODE = true; // toggle to false in production

const API_BASE_URL = 'http://localhost:8080';

const getToken = () => localStorage.getItem('fishmaster_token');
export const setToken = (token) => localStorage.setItem('fishmaster_token', token);
export const removeToken = () => localStorage.removeItem('fishmaster_token');

export const isAuthenticated = () => {
  if (DEV_MODE) return true;
  return !!getToken();
};

if (DEV_MODE) {
  localStorage.setItem('fishmaster_token', 'dev');
}

const createHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
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
  const config = { ...options, headers: createHeaders(options.includeAuth !== false) };

  try {
    const response = await fetch(url, config);
    if (response.status === 204) return null; // Handle no content
    
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(data.message || data || 'Request failed');
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Export endpoints
export const signup = async (username, email, password) => apiRequest('/auth/signup', { method: 'POST', includeAuth: false, body: JSON.stringify({ username, email, password }) });
export const verifyEmail = async (email, verificationCode) => apiRequest('/auth/verify', { method: 'POST', includeAuth: false, body: JSON.stringify({ email, verificationCode }) });
export const resendVerificationCode = async (email) => apiRequest('/auth/resend', { method: 'POST', includeAuth: false, body: JSON.stringify(email) });
export const login = async (email, password) => { const res = await apiRequest('/auth/login', { method: 'POST', includeAuth: false, body: JSON.stringify({ email, password }) }); if (res.token) setToken(res.token); return res; };
export const logout = () => removeToken();
export const getFishTypes = async (careLevel = null) => apiRequest(`/api/onboarding/fish-types${careLevel ? `?careLevel=${careLevel}` : ''}`);
export const getOnboardingStatus = async () => apiRequest('/api/onboarding/status');
export const completeOnboarding = async (data) => apiRequest('/api/onboarding/complete', { method: 'POST', body: JSON.stringify(data) });
export const getCurrentUser = async () => apiRequest('/users/me');
export default { signup, verifyEmail, resendVerificationCode, login, logout, getFishTypes, getOnboardingStatus, completeOnboarding, getCurrentUser, isAuthenticated, setToken, removeToken };
