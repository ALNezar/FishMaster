// api.js
import { useEffect, useRef, useState } from 'react';

const DEV_MODE = false; // toggle to true for local development without backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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

  const normalizeFishType = (fishType) => {
    if (!fishType) return { name: 'Unknown', careLevel: 'Easy' };
    const toNumber = (val) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) return parseFloat(val) || 0;
      return parseFloat(val) || 0;
    };
    let estimatedMinTankSize = 40;
    if (fishType.careLevel) {
      const level = fishType.careLevel.toLowerCase();
      if (level === 'beginner' || level === 'easy') estimatedMinTankSize = 20;
      else if (level === 'intermediate' || level === 'moderate' || level === 'medium') estimatedMinTankSize = 40;
      else if (level === 'advanced' || level === 'hard' || level === 'expert') estimatedMinTankSize = 75;
    }
    return {
      id: fishType.id,
      name: fishType.name || 'Unknown',
      careLevel: fishType.careLevel || 'Easy',
      phMin: toNumber(fishType.phMin || fishType.minPh),
      phMax: toNumber(fishType.phMax || fishType.maxPh),
      temperatureMin: toNumber(fishType.temperatureMin || fishType.minTemp),
      temperatureMax: toNumber(fishType.temperatureMax || fishType.maxTemp),
      minTankSize: toNumber(fishType.minTankSize) || estimatedMinTankSize,
      description: fishType.description || ''
    };
  };

  if (endpoint.match(/^\/tanks\/\d+$/) && data.fish) {
    data.fish = data.fish.map(fish => ({
      id: fish.id,
      name: fish.name || 'Unnamed Fish',
      fishType: normalizeFishType(fish.fishType),
      createdAt: fish.createdAt
    }));
    if (!data.waterParameters) {
      data.waterParameters = { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 };
    }
  }

  if (endpoint.includes('/fish-types') && Array.isArray(data)) {
    return data.map(fishType => normalizeFishType(fishType));
  }

  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && data.fishType) {
    return {
      id: data.id,
      name: data.name || 'Unnamed Fish',
      fishType: normalizeFishType(data.fishType),
      createdAt: data.createdAt
    };
  }

  if (endpoint.match(/^\/tanks\/\d+\/fish$/) && data.id && !data.fishType) {
    console.warn('Backend returned fish without fishType, fetching tank to get full data');
    return data;
  }

  return data;
};

// ============================================================
// LIVE TEMPERATURE SSE HOOK (real backend telemetry)
// ============================================================

/**
 * React hook – subscribe to live temperature from the real backend SSE stream.
 * Usage:  const { lastReading, connected } = useTemperatureStream();
 */
export function useTemperatureStream() {
  const [lastReading, setLastReading] = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    const url = `${API_BASE_URL}/api/telemetry/temperature/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener('temperature', (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // data: { id, tankId, temperature, deviceTimestamp?, serverTimestamp }
        setLastReading(data);
      } catch (e) {
        console.warn('Bad SSE payload', e);
      }
    });

    return () => es.close();
  }, []);

  return { lastReading, connected };
}

// REST helpers for real telemetry data
export const fetchLatestTemperature = async (tankId = 'tank1') => {
  const res = await fetch(`${API_BASE_URL}/api/telemetry/temperature/latest?tankId=${encodeURIComponent(tankId)}`);
  if (!res.ok) throw new Error(`latest failed: ${res.status}`);
  return res.json(); // TemperatureReading | null
};

export const fetchRecentTemperature = async (tankId = 'tank1', limit = 50) => {
  const res = await fetch(`${API_BASE_URL}/api/telemetry/temperature/recent?tankId=${encodeURIComponent(tankId)}&limit=${limit}`);
  if (!res.ok) throw new Error(`recent failed: ${res.status}`);
  return res.json(); // TemperatureReading[]
};

// --- Live Sensor Data Simulation State (temperature & ph only now) ---
const _liveSensorState = {
  temperature: 25.2,
  ph: 7.1,
  turbidity: 3.8,
  trend: {
    temperature: 'stable',
    ph: 'rising',
    turbidity: 'stable',
  },
};

// --- Simple in-memory mock user ---
const _defaultMockUser = {
  id: 1,
  username: 'devuser',
  name: 'Dev User',
  email: 'dev@fishmaster.app',
  // DEV_MODE password for local testing
  _password: 'password',
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

let _mockAlertThresholds = {
  1: {
    globalAlertsEnabled: true,
    emailAlertsEnabled: true,
    inAppAlertsEnabled: true,
    temperature: { enabled: true, min: 22, max: 28 },
    ph: { enabled: true, min: 6.5, max: 7.5 },
    turbidity: { enabled: true, max: 5 },
  },
  2: {
    globalAlertsEnabled: true,
    emailAlertsEnabled: false,
    inAppAlertsEnabled: true,
    temperature: { enabled: true, min: 24, max: 28 },
    ph: { enabled: true, min: 6.5, max: 7.5 },
    turbidity: { enabled: false, max: 5 },
  },
};

const _defaultThresholds = {
  globalAlertsEnabled: true,
  emailAlertsEnabled: true,
  inAppAlertsEnabled: true,
  temperature: { enabled: true, min: 22, max: 28 },
  ph: { enabled: true, min: 6.5, max: 7.5 },
  turbidity: { enabled: true, max: 5 },
};

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

  _liveSensorState.trend.temperature = _liveSensorState.temperature > prev.temperature ? 'rising' : _liveSensorState.temperature < prev.temperature ? 'falling' : 'stable';
  _liveSensorState.trend.ph = _liveSensorState.ph > prev.ph ? 'rising' : _liveSensorState.ph < prev.ph ? 'falling' : 'stable';
  _liveSensorState.trend.turbidity = _liveSensorState.turbidity > prev.turbidity ? 'rising' : _liveSensorState.turbidity < prev.turbidity ? 'falling' : 'stable';
}

// Sensor data now only includes temperature, ph, turbidity (ammonia removed — no hardware sensor)
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
      for (let i = 23; i >= 0; i--) labels.push(`${23 - i}:00`);
  }

  const generateValues = (base, variance, min, max) =>
    Array(dataPoints).fill(0).map((_, i) => {
      const noise = (Math.random() - 0.5) * variance;
      const trend = Math.sin(i / dataPoints * Math.PI) * (variance / 2);
      return Math.min(max, Math.max(min, base + noise + trend));
    });

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
    // ammonia removed — no live sensor; use manual test kits
    multiParam: {
      labels,
      temperature: generateValues(70, 15, 50, 90),
      ph: generateValues(75, 10, 60, 90),
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
    },
    lastUpdated: now.toISOString(),
  };
};

const getMockResponse = (endpoint, options = {}) => {
  const method = options && options.method ? options.method.toUpperCase() : 'GET';

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
    const tankId = parseInt(addFishMatch[1]);
    let tank = _mockTanks.find(t => t.id === tankId);
    if (!tank) {
      tank = { id: tankId, name: `Tank ${tankId}`, sizeLiters: 100, fish: [], waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 } };
      _mockTanks.push(tank);
    }
    try {
      const fishData = options.body ? JSON.parse(options.body) : {};
      const fishTypeId = fishData.fishTypeId;
      let fishType = null;
      if (fishTypeId) {
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
      return newFish;
    } catch (e) {
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
    if (!tank) {
      tank = { id: tankId, name: `Tank ${tankId}`, sizeLiters: 100, fish: [], waterParameters: { targetPh: 7.0, targetTemperature: 25, ph: 7.0, temperature: 25 } };
      _mockTanks.push(tank);
    }
    return tank;
  }

  // Tank update - PUT /tanks/:id
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

  // Tank delete - DELETE /tanks/:id
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'DELETE') {
    const tankId = parseInt(endpoint.split('/')[2]);
    const index = _mockTanks.findIndex(t => t.id === tankId);
    if (index === -1) return { error: 'Tank not found' };
    _mockTanks.splice(index, 1);
    return { success: true };
  }

  // /users/me
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

  // ============================================================
  // LOGIN — validate credentials, NEVER silently create accounts
  // ============================================================
  if (endpoint === '/auth/login' && method === 'POST') {
    try {
      const body = options.body ? JSON.parse(options.body) : {};
      const { email, password } = body;

      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      // Check credentials against mock user
      const emailMatch = email.trim().toLowerCase() === _mockUser.email.toLowerCase();
      const passwordMatch = password === _mockUser._password;

      if (!emailMatch || !passwordMatch) {
        // Return a structured error — apiRequest will throw this to the caller
        throw new Error('Invalid email or password. Please try again.');
      }

      const { _password, ...safeUser } = _mockUser;
      return { token: 'dev-token', user: safeUser };
    } catch (e) {
      throw e; // propagate so the login form can display the message
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

  if (endpoint === '/api/onboarding/status') return { completed: true };
  if (endpoint === '/api/onboarding/complete') return { success: true };
  if (endpoint === '/tanks') return _mockTanks;

  // Alert thresholds - GET /tanks/:id/thresholds
  const getThresholdsMatch = endpoint.match(/^\/tanks\/(\d+)\/thresholds$/);
  if (getThresholdsMatch && method === 'GET') {
    const tankId = parseInt(getThresholdsMatch[1]);
    return _mockAlertThresholds[tankId] ? { ...(_mockAlertThresholds[tankId]) } : { ..._defaultThresholds };
  }

  // Alert thresholds - PUT /tanks/:id/thresholds
  if (getThresholdsMatch && method === 'PUT') {
    const tankId = parseInt(getThresholdsMatch[1]);
    try {
      const data = options.body ? JSON.parse(options.body) : {};
      _mockAlertThresholds[tankId] = { ...data };
      return { success: true, ...data };
    } catch (e) {
      return { error: 'Invalid threshold data' };
    }
  }

  return null;
};

const apiRequest = async (endpoint, options = {}) => {
  if (DEV_MODE) {
    // getMockResponse may throw (e.g. login with wrong password) — let it propagate
    const mock = getMockResponse(endpoint, options);
    if (mock !== null) return mock;
    return {};
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createHeaders(options.includeAuth !== false, options.headers || {});
  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);
    if (response.status === 204) return null;

    if (!response.ok) {
      console.warn(`Backend returned ${response.status} for ${endpoint}. Attempting mock fallback...`);
      try {
        const fallback = getMockResponse(endpoint, config);
        if (fallback !== null && (!fallback.error || fallback.error === undefined)) {
          console.warn(`✓ Using mock fallback for ${endpoint}`);
          return fallback;
        }
      } catch (e) {
        console.error('Mock fallback failed:', e);
      }

      const contentType = response.headers.get('content-type');
      const rawText = await response.text();
      let data;
      if (contentType && contentType.includes('application/json') && rawText) {
        try { data = JSON.parse(rawText); } catch { data = rawText; }
      } else {
        data = rawText;
      }

      let errorMessage;
      if (typeof data === 'string' && data.length > 0) errorMessage = data;
      else if (typeof data === 'object' && data !== null) errorMessage = data.error || data.message || JSON.stringify(data);
      else errorMessage = `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    const rawText = await response.text();
    let data;
    if (contentType && contentType.includes('application/json') && rawText) {
      try { data = JSON.parse(rawText); } catch { data = rawText; }
    } else {
      data = rawText;
    }

    const tankDetailMatch = endpoint.match(/^\/tanks\/(\d+)$/);
    if (tankDetailMatch && data && data.fish) {
      const tankId = parseInt(tankDetailMatch[1]);
      const mockTank = _mockTanks.find(t => t.id === tankId);
      if (mockTank && mockTank.fish && mockTank.fish.length > 0) {
        const backendFishIds = new Set(data.fish.map(f => f.id));
        const mockOnlyFish = mockTank.fish.filter(f => !backendFishIds.has(f.id));
        if (mockOnlyFish.length > 0) {
          console.warn(`Merging ${mockOnlyFish.length} mock fish with backend data for tank ${tankId}`);
          data.fish = [...data.fish, ...mockOnlyFish];
        }
      }
    }

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
export const login = async (email, password) => {
  // Will throw if credentials are wrong — caller (login form) must catch and display the error
  const res = await apiRequest('/auth/login', { method: 'POST', includeAuth: false, body: JSON.stringify({ email, password }) });
  if (res.token) setToken(res.token);
  return res;
};
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

export const getSensorData = async (tankId, timeRange = '24h') => {
  // Determine how many recent readings to fetch based on time range
  const limitMap = { '24h': 288, '7d': 500, '30d': 500 };
  const limit = limitMap[timeRange] || 288;

  // Try to get real temperature data from the telemetry backend
  let realTemperature = null;
  try {
    const tankIdStr = typeof tankId === 'number' ? `tank${tankId}` : tankId;
    const readings = await fetchRecentTemperature(tankIdStr, limit);

    if (readings && readings.length > 0) {
      // Sort oldest → newest
      const sorted = [...readings].sort(
        (a, b) => new Date(a.serverTimestamp) - new Date(b.serverTimestamp)
      );

      const labels = sorted.map(r =>
        new Date(r.serverTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      const values = sorted.map(r => Number(r.temperature));
      const latest = values[values.length - 1];

      realTemperature = {
        labels,
        values,
        target: 25,
        min: 20,
        max: 30,
        currentValue: latest,
      };
    }
  } catch (e) {
    console.warn('Could not fetch real temperature telemetry, falling back to mock:', e);
  }

  // Get mock data for the rest (ph, turbidity) and merge real temperature in
  const mock = generateMockSensorData(timeRange, tankId);

  if (realTemperature) {
    const latestVal = realTemperature.currentValue;
    mock.temperature = realTemperature;
    mock.currentReadings.temperature = {
      value: latestVal,
      unit: '°C',
      status: latestVal < 22 || latestVal > 28 ? 'warning' : 'optimal',
      trend: 'stable',
    };
  }

  return mock;
};

export const getAlertThresholds = async (tankId) => apiRequest(`/tanks/${tankId}/thresholds`);
export const updateAlertThresholds = async (tankId, data) => apiRequest(`/tanks/${tankId}/thresholds`, { method: 'PUT', body: JSON.stringify(data) });

// ============================================
// DEVICE CONTROL MOCK DATA & ENDPOINTS
// ============================================

let _mockDeviceInfo = {
  id: 1,
  name: 'AquaSense Pro',
  status: 'online',
  firmwareVersion: 'v2.4.1',
  wifiNetwork: 'Home_Network_5G',
  ipAddress: '192.168.1.105',
  macAddress: 'A4:CF:12:8E:3B:9D',
  signalStrength: -45,
  cpuSpeed: 240,
  freeMemory: 142,
  totalMemory: 320,
  sensorInterval: 30,
  lastSync: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  uptime: 14 * 24 * 60 * 60 + 6 * 60 * 60,
  connectedTankId: 1,
  connectedTankName: 'Living Room Tank',
  features: {
    temperatureSensor: true,
    phSensor: true,
    turbiditySensor: true,
    // ammoniaSensor removed — no hardware sensor
    autoFeeder: true,
    waterLevelSensor: true,
  }
};

let _mockFeedingSchedules = [
  { id: 1, time: '08:00', portionSize: 'small', enabled: true, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], label: 'Morning Feed' },
  { id: 2, time: '13:00', portionSize: 'small', enabled: false, daysOfWeek: [0, 6], label: 'Weekend Lunch' },
  { id: 3, time: '18:30', portionSize: 'medium', enabled: true, daysOfWeek: [0, 1, 2, 3, 4, 5, 6], label: 'Evening Feed' },
];
let _nextScheduleId = 4;

// ============================================
// LEARNING HUB — ammonia section removed (no live sensor)
// ============================================

const LEARNING_PROGRESS_KEY = 'fishmaster_learning_progress_v1';

const _learningSections = [
  {
    id: 'temperature',
    title: 'Temperature Sensor',
    icon: 'temperature',
    sensorImage: '/sensor-temp.png',
    summary: 'Measures tank water warmth in °C or °F',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description: 'Thermometers (usually a probe submerged in the tank) measure how warm or cold the water is. Fish are cold-blooded—their metabolism, immunity, and digestion all depend on stable temperature. Most tropical freshwater fish need 24-26°C (75-79°F).',
        images: [
          { src: '/temp-probe-full.png', caption: 'Complete temperature probe assembly' },
          { src: '/temp-sensor-close.png', caption: 'Close-up of sensor tip' },
          { src: '/temp-reading-display.png', caption: 'How readings appear on FishMaster' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description: 'Look at the current value in Analytics or on the Dashboard card. Check the trend line—steady line = stable (good), wandering up or down = drifting (investigate heater or environment). Compare against your target range set during onboarding.',
        images: [
          { src: '/temp-reading-stable.png', caption: 'A stable, steady temperature line' },
          { src: '/temp-reading-drift.png', caption: 'Temperature drifting upward (action needed)' },
          { src: '/temp-dashboard-card.png', caption: 'Quick glance at current temp on Dashboard' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description: 'Most tropical fish: 24-26°C (75-79°F). Coldwater fish: 18-22°C (64-72°F). Discus: 26-28°C (79-82°F). Check your fish species in the app—safe range is shown to help.',
        images: [
          { src: '/temp-range-tropical.png', caption: 'Tropical fish Safe Zone' },
          { src: '/temp-range-coldwater.png', caption: 'Coldwater fish Safe Zone' },
          { src: '/temp-range-chart.png', caption: 'Full temperature range guide' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description: 'Heater stuck ON, broken thermostat, room is too warm, direct sunlight on tank, or electrical issue. High temp speeds up fish metabolism (fish breathe faster, need more oxygen). Stress, disease, and algae blooms follow quickly.',
        images: [
          { src: '/temp-high-heater.png', caption: 'Broken heater causing spike' },
          { src: '/temp-high-sunlight.png', caption: 'Window sunlight warming tank' },
          { src: '/temp-high-stress.png', caption: 'Fish stress symptoms from high temp' },
          { src: '/temp-high-fix-steps.png', caption: 'Quick steps to lower temperature' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description: 'Heater off or malfunctioning, room is cold, AC is too strong, or water change with unheated water added. Low temp slows everything—less feed uptake, weaker immunity, lethargy. Fish may pile at the surface or huddle on the bottom.',
        images: [
          { src: '/temp-low-heater-off.png', caption: 'Heater powered off or unplugged' },
          { src: '/temp-low-cold-room.png', caption: 'Cold room temperature impact' },
          { src: '/temp-low-behavior.png', caption: 'Fish behavior during low temp stress' },
          { src: '/temp-low-fix-steps.png', caption: 'How to safely warm the tank' },
        ],
      },
    ],
  },
  {
    id: 'ph',
    title: 'pH Sensor',
    icon: 'ph',
    sensorImage: '/sensor-ph.png',
    summary: 'Measures how acidic or alkaline your water is (0–14 scale)',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description: 'pH is the measure of acidity vs. alkalinity (0 = most acidic, 7 = neutral, 14 = most alkaline). Fish are sensitive to shifts. Most freshwater fish prefer neutral to slightly acidic (6.5–7.5). Small pH swings stress fish and damage gills.',
        images: [
          { src: '/ph-probe.png', caption: 'pH electrode probe' },
          { src: '/ph-scale.png', caption: 'pH scale explained (0–14)' },
          { src: '/ph-reading.png', caption: 'pH reading displayed in-app' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description: 'Check the numeric value (e.g., 7.2). Compare to your species target range (usually 6.5–7.5). If the trend line is climbing or dropping, your water is shifting—investigate decay (ammonia build-up), driftwood, or tap water changes.',
        images: [
          { src: '/ph-reading-safe.png', caption: 'Stable pH in Safe Zone' },
          { src: '/ph-reading-climbing.png', caption: 'pH trending upward (investigate)' },
          { src: '/ph-trend-7-day.png', caption: '7-day pH trend showing drift' },
          { src: '/ph-alert-high.png', caption: 'pH alert notification' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description: 'Neutral community fish: 6.8–7.2. Acidic-loving: 5.8–6.8 (e.g., tetras, discus). Alkaline-loving: 7.5–8.5 (e.g., cichlids). Check your tank profile to see your target range.',
        images: [
          { src: '/ph-range-acidic.png', caption: 'Acidic zone (5.5–6.5)' },
          { src: '/ph-range-neutral.png', caption: 'Neutral zone (6.8–7.2)' },
          { src: '/ph-range-alkaline.png', caption: 'Alkaline zone (7.5–8.5)' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description: 'Tap water is alkaline, gravel/rockwork leaches minerals, bacterial load is low (new tank), or water hasn\'t cycled properly. High pH stresses acidophilic fish and can cause gill burns, gasping behavior, and poor appetite.',
        images: [
          { src: '/ph-high-gravel.png', caption: 'Alkaline gravel raising pH' },
          { src: '/ph-high-tap-water.png', caption: 'Alkaline tap water impact' },
          { src: '/ph-high-fish-stress.png', caption: 'Fish showing stress from high pH' },
          { src: '/ph-high-fix-directions.png', caption: 'Lowering pH: natural methods' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low?',
        description: 'Driftwood or peat in substrate releasing tannins, decaying plant matter, bacterial urea accumulation, or acidic substrate. Low pH stresses alkaliphilic fish, reduces immune response, and can cause erosion of fish slime coat.',
        images: [
          { src: '/ph-low-driftwood.png', caption: 'Driftwood lowering pH (tannins)' },
          { src: '/ph-low-decay.png', caption: 'Decaying plants releasing acids' },
          { src: '/ph-low-buildup.png', caption: 'Bacterial waste acidifying water' },
          { src: '/ph-low-fix-directions.png', caption: 'Raising pH: rock additions, water change' },
        ],
      },
    ],
  },
  {
    id: 'turbidity',
    title: 'Turbidity Sensor',
    icon: 'turbidity',
    sensorImage: '/sensor-turbidity.png',
    summary: 'Measures water clarity (how cloudy or clear it is)',
    subsections: [
      {
        id: 'what-it-does',
        title: 'What It Does',
        description: 'Turbidity is water cloudiness caused by suspended particles (algae spores, bacteria, uneaten food, dead material). Lower turbidity = clearer water = healthier. High turbidity can reduce light penetration and oxygen, and strains fish gills. Measured in NTU (Nephelometric Turbidity Units).',
        images: [
          { src: '/turbidity-sensor.png', caption: 'Turbidity sensor probe' },
          { src: '/turbidity-clear.png', caption: 'Crystal-clear water (low turbidity)' },
          { src: '/turbidity-cloudy.png', caption: 'Cloudy water (high turbidity)' },
          { src: '/turbidity-reading.png', caption: 'Turbidity reading in app (NTU)' },
        ],
      },
      {
        id: 'how-to-read',
        title: 'How to Read It',
        description: 'Lower values = clearer water (better). Typical ranges: <1 NTU = crystal clear, 1–5 NTU = slightly hazy, >5 NTU = noticeably cloudy. Check if turbidity is creeping up—early sign of filter clogging, overfeeding, or bacterial bloom.',
        images: [
          { src: '/turbidity-reading-clear.png', caption: 'Low turbidity (good)' },
          { src: '/turbidity-reading-hazy.png', caption: 'Moderate turbidity (marginal)' },
          { src: '/turbidity-reading-cloudy.png', caption: 'High turbidity (action needed)' },
          { src: '/turbidity-trend-rising.png', caption: 'Turbidity trend climbing over 7 days' },
        ],
      },
      {
        id: 'ranges',
        title: 'Normal Ranges',
        description: 'Target: <1–2 NTU. Acceptable: 1–4 NTU. Concerning: >4 NTU (indicates filter stress or overload). Brand-new tank (first week) may be 3–5 NTU as cycle establishes, then clears within 1–2 weeks.',
        images: [
          { src: '/turbidity-range-excellent.png', caption: 'Excellent clarity zone' },
          { src: '/turbidity-range-acceptable.png', caption: 'Acceptable range' },
          { src: '/turbidity-range-concerning.png', caption: 'Concerning turbidity levels' },
          { src: '/turbidity-new-tank-timeline.png', caption: 'How clarity improves over 2 weeks' },
        ],
      },
      {
        id: 'why-high',
        title: 'Why Is It High?',
        description: 'Overfeeding (uneaten particles decay), bacterial or algae bloom, filter clogged or needs priming, gravel stirred up during maintenance, new tank cycling, or excess decor waste.',
        images: [
          { src: '/turbidity-high-overfeeding.png', caption: 'Cloudiness from overfeeding' },
          { src: '/turbidity-high-bloom.png', caption: 'Bacterial/algae bloom example' },
          { src: '/turbidity-high-clogged-filter.png', caption: 'Clogged filter causing cloudiness' },
          { src: '/turbidity-high-fix-steps.png', caption: 'Steps to clear cloudy water' },
        ],
      },
      {
        id: 'why-low',
        title: 'Why Is It Low',
        description: 'Excellent! Filter is working well, feeding quantity is right, no algae or bacterial bloom, and water changes are regular. Maintain it by feeding carefully, cleaning the filter periodically, and doing weekly water changes.',
        images: [
          { src: '/turbidity-low-perfect.png', caption: 'Ideal crystal-clear tank' },
          { src: '/turbidity-low-maintenance.png', caption: 'Maintenance routine that keeps it clear' },
          { src: '/turbidity-low-comparison.png', caption: 'Before/after filter cleaning' },
          { src: '/turbidity-low-tips.png', caption: 'Tips to maintain low turbidity' },
        ],
      },
    ],
  },
  // Ammonia section removed — FishMaster has no live ammonia sensor.
  // Users should use manual test kits and log results in their maintenance notes.
];

const _getLearningProgress = () => {
  const fallback = { viewedSectionIds: [], lastViewedSection: null };
  try {
    const raw = localStorage.getItem(LEARNING_PROGRESS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

const _saveLearningProgress = (progress) => {
  localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
  return progress;
};

export const getLearningSections = async () => {
  await new Promise(resolve => setTimeout(resolve, 120));
  return _learningSections.map(section => ({
    id: section.id,
    title: section.title,
    icon: section.icon,
    sensorImage: section.sensorImage,
    summary: section.summary,
    subsectionCount: section.subsections.length,
  }));
};

export const getLearningSection = async (sectionId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const section = _learningSections.find(s => s.id === sectionId);
  if (!section) return null;
  const progress = _getLearningProgress();
  if (!progress.viewedSectionIds.includes(sectionId)) progress.viewedSectionIds.push(sectionId);
  progress.lastViewedSection = sectionId;
  _saveLearningProgress(progress);
  return section;
};

export const getLearningProgress = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const progress = _getLearningProgress();
  const totalSections = _learningSections.length;
  const viewedCount = progress.viewedSectionIds.length;
  const completionRate = totalSections === 0 ? 0 : Math.round((viewedCount / totalSections) * 100);
  return { ...progress, totalSections, viewedCount, completionRate };
};

// Mock feeding history
const _mockFeedingHistory = [
  { id: 1, time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), portionSize: 'medium', status: 'completed', type: 'scheduled', scheduleName: 'Evening Feed' },
  { id: 2, time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), portionSize: 'small', status: 'completed', type: 'manual', scheduleName: null },
  { id: 3, time: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), portionSize: 'small', status: 'completed', type: 'scheduled', scheduleName: 'Morning Feed' },
  { id: 4, time: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), portionSize: 'medium', status: 'completed', type: 'scheduled', scheduleName: 'Evening Feed' },
  { id: 5, time: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(), portionSize: 'small', status: 'skipped', type: 'scheduled', scheduleName: 'Morning Feed' },
  { id: 6, time: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(), portionSize: 'medium', status: 'completed', type: 'scheduled', scheduleName: 'Evening Feed' },
  { id: 7, time: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), portionSize: 'small', status: 'completed', type: 'scheduled', scheduleName: 'Morning Feed' },
  { id: 8, time: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(), portionSize: 'large', status: 'completed', type: 'manual', scheduleName: null },
];

export const getDeviceInfo = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  _mockDeviceInfo.lastSync = new Date(Date.now() - Math.floor(Math.random() * 5) * 60 * 1000).toISOString();
  _mockDeviceInfo.uptime += 1;
  return { ..._mockDeviceInfo };
};

export const updateDeviceInfo = async (updates) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  _mockDeviceInfo = { ..._mockDeviceInfo, ...updates };
  return { ..._mockDeviceInfo };
};

export const getFeedingSchedules = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [..._mockFeedingSchedules];
};

export const createFeedingSchedule = async (schedule) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newSchedule = { id: _nextScheduleId++, ...schedule, enabled: schedule.enabled ?? true };
  _mockFeedingSchedules.push(newSchedule);
  return newSchedule;
};

export const updateFeedingSchedule = async (scheduleId, updates) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = _mockFeedingSchedules.findIndex(s => s.id === scheduleId);
  if (index === -1) throw new Error('Schedule not found');
  _mockFeedingSchedules[index] = { ..._mockFeedingSchedules[index], ...updates };
  return _mockFeedingSchedules[index];
};

export const deleteFeedingSchedule = async (scheduleId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = _mockFeedingSchedules.findIndex(s => s.id === scheduleId);
  if (index === -1) throw new Error('Schedule not found');
  _mockFeedingSchedules.splice(index, 1);
  return { success: true };
};

export const triggerManualFeeding = async (portionSize = 'medium') => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newEntry = { id: _mockFeedingHistory.length + 1, time: new Date().toISOString(), portionSize, status: 'completed', type: 'manual', scheduleName: null };
  _mockFeedingHistory.unshift(newEntry);
  return newEntry;
};

export const getFeedingHistory = async (limit = 10) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return _mockFeedingHistory.slice(0, limit);
};

export const reconnectDevice = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  _mockDeviceInfo.status = 'online';
  _mockDeviceInfo.lastSync = new Date().toISOString();
  return { success: true, status: 'online' };
};

export const getLearningPaths = async () => {
  await new Promise(resolve => setTimeout(resolve, 120));
  return getLearningSections();
};

export const getLessons = async (pathId = null) => {
  await new Promise(resolve => setTimeout(resolve, 120));
  return [];
};

export const getLesson = async (lessonId) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return null;
};

export const completeLesson = async (lessonId) => {
  await new Promise(resolve => setTimeout(resolve, 80));
  return getLearningProgress();
};

export const getRecommendedLessons = async () => [];

export { apiRequest };

export default {
  signup, verifyEmail, resendVerificationCode, login, logout,
  getFishTypes, getOnboardingStatus, completeOnboarding,
  getCurrentUser, updateProfile, deleteAccount,
  isAuthenticated, setToken, removeToken,
  getTanks, getTank, createTank, updateTank, deleteTank,
  addFishToTank, removeFishFromTank, updateFish,
  getSensorData, getAlertThresholds, updateAlertThresholds,
  getDeviceInfo, updateDeviceInfo,
  getFeedingSchedules, createFeedingSchedule, updateFeedingSchedule, deleteFeedingSchedule,
  triggerManualFeeding, getFeedingHistory, reconnectDevice,
  getLearningSections, getLearningSection, getLearningProgress,
  getLearningPaths, getLessons, getLesson, completeLesson, getRecommendedLessons,
  fetchLatestTemperature, fetchRecentTemperature, useTemperatureStream,
  apiRequest,
};