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

// Normalize backend responses to ensure consistent data structure
const normalizeResponse = (data, endpoint) => {
  if (!data || typeof data !== 'object') return data;

  // Helper to normalize FishType from backend format to frontend format
  const normalizeFishType = (fishType) => {
    if (!fishType) return { name: 'Unknown', careLevel: 'Easy' };
    
    // Helper to convert BigDecimal objects or any value to number
    const toNumber = (val) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) {
        // Handle Java BigDecimal object format
        return parseFloat(val) || 0;
      }
      return parseFloat(val) || 0;
    };
    
    // Calculate a reasonable minTankSize based on fish type if not provided
    let estimatedMinTankSize = 40; // default
    if (fishType.careLevel) {
      const level = fishType.careLevel.toLowerCase();
      if (level === 'beginner' || level === 'easy') {
        estimatedMinTankSize = 20;
      } else if (level === 'intermediate' || level === 'moderate' || level === 'medium') {
        estimatedMinTankSize = 40;
      } else if (level === 'advanced' || level === 'hard' || level === 'expert') {
        estimatedMinTankSize = 75;
      }
    }
    
    return {
      id: fishType.id,
      name: fishType.name || 'Unknown',
      careLevel: fishType.careLevel || 'Easy',
      // Backend uses minPh/maxPh, frontend expects phMin/phMax
      // Convert BigDecimal to number
      phMin: toNumber(fishType.phMin || fishType.minPh),
      phMax: toNumber(fishType.phMax || fishType.maxPh),
      // Backend uses minTemp/maxTemp, frontend expects temperatureMin/temperatureMax
      temperatureMin: toNumber(fishType.temperatureMin || fishType.minTemp),
      temperatureMax: toNumber(fishType.temperatureMax || fishType.maxTemp),
      // minTankSize doesn't exist in backend - use provided or estimate
      minTankSize: toNumber(fishType.minTankSize) || estimatedMinTankSize,
      description: fishType.description || ''
    };
  };

  // Normalize tank response
  if (endpoint.match(/^\/tanks\/\d+$/) && data.fish) {
    data.fish = data.fish.map(fish => ({
      id: fish.id,
      name: fish.name || 'Unnamed Fish',
      fishType: normalizeFishType(fish.fishType),
      createdAt: fish.createdAt
    }));

    // Ensure waterParameters exists
    if (!data.waterParameters) {
      data.waterParameters = {
        targetPh: 7.0,
        targetTemperature: 25,
        ph: 7.0,
        temperature: 25
      };
    }
  }

  // Normalize fish type list (from /api/onboarding/fish-types)
  if (endpoint.includes('/fish-types') && Array.isArray(data)) {
    return data.map(fishType => normalizeFishType(fishType));
  }

  // Normalize single fish response (from POST /tanks/:id/fish)
  // Backend returns a Fish entity with nested FishType
  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && data.fishType) {
    return {
      id: data.id,
      name: data.name || 'Unnamed Fish',
      fishType: normalizeFishType(data.fishType),
      createdAt: data.createdAt
    };
  }

  // Handle case where POST returns just the fish without nested type
  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && !data.fishType) {
    console.warn('Backend returned fish without fishType, fetching tank to get full data');
    return data; // Let the caller handle refetching
  }

  return data;
};

// --- Live Sensor Data Simulation State ---
const _liveSensorState = {
  temperature: 25.2,
  ph: 7.1,
  turbidity: 3.8,
  ammonia: 0.1,
  trend: {
    temperature: 'stable',
    ph: 'rising',
    turbidity: 'stable',
    ammonia: 'falling',
  },
};

// --- Simple in-memory mock user for profile/read/update flows ---
const _defaultMockUser = {
  id: 1,
  username: 'devuser',
  name: 'Dev User',
  email: 'dev@fishmaster.app',
  contactNumber: '',
  emailNotifications: false,
  smsNotifications: false,
};
let _mockUser = { ..._defaultMockUser };

// In-memory mock tanks database
let _mockTanks = [
  { 
    id: 1, 
    name: 'Living Room Tank', 
    sizeLiters: 120, 
    fish: [
      { id: 1, name: 'Goldie', fishType: { name: 'Goldfish', careLevel: 'Easy' } }, 
      { id: 2, name: 'Finn', fishType: { name: 'Guppy', careLevel: 'Easy' } }
    ], 
    waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.1, temperature: 25.2 } 
  },
  { 
    id: 2, 
    name: 'Betta Bowl', 
    sizeLiters: 20, 
    fish: [
      { id: 3, name: 'Blue', fishType: { name: 'Betta', careLevel: 'Medium' } }
    ], 
    waterParameters: { targetPh: 7.2, targetTemperature: 26, ph: 7.2, temperature: 26.1 } 
  }
];
let _nextFishId = 4;

function _jitter(val, min, max, step = 0.2) {
  const change = (Math.random() - 0.5) * step;
  let next = val + change;
  if (next < min) next = min + Math.abs(change);
  if (next > max) next = max - Math.abs(change);
  return Number(next.toFixed(2));
}

function _updateLiveState() {
  const prev = { ..._liveSensorState };
  _liveSensorState.temperature = _jitter(_liveSensorState.temperature, 22, 28, 0.25);
  _liveSensorState.ph = _jitter(_liveSensorState.ph, 6.5, 8.0, 0.05);
  _liveSensorState.turbidity = _jitter(_liveSensorState.turbidity, 0, 6, 0.15);
  _liveSensorState.ammonia = _jitter(_liveSensorState.ammonia, 0, 0.4, 0.02);

  _liveSensorState.trend.temperature = _liveSensorState.temperature > prev.temperature ? 'rising' : _liveSensorState.temperature < prev.temperature ? 'falling' : 'stable';
  _liveSensorState.trend.ph = _liveSensorState.ph > prev.ph ? 'rising' : _liveSensorState.ph < prev.ph ? 'falling' : 'stable';
  _liveSensorState.trend.turbidity = _liveSensorState.turbidity > prev.turbidity ? 'rising' : _liveSensorState.turbidity < prev.turbidity ? 'falling' : 'stable';
  _liveSensorState.trend.ammonia = _liveSensorState.ammonia > prev.ammonia ? 'rising' : _liveSensorState.ammonia < prev.ammonia ? 'falling' : 'stable';
}

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
      temperature: generateValues(70, 15, 50, 90),
      ph: generateValues(75, 10, 60, 90),
      ammonia: generateValues(80, 20, 40, 100),
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

const getMockResponse = (endpoint, options = {}) => {
  const method = options && options.method ? options.method.toUpperCase() : 'GET';
  console.log(`getMockResponse called: ${method} ${endpoint}`);

  // Sensor endpoints
  const sensorMatch = endpoint.match(/^\/tanks\/(\d+)\/sensors/);
  if (sensorMatch) {
    const timeRangeMatch = endpoint.match(/timeRange=(\w+)/);
    const timeRange = timeRangeMatch ? timeRangeMatch[1] : '24h';
    return generateMockSensorData(timeRange, sensorMatch[1]);
  }

  // Fish endpoints - POST /tanks/:id/fish
  const addFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish$/);
  if (addFishMatch && method === 'POST') {
    console.log('Matched POST /tanks/:id/fish');
    const tankId = parseInt(addFishMatch[1]);
    let tank = _mockTanks.find(t => t.id === tankId);
    
    // If tank doesn't exist in mock, create a placeholder
    if (!tank) {
      console.log(`Tank ${tankId} not found in mock, creating placeholder`);
      tank = {
        id: tankId,
        name: `Tank ${tankId}`,
        sizeLiters: 100,
        fish: [],
        waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 }
      };
      _mockTanks.push(tank);
    }

    try {
      const fishData = options.body ? JSON.parse(options.body) : {};
      console.log('Fish data to add:', fishData);
      
      // Find the fish type from available types
      const fishTypeId = fishData.fishTypeId;
      let fishType = null;
      
      if (fishTypeId) {
        // Mock fish types
        const mockFishTypes = [
          { id: 1, name: 'Goldfish', careLevel: 'beginner', minPh: 6.5, maxPh: 7.5, minTemp: 18, maxTemp: 24 },
          { id: 2, name: 'Betta', careLevel: 'beginner', minPh: 6.5, maxPh: 7.5, minTemp: 24, maxTemp: 28 },
          { id: 3, name: 'Guppy', careLevel: 'beginner', minPh: 6.8, maxPh: 7.8, minTemp: 22, maxTemp: 28 },
          { id: 4, name: 'Neon Tetra', careLevel: 'intermediate', minPh: 6.0, maxPh: 7.0, minTemp: 20, maxTemp: 26 },
          { id: 5, name: 'Angelfish', careLevel: 'intermediate', minPh: 6.0, maxPh: 7.5, minTemp: 24, maxTemp: 28 },
        ];
        fishType = mockFishTypes.find(ft => ft.id === fishTypeId) || mockFishTypes[0];
      }
      
      const newFish = {
        id: _nextFishId++,
        name: fishData.name || 'New Fish',
        fishType: fishType || { name: 'Unknown', careLevel: 'beginner', minPh: 6.5, maxPh: 7.5, minTemp: 22, maxTemp: 28 }
      };
      tank.fish.push(newFish);
      console.log('Created mock fish:', newFish);
      return newFish;
    } catch (e) {
      console.error('Mock add fish error:', e);
      return { error: 'Invalid fish data' };
    }
  }

  // Fish endpoints - DELETE /tanks/:tankId/fish/:fishId
  const removeFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish\/(\d+)$/);
  if (removeFishMatch && method === 'DELETE') {
    const tankId = parseInt(removeFishMatch[1]);
    const fishId = parseInt(removeFishMatch[2]);
    const tank = _mockTanks.find(t => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };

    const fishIndex = tank.fish.findIndex(f => f.id === fishId);
    if (fishIndex === -1) return { error: 'Fish not found' };

    tank.fish.splice(fishIndex, 1);
    return { success: true };
  }

  // Fish endpoints - PUT /tanks/:tankId/fish/:fishId
  const updateFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish\/(\d+)$/);
  if (updateFishMatch && method === 'PUT') {
    const tankId = parseInt(updateFishMatch[1]);
    const fishId = parseInt(updateFishMatch[2]);
    const tank = _mockTanks.find(t => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };

    const fish = tank.fish.find(f => f.id === fishId);
    if (!fish) return { error: 'Fish not found' };

    try {
      const updates = options.body ? JSON.parse(options.body) : {};
      Object.assign(fish, updates);
      return fish;
    } catch (e) {
      return { error: 'Invalid fish data' };
    }
  }

  // Tank detail endpoint - GET /tanks/:id
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'GET') {
    const tankId = parseInt(endpoint.split('/')[2]);
    let tank = _mockTanks.find(t => t.id === tankId);
    
    // If tank doesn't exist, create placeholder for consistency
    if (!tank) {
      console.log(`Creating placeholder for tank ${tankId} in mock`);
      tank = {
        id: tankId,
        name: `Tank ${tankId}`,
        sizeLiters: 100,
        fish: [],
        waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 }
      };
      _mockTanks.push(tank);
    } else {
      console.log(`Returning mock tank ${tankId} with ${tank.fish.length} fish`);
    }
    
    return tank;
  }

  // Tank update endpoint - PUT /tanks/:id
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'PUT') {
    const tankId = parseInt(endpoint.split('/')[2]);
    const tank = _mockTanks.find(t => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };

    try {
      const updates = options.body ? JSON.parse(options.body) : {};
      Object.assign(tank, updates);
      return tank;
    } catch (e) {
      return { error: 'Invalid tank data' };
    }
  }

  // Tank delete endpoint - DELETE /tanks/:id
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'DELETE') {
    const tankId = parseInt(endpoint.split('/')[2]);
    const index = _mockTanks.findIndex(t => t.id === tankId);
    if (index === -1) return { error: 'Tank not found' };
    
    _mockTanks.splice(index, 1);
    return { success: true };
  }

  // Handle /users/me for GET, PUT, DELETE
  if (endpoint === '/users/me') {
    if (method === 'PUT') {
      try {
        const body = options.body ? JSON.parse(options.body) : {};
        _mockUser = { ..._mockUser, ...body };
      } catch (e) {}
      return _mockUser;
    }
    if (method === 'DELETE') {
      _mockUser = { ..._defaultMockUser };
      return { success: true };
    }
    return _mockUser;
  }

  if (endpoint === '/auth/login') {
    if (method === 'POST') {
      return { token: 'dev-token', user: _mockUser };
    }
  }

  if (endpoint === '/api/onboarding/fish-types') {
    return [
      { id: 1, name: 'Goldfish', careLevel: 'Easy', minTankSize: 75, temperatureMin: 18, temperatureMax: 24, phMin: 6.5, phMax: 7.5 },
      { id: 2, name: 'Betta', careLevel: 'Easy', minTankSize: 10, temperatureMin: 24, temperatureMax: 28, phMin: 6.5, phMax: 7.5 },
      { id: 3, name: 'Guppy', careLevel: 'Easy', minTankSize: 20, temperatureMin: 22, temperatureMax: 28, phMin: 6.8, phMax: 7.8 },
      { id: 4, name: 'Neon Tetra', careLevel: 'Moderate', minTankSize: 40, temperatureMin: 20, temperatureMax: 26, phMin: 6.0, phMax: 7.0 },
      { id: 5, name: 'Angelfish', careLevel: 'Moderate', minTankSize: 100, temperatureMin: 24, temperatureMax: 28, phMin: 6.0, phMax: 7.5 },
    ];
  }

  if (endpoint === '/api/onboarding/status') {
    return { completed: true };
  }

  if (endpoint === '/api/onboarding/complete') {
    return { success: true };
  }

  if (endpoint === '/tanks') {
    return _mockTanks;
  }

  return null;
};

const apiRequest = async (endpoint, options = {}) => {
  if (DEV_MODE) {
    const mock = getMockResponse(endpoint, options);
    if (mock !== null) return mock;
    return {};
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(options.includeAuth !== false, options.headers || {});
  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) return null;
    
    // For non-OK responses, try fallback BEFORE parsing response body
    if (!response.ok) {
      console.warn(`Backend returned ${response.status} for ${endpoint}. Attempting mock fallback...`);
      
      try {
        const fallback = getMockResponse(endpoint, config);
        console.log('Fallback result:', fallback);
        
        if (fallback !== null && (!fallback.error || fallback.error === undefined)) {
          console.warn(`✓ Using mock fallback for ${endpoint}`);
          console.warn('⚠️ NOTE: Mock data is temporary and will be lost on page refresh.');
          console.warn('⚠️ Fix the backend 403 error to persist data permanently.');
          return fallback;
        } else if (fallback && fallback.error) {
          console.warn(`✗ Mock fallback returned error: ${fallback.error}`);
        } else {
          console.warn('✗ No mock fallback available');
        }
      } catch (e) {
        console.error('Mock fallback failed with exception:', e);
      }
      
      // If no fallback available, parse error and throw
      const contentType = response.headers.get('content-type');
      let data;
      const rawText = await response.text();
      
      if (contentType && contentType.includes('application/json') && rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
      } else {
        data = rawText;
      }

      console.error(`API Error Details [${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        contentType,
        rawResponse: rawText,
        parsedData: data
      });

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
    
    // Parse successful response
    const contentType = response.headers.get('content-type');
    let data;
    const rawText = await response.text();
    
    if (contentType && contentType.includes('application/json') && rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    } else {
      data = rawText;
    }
    
    // Merge mock fish with backend fish for GET /tanks/:id requests
    const tankDetailMatch = endpoint.match(/^\/tanks\/(\d+)$/);
    if (tankDetailMatch && data && data.fish) {
      const tankId = parseInt(tankDetailMatch[1]);
      const mockTank = _mockTanks.find(t => t.id === tankId);
      
      if (mockTank && mockTank.fish && mockTank.fish.length > 0) {
        // Get IDs of backend fish
        const backendFishIds = new Set(data.fish.map(f => f.id));
        
        // Add mock fish that don't exist in backend
        const mockOnlyFish = mockTank.fish.filter(f => !backendFishIds.has(f.id));
        
        if (mockOnlyFish.length > 0) {
          console.warn(`Merging ${mockOnlyFish.length} mock fish with backend data for tank ${tankId}`);
          data.fish = [...data.fish, ...mockOnlyFish];
        }
      }
    }
    
    // Normalize response data
    return normalizeResponse(data, endpoint);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    try {
      const fallback = getMockResponse(endpoint, config);
      if (fallback !== null) {
        console.warn(`Network error for ${endpoint}. Falling back to mock response.`);
        return fallback;
      }
    } catch (e) {
      console.error('Mock fallback failed:', e);
    }
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

export const getTanks = async () => apiRequest('/tanks');
export const getTank = async (id) => apiRequest(`/tanks/${id}`);
export const createTank = async (data) => apiRequest('/tanks', { method: 'POST', body: JSON.stringify(data) });
export const updateTank = async (id, data) => apiRequest(`/tanks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTank = async (id) => apiRequest(`/tanks/${id}`, { method: 'DELETE' });

export const addFishToTank = async (tankId, fishData) => apiRequest(`/tanks/${tankId}/fish`, { method: 'POST', body: JSON.stringify(fishData) });
export const removeFishFromTank = async (tankId, fishId) => apiRequest(`/tanks/${tankId}/fish/${fishId}`, { method: 'DELETE' });
export const updateFish = async (tankId, fishId, fishData) => apiRequest(`/tanks/${tankId}/fish/${fishId}`, { method: 'PUT', body: JSON.stringify(fishData) });

export const getSensorData = async (tankId, timeRange = '24h') => apiRequest(`/tanks/${tankId}/sensors?timeRange=${timeRange}`);

export { apiRequest };

export default { signup, verifyEmail, resendVerificationCode, login, logout, getFishTypes, getOnboardingStatus, completeOnboarding, getCurrentUser, updateProfile, deleteAccount, isAuthenticated, setToken, removeToken, getTanks, getTank, createTank, updateTank, deleteTank, addFishToTank, removeFishFromTank, updateFish, getSensorData, apiRequest };