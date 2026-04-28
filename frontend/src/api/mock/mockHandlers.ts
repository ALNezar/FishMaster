// Mock request handlers for development

import {
  mockUser,
  mockUserPassword,
  mockTanks,
  nextFishId,
  mockAlertThresholds,
  defaultAlertThresholds,
  mockFeedingSchedules,
  nextScheduleId,
  mockFeedingHistory,
  mockFishTypes,
  mockDeviceInfo,
  liveSensorState,
  defaultMockUser,
} from './mockData';
import { ApiRequestOptions } from '../types';

// Utility: add random variance to sensor values
function jitter(val: number, min: number, max: number, step: number = 0.2): number {
  const change = (Math.random() - 0.5) * step;
  let next = val + change;
  if (next < min) next = min + Math.abs(change);
  if (next > max) next = max - Math.abs(change);
  return Number(next.toFixed(2));
}

// Update live sensor state with jitter
function updateLiveState(): void {
  const prev = { ...liveSensorState };
  liveSensorState.temperature = jitter(liveSensorState.temperature, 22, 28, 0.25);
  liveSensorState.ph = jitter(liveSensorState.ph, 6.5, 8.0, 0.05);
  liveSensorState.turbidity = jitter(liveSensorState.turbidity, 0, 6, 0.15);

  liveSensorState.trend.temperature =
    liveSensorState.temperature > prev.temperature
      ? 'rising'
      : liveSensorState.temperature < prev.temperature
        ? 'falling'
        : 'stable';
  liveSensorState.trend.ph =
    liveSensorState.ph > prev.ph
      ? 'rising'
      : liveSensorState.ph < prev.ph
        ? 'falling'
        : 'stable';
  liveSensorState.trend.turbidity =
    liveSensorState.turbidity > prev.turbidity
      ? 'rising'
      : liveSensorState.turbidity < prev.turbidity
        ? 'falling'
        : 'stable';
}

// Generate mock sensor data
export function generateMockSensorData(timeRange: string, tankId: any): any {
  updateLiveState();

  const now = new Date();
  let labels: string[] = [];
  let dataPoints = 0;

  switch (timeRange) {
    case '24h':
      dataPoints = 24;
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now - i * 3600000);
        labels.push(
          hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
      }
      break;
    case '7d':
      dataPoints = 7;
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now - i * 86400000);
        labels.push(
          day.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        );
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

  const generateValues = (base: number, variance: number, min: number, max: number) =>
    Array(dataPoints)
      .fill(0)
      .map((_, i) => {
        const noise = (Math.random() - 0.5) * variance;
        const trend = Math.sin((i / dataPoints) * Math.PI) * (variance / 2);
        return Math.min(max, Math.max(min, base + noise + trend));
      });

  return {
    temperature: {
      labels,
      values: generateValues(liveSensorState.temperature, 2, 22, 28),
      target: 25,
      min: 20,
      max: 30,
    },
    ph: {
      labels,
      values: generateValues(liveSensorState.ph, 0.4, 6.5, 8.0),
      target: 7.0,
    },
    turbidity: {
      labels,
      values: generateValues(liveSensorState.turbidity, 2, 0, 6),
    },
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
      temperature: {
        value: liveSensorState.temperature,
        unit: '°C',
        status: 'optimal',
        trend: liveSensorState.trend.temperature,
      },
      ph: {
        value: liveSensorState.ph,
        unit: '',
        status: 'optimal',
        trend: liveSensorState.trend.ph,
      },
      turbidity: {
        value: liveSensorState.turbidity,
        unit: 'NTU',
        status: 'optimal',
        trend: liveSensorState.trend.turbidity,
      },
    },
    lastUpdated: now.toISOString(),
  };
}

// Main mock response handler
export const getMockResponse = (endpoint: string, options: any = {}): any => {
  const method = (options?.method || 'GET').toUpperCase();

  // Sensor endpoints
  const sensorMatch = endpoint.match(/^\/tanks\/(\d+)\/sensors/);
  if (sensorMatch) {
    const timeRangeMatch = endpoint.match(/timeRange=(\w+)/);
    const timeRange = timeRangeMatch ? timeRangeMatch[1] : '24h';
    return generateMockSensorData(timeRange, sensorMatch[1]);
  }

  // Add fish to tank - POST
  const addFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish$/);
  if (addFishMatch && method === 'POST') {
    const tankId = parseInt(addFishMatch[1]);
    let tank = mockTanks.find((t) => t.id === tankId);
    if (!tank) {
      tank = {
        id: tankId,
        name: `Tank ${tankId}`,
        sizeLiters: 100,
        fish: [],
        waterParameters: {
          targetPh: 7.0,
          targetTemperature: 25,
          ph: 7.0,
          temperature: 25,
        },
      };
      mockTanks.push(tank);
    }
    try {
      const fishData = options.body ? JSON.parse(options.body) : {};
      const fishTypeId = fishData.fishTypeId;
      let fishType = null;

      if (fishTypeId) {
        fishType =
          mockFishTypes.find((ft) => ft.id === fishTypeId) || mockFishTypes[0];
      }

      const newFish = {
        id: nextFishId++,
        name: fishData.name || 'New Fish',
        fishType: fishType || {
          name: 'Unknown',
          careLevel: 'beginner',
          minPh: 6.5,
          maxPh: 7.5,
          minTemp: 22,
          maxTemp: 28,
        },
      };
      tank.fish.push(newFish);
      return newFish;
    } catch (e) {
      return { error: 'Invalid fish data' };
    }
  }

  // Remove fish from tank - DELETE
  const removeFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish\/(\d+)$/);
  if (removeFishMatch && method === 'DELETE') {
    const tankId = parseInt(removeFishMatch[1]);
    const fishId = parseInt(removeFishMatch[2]);
    const tank = mockTanks.find((t) => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };
    const fishIndex = tank.fish.findIndex((f) => f.id === fishId);
    if (fishIndex === -1) return { error: 'Fish not found' };
    tank.fish.splice(fishIndex, 1);
    return { success: true };
  }

  // Update fish - PUT
  const updateFishMatch = endpoint.match(/^\/tanks\/(\d+)\/fish\/(\d+)$/);
  if (updateFishMatch && method === 'PUT') {
    const tankId = parseInt(updateFishMatch[1]);
    const fishId = parseInt(updateFishMatch[2]);
    const tank = mockTanks.find((t) => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };
    const fish = tank.fish.find((f) => f.id === fishId);
    if (!fish) return { error: 'Fish not found' };
    try {
      const updates = options.body ? JSON.parse(options.body) : {};
      Object.assign(fish, updates);
      return fish;
    } catch (e) {
      return { error: 'Invalid fish data' };
    }
  }

  // Get tank detail - GET
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'GET') {
    const tankId = parseInt(endpoint.split('/')[2]);
    let tank = mockTanks.find((t) => t.id === tankId);
    if (!tank) {
      tank = {
        id: tankId,
        name: `Tank ${tankId}`,
        sizeLiters: 100,
        fish: [],
        waterParameters: {
          targetPh: 7.0,
          targetTemperature: 25,
          ph: 7.0,
          temperature: 25,
        },
      };
      mockTanks.push(tank);
    }
    return tank;
  }

  // Update tank - PUT
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'PUT') {
    const tankId = parseInt(endpoint.split('/')[2]);
    const tank = mockTanks.find((t) => t.id === tankId);
    if (!tank) return { error: 'Tank not found' };
    try {
      const updates = options.body ? JSON.parse(options.body) : {};
      Object.assign(tank, updates);
      return tank;
    } catch (e) {
      return { error: 'Invalid tank data' };
    }
  }

  // Delete tank - DELETE
  if (endpoint.match(/^\/tanks\/\d+$/) && method === 'DELETE') {
    const tankId = parseInt(endpoint.split('/')[2]);
    const index = mockTanks.findIndex((t) => t.id === tankId);
    if (index === -1) return { error: 'Tank not found' };
    mockTanks.splice(index, 1);
    return { success: true };
  }

  // User profile - /users/me
  if (endpoint === '/users/me') {
    if (method === 'PUT') {
      try {
        const body = options.body ? JSON.parse(options.body) : {};
        Object.assign(mockUser, body);
      } catch (e) {}
      return mockUser;
    }
    if (method === 'DELETE') {
      Object.assign(mockUser, defaultMockUser);
      return { success: true };
    }
    return mockUser;
  }

  // Login endpoint
  if (endpoint === '/auth/login' && method === 'POST') {
    try {
      const body = options.body ? JSON.parse(options.body) : {};
      const { email, password } = body;

      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const emailMatch = email.trim().toLowerCase() === mockUser.email.toLowerCase();
      const passwordMatch = password === mockUserPassword;

      if (!emailMatch || !passwordMatch) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const { ...safeUser } = mockUser;
      return { token: 'dev-token', user: safeUser };
    } catch (e: any) {
      throw e;
    }
  }

  // Fish types
  if (endpoint === '/api/onboarding/fish-types') {
    return [
      {
        id: 1,
        name: 'Goldfish',
        careLevel: 'Easy',
        minTankSize: 75,
        temperatureMin: 18,
        temperatureMax: 24,
        phMin: 6.5,
        phMax: 7.5,
      },
      {
        id: 2,
        name: 'Betta',
        careLevel: 'Easy',
        minTankSize: 10,
        temperatureMin: 24,
        temperatureMax: 28,
        phMin: 6.5,
        phMax: 7.5,
      },
      {
        id: 3,
        name: 'Guppy',
        careLevel: 'Easy',
        minTankSize: 20,
        temperatureMin: 22,
        temperatureMax: 28,
        phMin: 6.8,
        phMax: 7.8,
      },
      {
        id: 4,
        name: 'Neon Tetra',
        careLevel: 'Moderate',
        minTankSize: 40,
        temperatureMin: 20,
        temperatureMax: 26,
        phMin: 6.0,
        phMax: 7.0,
      },
      {
        id: 5,
        name: 'Angelfish',
        careLevel: 'Moderate',
        minTankSize: 100,
        temperatureMin: 24,
        temperatureMax: 28,
        phMin: 6.0,
        phMax: 7.5,
      },
    ];
  }

  if (endpoint === '/api/onboarding/status') return { completed: true };
  if (endpoint === '/api/onboarding/complete') return { success: true };
  if (endpoint === '/tanks') return mockTanks;

  // Alert thresholds - GET
  const getThresholdsMatch = endpoint.match(/^\/tanks\/(\d+)\/thresholds$/);
  if (getThresholdsMatch && method === 'GET') {
    const tankId = parseInt(getThresholdsMatch[1]);
    return mockAlertThresholds[tankId]
      ? { ...mockAlertThresholds[tankId] }
      : { ...defaultAlertThresholds };
  }

  // Alert thresholds - PUT
  if (getThresholdsMatch && method === 'PUT') {
    const tankId = parseInt(getThresholdsMatch[1]);
    try {
      const data = options.body ? JSON.parse(options.body) : {};
      mockAlertThresholds[tankId] = { ...data };
      return { success: true, ...data };
    } catch (e) {
      return { error: 'Invalid threshold data' };
    }
  }

  return null;
};
