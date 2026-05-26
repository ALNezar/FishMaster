// Telemetry API endpoints

import { apiRequest } from './client';
import {
  PhReading,
  TemperatureReading,
  TurbidityReading,
  TelemetryKind,
} from './types';

export const fetchLatestTelemetry = async <T = TemperatureReading | TurbidityReading>(
  kind: TelemetryKind,
  tankId: string = 'tank1'
): Promise<T | null> => {
  return apiRequest(
    `/api/telemetry/${kind}/latest?tankId=${encodeURIComponent(tankId)}`
  );
};

export const fetchRecentTelemetry = async <T = TemperatureReading | TurbidityReading>(
  kind: TelemetryKind,
  tankId: string = 'tank1',
  limit: number = 50
): Promise<T[]> => {
  return apiRequest(
    `/api/telemetry/${kind}/recent?tankId=${encodeURIComponent(tankId)}&limit=${limit}`
  );
};

export const fetchLatestTemperature = async (
  tankId: string = 'tank1'
): Promise<TemperatureReading | null> => {
  return fetchLatestTelemetry<TemperatureReading>('temperature', tankId);
};

export const fetchRecentTemperature = async (
  tankId: string = 'tank1',
  limit: number = 50
): Promise<TemperatureReading[]> => {
  return fetchRecentTelemetry<TemperatureReading>('temperature', tankId, limit);
};

export const fetchLatestTurbidity = async (
  tankId: string = 'tank1'
): Promise<TurbidityReading | null> => {
  return fetchLatestTelemetry<TurbidityReading>('turbidity', tankId);
};

export const fetchRecentTurbidity = async (
  tankId: string = 'tank1',
  limit: number = 50
): Promise<TurbidityReading[]> => {
  return fetchRecentTelemetry<TurbidityReading>('turbidity', tankId, limit);
};

export const fetchLatestPh = async (
  tankId: string = 'tank1'
): Promise<PhReading | null> => {
  return fetchLatestTelemetry<PhReading>('ph', tankId);
};

export const fetchRecentPh = async (
  tankId: string = 'tank1',
  limit: number = 50
): Promise<PhReading[]> => {
  return fetchRecentTelemetry<PhReading>('ph', tankId, limit);
};
