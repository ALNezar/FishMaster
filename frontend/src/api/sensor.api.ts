// Sensor data API endpoints

import { apiRequest } from './client';
import { SensorDataResponse } from './types';
import { fetchRecentTemperature } from './telemetry.api';
import { generateMockSensorData } from './mock/mockHandlers';

export const getSensorData = async (
  tankId: number | string,
  timeRange: '24h' | '7d' | '30d' = '24h'
): Promise<SensorDataResponse> => {
  // Determine how many recent readings to fetch based on time range
  const limitMap: Record<string, number> = {
    '24h': 288,
    '7d': 500,
    '30d': 500,
  };
  const limit = limitMap[timeRange] || 288;

  // Try to fetch real temperature data
  let realTemperature = null;
  try {
    const tankIdStr = typeof tankId === 'number' ? `tank${tankId}` : tankId;
    const readings = await fetchRecentTemperature(tankIdStr, limit);

    if (readings && readings.length > 0) {
      // Sort oldest to newest
      const sorted = [...readings].sort(
        (a, b) =>
          new Date(a.serverTimestamp).getTime() - new Date(b.serverTimestamp).getTime()
      );

      const labels = sorted.map((r) =>
        new Date(r.serverTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      const values = sorted.map((r) => Number(r.temperature));
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

  // Get mock data for other sensors and merge real temperature
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
