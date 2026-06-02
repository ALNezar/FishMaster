// Alert thresholds API — maps flat backend DTO to nested UI shape

import { apiRequest } from './client';
import { AlertThresholds } from './types';

interface AlertThresholdDto {
  tankId?: number;
  globalAlertsEnabled?: boolean;
  emailAlertsEnabled?: boolean;
  inAppAlertsEnabled?: boolean;
  temperatureEnabled?: boolean;
  temperatureMin?: number | string;
  temperatureMax?: number | string;
  phEnabled?: boolean;
  phMin?: number | string;
  phMax?: number | string;
  turbidityEnabled?: boolean;
  turbidityMax?: number | string;
}

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const mapDtoToUi = (dto: AlertThresholdDto): AlertThresholds => ({
  globalAlertsEnabled: dto.globalAlertsEnabled ?? true,
  emailAlertsEnabled: dto.emailAlertsEnabled ?? true,
  inAppAlertsEnabled: dto.inAppAlertsEnabled ?? true,
  temperature: {
    enabled: dto.temperatureEnabled ?? true,
    min: toNumber(dto.temperatureMin, 22),
    max: toNumber(dto.temperatureMax, 28),
  },
  ph: {
    enabled: dto.phEnabled ?? true,
    min: toNumber(dto.phMin, 6.5),
    max: toNumber(dto.phMax, 7.5),
  },
  turbidity: {
    enabled: dto.turbidityEnabled ?? true,
    max: toNumber(dto.turbidityMax, 5),
  },
});

export const mapUiToDto = (tankId: number, ui: AlertThresholds): AlertThresholdDto => ({
  tankId,
  globalAlertsEnabled: ui.globalAlertsEnabled,
  emailAlertsEnabled: ui.emailAlertsEnabled,
  inAppAlertsEnabled: ui.inAppAlertsEnabled,
  temperatureEnabled: ui.temperature.enabled,
  temperatureMin: Number(ui.temperature.min),
  temperatureMax: Number(ui.temperature.max),
  phEnabled: ui.ph.enabled,
  phMin: Number(ui.ph.min),
  phMax: Number(ui.ph.max),
  turbidityEnabled: ui.turbidity.enabled,
  turbidityMax: Number(ui.turbidity.max),
});

export const getAlertThresholds = async (tankId: number): Promise<AlertThresholds> => {
  const data = await apiRequest(`/api/thresholds/${tankId}`);
  return mapDtoToUi(data as AlertThresholdDto);
};

export const updateAlertThresholds = async (
  tankId: number,
  data: AlertThresholds
): Promise<AlertThresholds> => {
  const body = mapUiToDto(tankId, data);
  const response = await apiRequest('/api/thresholds', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return mapDtoToUi(response as AlertThresholdDto);
};
