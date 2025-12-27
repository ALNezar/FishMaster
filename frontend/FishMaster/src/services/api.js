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

// --- Live Sensor Data Simulation State ---
const _liveSensorState = {
  temperature: 25.2,
  ph: 7.1,
  turbidity: 3.8,
  ammonia: 1,
  trend: {
    temperature: 'stable',
    ph: 'rising',
    turbidity: 'stable',
    ammonia: 'falling',
  },
};

function _jitter(val, min, max, step = 0.2) {
  const change = (Math.random() - 0.5) * step;
  let next = val + change;
  if (next < min) next = min + Math.abs(change);
  if (next > max) next = max - Math.abs(change);
  return Number(next.toFixed(2));
}

function _updateLiveState() {
  // Simulate trending and random walk
  // Temperature: stable, but can rise/fall slowly
  const prev = { ..._liveSensorState };
  _liveSensorState.temperature = _jitter(_liveSensorState.temperature, 22, 28, 0.25);
  _liveSensorState.ph = _jitter(_liveSensorState.ph, 6.5, 8.0, 0.05);
  _liveSensorState.turbidity = _jitter(_liveSensorState.turbidity, 0, 6, 0.15);
  _liveSensorState.ammonia = _jitter(_liveSensorState.ammonia, 0, 0.4, 0.02);

  // Trend logic
  _liveSensorState.trend.temperature = _liveSensorState.temperature > prev.temperature ? 'rising' : _liveSensorState.temperature < prev.temperature ? 'falling' : 'stable';
  _liveSensorState.trend.ph = _liveSensorState.ph > prev.ph ? 'rising' : _liveSensorState.ph < prev.ph ? 'falling' : 'stable';
  _liveSensorState.trend.turbidity = _liveSensorState.turbidity > prev.turbidity ? 'rising' : _liveSensorState.turbidity < prev.turbidity ? 'falling' : 'stable';
  _liveSensorState.trend.ammonia = _liveSensorState.ammonia > prev.ammonia ? 'rising' : _liveSensorState.ammonia < prev.ammonia ? 'falling' : 'stable';
}

// Generate mock sensor data for a given time range, using live state for current values
const generateMockSensorData = (timeRange, tankId) => {
  _updateLiveState();
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

  // Generate realistic fluctuating data (simulate trend with live state as base)
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
      values: generateValues(_liveSensorState.temperature, 2, 22, 28),
      target: 25,
      min: 20,
      max: 30,
    },
    ph: {
      labels,
      values: generateValues(_liveSensorState.ph, 0.4, 6.5, 8.0),
      target: 7.0,
    },
    turbidity: {
      labels,
      values: generateValues(_liveSensorState.turbidity, 2, 0, 6),
    },
    ammonia: {
      labels,
      values: generateValues(_liveSensorState.ammonia, 0.15, 0, 0.4),
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
      temperature: { value: _liveSensorState.temperature, unit: '°C', status: 'optimal', trend: _liveSensorState.trend.temperature },
      ph: { value: _liveSensorState.ph, unit: '', status: 'optimal', trend: _liveSensorState.trend.ph },
      turbidity: { value: _liveSensorState.turbidity, unit: 'NTU', status: 'optimal', trend: _liveSensorState.trend.turbidity },
      ammonia: { value: _liveSensorState.ammonia, unit: 'ppm', status: 'optimal', trend: _liveSensorState.trend.ammonia },
    },
    lastUpdated: now.toISOString(),
  };
};

const apiRequest = async (endpoint, options = {}) => {
  if (DEV_MODE) {
    // Handle sensor data endpoints first (before switch)
    const sensorMatch = endpoint.match(/^\/tanks\/(\d+)\/sensors/);
    if (sensorMatch) {
      const timeRangeMatch = endpoint.match(/timeRange=(\w+)/);
      const timeRange = timeRangeMatch ? timeRangeMatch[1] : '24h';
      return generateMockSensorData(timeRange, sensorMatch[1]);
    }

    // Handle tank detail endpoint
    if (endpoint.match(/^\/tanks\/\d+$/)) {
      const tankId = parseInt(endpoint.split('/')[2]);
      return { 
        id: tankId, 
        name: tankId === 1 ? 'Living Room Tank' : 'Betta Bowl', 
        sizeLiters: tankId === 1 ? 120 : 20, 
        fish: tankId === 1 
          ? [{ id: 1, name: 'Goldie', fishType: { name: 'Goldfish', careLevel: 'Easy' } }, { id: 2, name: 'Finn', fishType: { name: 'Guppy', careLevel: 'Easy' } }] 
          : [{ id: 3, name: 'Blue', fishType: { name: 'Betta', careLevel: 'Medium' } }], 
        waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.1, temperature: 25.2 } 
      };
    }

    switch (endpoint) {
      case '/users/me':
        return { id: 1, username: 'Dev User', email: 'dev@fishmaster.app' };
      case '/api/onboarding/fish-types':
        return [
          { id: 1, name: 'Goldfish', careLevel: 'Easy', minTankSize: 75, temperatureMin: 18, temperatureMax: 24, phMin: 6.5, phMax: 7.5 },
          { id: 2, name: 'Betta', careLevel: 'Easy', minTankSize: 10, temperatureMin: 24, temperatureMax: 28, phMin: 6.5, phMax: 7.5 },
          { id: 3, name: 'Guppy', careLevel: 'Easy', minTankSize: 20, temperatureMin: 22, temperatureMax: 28, phMin: 6.8, phMax: 7.8 },
          { id: 4, name: 'Neon Tetra', careLevel: 'Moderate', minTankSize: 40, temperatureMin: 20, temperatureMax: 26, phMin: 6.0, phMax: 7.0 },
          { id: 5, name: 'Angelfish', careLevel: 'Moderate', minTankSize: 100, temperatureMin: 24, temperatureMax: 28, phMin: 6.0, phMax: 7.5 },
        ];
      case '/api/onboarding/status':
        return { completed: true };
      case '/api/onboarding/complete':
        return { success: true };
      case '/tanks':
        return [
          { id: 1, name: 'Living Room Tank', sizeLiters: 120, fish: [{ id: 1, name: 'Goldie' }, { id: 2, name: 'Finn' }], waterParameters: { targetPh: 7.0, targetTemperature: 25 } },
          { id: 2, name: 'Betta Bowl', sizeLiters: 20, fish: [{ id: 3, name: 'Blue' }], waterParameters: { targetPh: 7.2, targetTemperature: 26 } }
        ];
      default:
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
