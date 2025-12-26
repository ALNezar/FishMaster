// api.js
const DEV_MODE = true; // toggle to true for local development without backend

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

// Generate mock sensor data for a given time range
const generateMockSensorData = (timeRange, tankId) => {
  const now = new Date();
  let labels = [];
  let dataPoints = 0;
  
  switch (timeRange) {
    case '24h':
      dataPoints = 24;
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 3600000);
        labels.push(hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
      break;
    case '7d':
      dataPoints = 7;
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now - i * 86400000);
        labels.push(day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      }
      break;
    case '30d':
      dataPoints = 30;
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now - i * 86400000);
        labels.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      break;
    default:
      dataPoints = 24;
      for (let i = 23; i >= 0; i--) {
        labels.push(`${23-i}:00`);
      }
  }
  
  // Generate realistic fluctuating data
  const generateValues = (base, variance, min, max) => {
    return Array(dataPoints).fill(0).map((_, i) => {
      const noise = (Math.random() - 0.5) * variance;
      const trend = Math.sin(i / dataPoints * Math.PI) * (variance / 2);
      return Math.min(max, Math.max(min, base + noise + trend));
    });
  };

  return {
    temperature: {
      labels,
      values: generateValues(25, 2, 22, 28),
      target: 25,
      min: 20,
      max: 30,
    },
    ph: {
      labels,
      values: generateValues(7.2, 0.4, 6.5, 8.0),
      target: 7.0,
    },
    turbidity: {
      labels,
      values: generateValues(2, 2, 0, 6),
    },
    ammonia: {
      labels,
      values: generateValues(0.1, 0.15, 0, 0.4),
    },
    multiParam: {
      labels,
      temperature: generateValues(70, 15, 50, 90), // normalized
      ph: generateValues(75, 10, 60, 90), // normalized  
      ammonia: generateValues(80, 20, 40, 100), // normalized
    },
    summary: {
      optimal: 78,
      warning: 15,
      critical: 7,
    },
    currentReadings: {
      temperature: { value: 25.2, unit: '°C', status: 'optimal', trend: 'stable' },
      ph: { value: 7.1, unit: '', status: 'optimal', trend: 'rising' },
      turbidity: { value: 1.8, unit: 'NTU', status: 'optimal', trend: 'stable' },
      ammonia: { value: 0.08, unit: 'ppm', status: 'optimal', trend: 'falling' },
    },
    lastUpdated: now.toISOString(),
  };
};

// Mock fish types data
const mockFishTypes = [
  { id: 1, name: 'Goldfish', careLevel: 'Easy', minTankSize: 40, temperatureMin: 18, temperatureMax: 24, phMin: 6.5, phMax: 7.5 },
  { id: 2, name: 'Betta', careLevel: 'Medium', minTankSize: 10, temperatureMin: 24, temperatureMax: 28, phMin: 6.5, phMax: 7.5 },
  { id: 3, name: 'Guppy', careLevel: 'Easy', minTankSize: 20, temperatureMin: 22, temperatureMax: 28, phMin: 6.8, phMax: 7.8 },
  { id: 4, name: 'Neon Tetra', careLevel: 'Easy', minTankSize: 40, temperatureMin: 20, temperatureMax: 26, phMin: 6.0, phMax: 7.0 },
  { id: 5, name: 'Corydoras', careLevel: 'Easy', minTankSize: 40, temperatureMin: 22, temperatureMax: 26, phMin: 6.0, phMax: 8.0 },
  { id: 6, name: 'Angelfish', careLevel: 'Medium', minTankSize: 80, temperatureMin: 24, temperatureMax: 28, phMin: 6.0, phMax: 7.5 },
  { id: 7, name: 'Molly', careLevel: 'Easy', minTankSize: 40, temperatureMin: 22, temperatureMax: 28, phMin: 7.0, phMax: 8.5 },
  { id: 8, name: 'Platy', careLevel: 'Easy', minTankSize: 40, temperatureMin: 20, temperatureMax: 26, phMin: 7.0, phMax: 8.2 },
  { id: 9, name: 'Dwarf Gourami', careLevel: 'Medium', minTankSize: 40, temperatureMin: 22, temperatureMax: 28, phMin: 6.0, phMax: 7.5 },
  { id: 10, name: 'Cherry Shrimp', careLevel: 'Easy', minTankSize: 10, temperatureMin: 18, temperatureMax: 28, phMin: 6.5, phMax: 8.0 },
];

// In-memory mock tanks for DEV_MODE
let mockTanks = [
  { 
    id: 1, 
    name: 'Living Room Tank', 
    sizeLiters: 120, 
    fish: [
      { id: 1, name: 'Goldie', fishType: mockFishTypes[0] }, 
      { id: 2, name: 'Finn', fishType: mockFishTypes[2] }
    ], 
    waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.1, temperature: 25 } 
  },
  { 
    id: 2, 
    name: 'Betta Bowl', 
    sizeLiters: 20, 
    fish: [
      { id: 3, name: 'Blue', fishType: mockFishTypes[1] }
    ], 
    waterParameters: { targetPh: 7.2, targetTemperature: 26, ph: 7.0, temperature: 26 } 
  }
];
let nextFishId = 4;
let nextTankId = 3;

const apiRequest = async (endpoint, options = {}) => {
  if (DEV_MODE) {
    // Handle POST/PUT/DELETE for fish
    const fishAddMatch = endpoint.match(/^\/tanks\/(\d+)\/fish$/);
    const fishDeleteMatch = endpoint.match(/^\/tanks\/(\d+)\/fish\/(\d+)$/);
    
    if (fishAddMatch && options.method === 'POST') {
      const tankId = parseInt(fishAddMatch[1]);
      const tank = mockTanks.find(t => t.id === tankId);
      if (tank) {
        const fishData = JSON.parse(options.body);
        const fishType = mockFishTypes.find(ft => ft.id === fishData.fishTypeId);
        const newFish = {
          id: nextFishId++,
          name: fishData.name,
          fishType: fishType || null
        };
        tank.fish.push(newFish);
        return newFish;
      }
    }
    
    if (fishDeleteMatch && options.method === 'DELETE') {
      const tankId = parseInt(fishDeleteMatch[1]);
      const fishId = parseInt(fishDeleteMatch[2]);
      const tank = mockTanks.find(t => t.id === tankId);
      if (tank) {
        tank.fish = tank.fish.filter(f => f.id !== fishId);
        return null;
      }
    }
    
    // Handle tank creation
    if (endpoint === '/tanks' && options.method === 'POST') {
      const tankData = JSON.parse(options.body);
      const newTank = {
        id: nextTankId++,
        name: tankData.name,
        sizeLiters: parseInt(tankData.sizeLiters),
        fish: [],
        waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 }
      };
      mockTanks.push(newTank);
      return newTank;
    }
    
    // Handle tank deletion
    const tankDeleteMatch = endpoint.match(/^\/tanks\/(\d+)$/);
    if (tankDeleteMatch && options.method === 'DELETE') {
      const tankId = parseInt(tankDeleteMatch[1]);
      mockTanks = mockTanks.filter(t => t.id !== tankId);
      return null;
    }
    
    switch (endpoint) {
      case '/users/me':
        return { id: 1, username: 'Dev User', email: 'dev@fishmaster.app' };
      case '/api/onboarding/fish-types':
        return mockFishTypes;
      case '/api/onboarding/status':
        return { completed: true };
      case '/api/onboarding/complete':
        return { success: true };
      case '/tanks':
        return mockTanks;
      default:
        // Handle dynamic routes for mocks
        const tankMatch = endpoint.match(/^\/tanks\/(\d+)$/);
        if (tankMatch) {
          const tankId = parseInt(tankMatch[1]);
          return mockTanks.find(t => t.id === tankId) || mockTanks[0];
        }
        // Handle sensor data endpoints
        const sensorMatch = endpoint.match(/^\/tanks\/(\d+)\/sensors\?timeRange=(\w+)$/);
        if (sensorMatch) {
          return generateMockSensorData(sensorMatch[2], sensorMatch[1]);
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

// Fish endpoints
export const addFishToTank = async (tankId, fishData) => apiRequest(`/tanks/${tankId}/fish`, { method: 'POST', body: JSON.stringify(fishData) });
export const removeFishFromTank = async (tankId, fishId) => apiRequest(`/tanks/${tankId}/fish/${fishId}`, { method: 'DELETE' });
export const updateFish = async (tankId, fishId, fishData) => apiRequest(`/tanks/${tankId}/fish/${fishId}`, { method: 'PUT', body: JSON.stringify(fishData) });

// Sensor data endpoints
export const getSensorData = async (tankId, timeRange = '24h') => apiRequest(`/tanks/${tankId}/sensors?timeRange=${timeRange}`);

// Export apiRequest for direct use (backwards compatibility)
export { apiRequest };

export default { signup, verifyEmail, resendVerificationCode, login, logout, getFishTypes, getOnboardingStatus, completeOnboarding, getCurrentUser, updateProfile, deleteAccount, isAuthenticated, setToken, removeToken, getTanks, getTank, createTank, updateTank, deleteTank, addFishToTank, removeFishFromTank, updateFish, getSensorData, apiRequest };
