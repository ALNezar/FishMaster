// Telemetry and temperature streaming API endpoints

import { API_BASE_URL } from './config';
import { TemperatureReading } from './types';

export const fetchLatestTemperature = async (
  tankId: string = 'tank1'
): Promise<TemperatureReading | null> => {
  const res = await fetch(
    `${API_BASE_URL}/api/telemetry/temperature/latest?tankId=${encodeURIComponent(tankId)}`,
    { withCredentials: false }
  );

  if (!res.ok) throw new Error(`latest failed: ${res.status}`);
  return res.json();
};

export const fetchRecentTemperature = async (
  tankId: string = 'tank1',
  limit: number = 50
): Promise<TemperatureReading[]> => {
  const res = await fetch(
    `${API_BASE_URL}/api/telemetry/temperature/recent?tankId=${encodeURIComponent(tankId)}&limit=${limit}`,
    { withCredentials: false }
  );

  if (!res.ok) throw new Error(`recent failed: ${res.status}`);
  return res.json();
};
