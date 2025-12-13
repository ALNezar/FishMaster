/**
 * FishMaster API Service
 * Handles all HTTP communication with the Spring Boot backend.
 */

const API_BASE_URL = 'http://localhost:8080';

/**
 * Get the stored JWT token
 */
const getToken = () => localStorage.getItem('fishmaster_token');

/**
 * Store the JWT token
 */
export const setToken = (token) => {
  localStorage.setItem('fishmaster_token', token);
};

/**
 * Remove the JWT token (logout)
 */
export const removeToken = () => {
  localStorage.removeItem('fishmaster_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Create headers with optional auth token
 */
const createHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: createHeaders(options.includeAuth !== false),
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      throw new Error(data.message || data || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * Register a new user
 */
export const signup = async (username, email, password) => {
  return apiRequest('/auth/signup', {
    method: 'POST',
    includeAuth: false,
    body: JSON.stringify({ username, email, password }),
  });
};

/**
 * Verify email with 6-digit code
 */
export const verifyEmail = async (email, verificationCode) => {
  return apiRequest('/auth/verify', {
    method: 'POST',
    includeAuth: false,
    body: JSON.stringify({ email, verificationCode }),
  });
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (email) => {
  return apiRequest('/auth/resend', {
    method: 'POST',
    includeAuth: false,
    body: JSON.stringify(email),
  });
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    includeAuth: false,
    body: JSON.stringify({ email, password }),
  });
  
  if (response.token) {
    setToken(response.token);
  }
  
  return response;
};

/**
 * Logout user
 */
export const logout = () => {
  removeToken();
};

// ============================================
// ONBOARDING ENDPOINTS
// ============================================

/**
 * Get available fish types for the dropdown
 */
export const getFishTypes = async (careLevel = null) => {
  const params = careLevel ? `?careLevel=${careLevel}` : '';
  return apiRequest(`/api/onboarding/fish-types${params}`);
};

/**
 * Check onboarding status
 */
export const getOnboardingStatus = async () => {
  return apiRequest('/api/onboarding/status');
};

/**
 * Complete onboarding with all collected data
 */
export const completeOnboarding = async (onboardingData) => {
  return apiRequest('/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(onboardingData),
  });
};

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
  return apiRequest('/users/me');
};

export default {
  signup,
  verifyEmail,
  resendVerificationCode,
  login,
  logout,
  getFishTypes,
  getOnboardingStatus,
  completeOnboarding,
  getCurrentUser,
  isAuthenticated,
  setToken,
  removeToken,
};
