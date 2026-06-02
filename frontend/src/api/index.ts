// Main API index - re-exports all public API functions

// Auth API
export * from './auth.api';

// User API
export * from './user.api';

// Tank API
export * from './tank.api';

// Fish API
export * from './fish.api';

// Telemetry API
export * from './telemetry.api';

// Sensor API
export * from './sensor.api';

// Generic SSE hook
export { useSseEvent } from './hooks/useSseEvent';

// Alert Thresholds API
export * from './threshold.api';

// Device Control API
export * from './device.api';

// Feeding Schedules API
export * from './feeding.api';

// History API
export * from './history.api';

// Onboarding API
export * from './onboarding.api';

// Learning Hub API
export * from './learning.api';

// Alert API
export * from './alert.api';

// Push API
export * from './push.api';

// Hooks
export { useTemperatureStream } from './hooks/useTemperatureStream';
export type { UseTemperatureStreamResult } from './hooks/useTemperatureStream';
export { usePhStream } from './hooks/usePhStream';
export type { UsePhStreamResult } from './hooks/usePhStream';

// Core utilities
export { apiRequest } from './client';
export {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
} from './utils/token';
export { createHeaders } from './utils/headers';
export { normalizeResponse } from './utils/normalize';

// Types
export type * from './types';

// Config (for advanced usage)
export {
  DEV_MODE,
  API_BASE_URL,
  TOKEN_KEY,
  LEARNING_PROGRESS_KEY,
} from './config';

// Default export for backward compatibility
import * as authApi from './auth.api';
import * as userApi from './user.api';
import * as tankApi from './tank.api';
import * as fishApi from './fish.api';
import * as telemetryApi from './telemetry.api';
import * as sensorApi from './sensor.api';
import * as thresholdApi from './threshold.api';
import * as deviceApi from './device.api';
import * as feedingApi from './feeding.api';
import * as onboardingApi from './onboarding.api';
import * as learningApi from './learning.api';
import * as alertApi from './alert.api';
import * as pushApi from './push.api';
import { useSseEvent } from './hooks/useSseEvent';
import { useTemperatureStream } from './hooks/useTemperatureStream';
import { usePhStream } from './hooks/usePhStream';
import { apiRequest } from './client';
import { setToken, removeToken, isAuthenticated } from './utils/token';

export default {
  ...authApi,
  ...userApi,
  ...tankApi,
  ...fishApi,
  ...telemetryApi,
  ...sensorApi,
  ...thresholdApi,
  ...deviceApi,
  ...feedingApi,
  ...onboardingApi,
  ...learningApi,
  ...alertApi,
  ...pushApi,
  useSseEvent,
  useTemperatureStream,
  usePhStream,
  apiRequest,
  setToken,
  removeToken,
  isAuthenticated,
};
