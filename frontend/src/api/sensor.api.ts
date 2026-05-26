// Sensor data API endpoints

import { getTank } from './tank.api';
import { SensorDataResponse } from './types';
import {
  fetchRecentTemperature,
  fetchRecentTurbidity,
  fetchLatestTurbidity,
  fetchRecentPh,
  fetchLatestPh,
} from './telemetry.api';

const buildEmptySeries = (labels: string[]) => labels.map(() => 0);

const sanitizePhValue = (value: unknown, fallback?: unknown, defaultValue = 7): number => {
  const candidates = [value, fallback, defaultValue];

  for (const candidate of candidates) {
    const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 14) {
      return parsed;
    }
  }

  return defaultValue;
};

export const getSensorData = async (
  tankId: number | string,
  timeRange: '24h' | '7d' | '30d' = '24h'
): Promise<SensorDataResponse> => {
  const limitMap: Record<string, number> = {
    '24h': 50,
    '7d': 500,
    '30d': 500,
  };
  const limit = limitMap[timeRange] || 288;

  const tankNumericId = typeof tankId === 'number' ? tankId : Number(String(tankId).replace(/\D/g, ''));
  const resolvedTankId = Number.isFinite(tankNumericId) && tankNumericId > 0 ? tankNumericId : 1;

  let tank = null;
  try {
    tank = await getTank(resolvedTankId);
  } catch (e) {
    console.warn('Could not fetch tank details:', e);
  }

  const tankIdStr = typeof tankId === 'number' ? `tank${tankId}` : String(tankId);
  const telemetryTankIds = Array.from(new Set([tankIdStr, 'tank1']));

  let temperatureSeries = null;
  try {
    for (const telemetryTankId of telemetryTankIds) {
      const readings = await fetchRecentTemperature(telemetryTankId, limit);
      if (!readings || readings.length === 0) continue;

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

      temperatureSeries = {
        labels,
        values,
        target: 25,
        min: 20,
        max: 30,
        currentValue: latest,
      };

      break;
    }
  } catch (e) {
    console.warn('Could not fetch real temperature telemetry:', e);
  }

  let turbiditySeries = null;
  try {
    for (const telemetryTankId of telemetryTankIds) {
      const readings = await fetchRecentTurbidity(telemetryTankId, limit);
      if (!readings || readings.length === 0) continue;

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
      const values = sorted.map((r) => Number(r.ntu));
      const latest = values[values.length - 1];

      turbiditySeries = {
        labels,
        values,
        currentValue: latest,
      };

      break;
    }
  } catch (e) {
    console.warn('Could not fetch real turbidity telemetry:', e);
  }

  let latestTurbidityReading = null;
  try {
    for (const telemetryTankId of telemetryTankIds) {
      const reading = await fetchLatestTurbidity(telemetryTankId);
      if (!reading) continue;

      latestTurbidityReading = reading;
      break;
    }
  } catch (e) {
    console.warn('Could not fetch latest turbidity telemetry:', e);
  }

  const temperatureValues = temperatureSeries?.values ?? buildEmptySeries([]);
  let phSeries = null;
  try {
    for (const telemetryTankId of telemetryTankIds) {
      const readings = await fetchRecentPh(telemetryTankId, limit);
      if (!readings || readings.length === 0) continue;

      const sorted = [...readings].sort(
        (a, b) =>
          new Date(a.serverTimestamp).getTime() - new Date(b.serverTimestamp).getTime()
      );

      const phLabels = sorted.map((r) =>
        new Date(r.serverTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      const phValues = sorted.map((r) => sanitizePhValue(r.ph, tank?.waterParameters?.targetPh, 7));
      const latestPh = phValues[phValues.length - 1];

      phSeries = {
        labels: phLabels,
        values: phValues,
        currentValue: latestPh,
      };

      break;
    }
  } catch (e) {
    console.warn('Could not fetch real pH telemetry:', e);
  }

  let latestPhReading = null;
  try {
    for (const telemetryTankId of telemetryTankIds) {
      const reading = await fetchLatestPh(telemetryTankId);
      if (!reading) continue;

      latestPhReading = reading;
      break;
    }
  } catch (e) {
    console.warn('Could not fetch latest pH telemetry:', e);
  }

  const pHValue = sanitizePhValue(
    latestPhReading?.ph ?? phSeries?.currentValue,
    tank?.waterParameters?.targetPh,
    7
  );
  const temperatureTarget = tank?.waterParameters?.targetTemperature ?? 25;
  const labels = temperatureSeries?.labels ?? phSeries?.labels ?? turbiditySeries?.labels ?? [];
  const turbidityValues = turbiditySeries?.values ?? buildEmptySeries(labels);
  const phValues = phSeries?.values ?? buildEmptySeries(labels).map(() => pHValue);
  const latestTemperature = temperatureSeries?.currentValue ?? temperatureTarget;
  const latestTurbidity = Number(latestTurbidityReading?.ntu ?? turbiditySeries?.currentValue ?? 0);
  const temperatureStatus = latestTemperature < 22 || latestTemperature > 28 ? 'warning' : 'optimal';
  const phStatus = pHValue < 6.5 || pHValue > 7.5 ? 'warning' : 'optimal';
  const turbidityStatus = latestTurbidity > 5 ? 'warning' : 'optimal';
  const statuses = [temperatureStatus, phStatus, turbidityStatus];
  const optimalCount = statuses.filter((status) => status === 'optimal').length;
  const warningCount = statuses.filter((status) => status === 'warning').length;
  const criticalCount = statuses.filter((status) => status === 'critical').length;

  return {
    temperature: {
      labels,
      values: temperatureValues,
      target: temperatureTarget,
      min: 20,
      max: 30,
      currentValue: latestTemperature,
    },
    ph: {
      labels,
      values: phValues,
      target: tank?.waterParameters?.targetPh ?? 7,
      currentValue: pHValue,
    },
    turbidity: {
      labels,
      values: turbidityValues,
      currentValue: latestTurbidity,
    },
    multiParam: {
      labels,
      temperature: temperatureValues,
      ph: phValues,
      turbidity: turbidityValues,
    },
    currentReadings: {
      temperature: {
        value: latestTemperature,
        unit: '°C',
        status: temperatureStatus,
        trend: 'stable',
      },
      ph: {
        value: pHValue,
        unit: '',
        status: phStatus,
        trend: 'stable',
      },
      turbidity: {
        value: latestTurbidity,
        unit: 'NTU',
        status: turbidityStatus,
        trend: 'stable',
      },
    },
    lastUpdated: new Date().toISOString(),
    summary: {
      optimal: Math.round((optimalCount / statuses.length) * 100),
      warning: Math.round((warningCount / statuses.length) * 100),
      critical: Math.round((criticalCount / statuses.length) * 100),
    },
  };
};
