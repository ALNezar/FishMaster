// Telemetry and temperature streaming API endpoints

import { apiRequest } from './client';
import { TemperatureReading } from './types';

export const fetchLatestTemperature = async (
  tankId: string = 'tank1'
): Promise<TemperatureReading | null> => {
  return apiRequest(
    `/api/telemetry/temperature/latest?tankId=${encodeURIComponent(tankId)}`
  );
};

export const fetchRecentTemperature = async (
  tankId: string = 'tank1',
  limit: number = 50
): Promise<TemperatureReading[]> => {
  return apiRequest(
    `/api/telemetry/temperature/recent?tankId=${encodeURIComponent(tankId)}&limit=${limit}`
  );
};
