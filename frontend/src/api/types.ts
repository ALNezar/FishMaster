// API type definitions

export interface FishType {
  id: number;
  name: string;
  careLevel: string;
  phMin: number;
  phMax: number;
  temperatureMin: number;
  temperatureMax: number;
  minTankSize: number;
  description?: string;
}

export interface CreateFishTypeRequest {
  name: string;
  careLevel?: string;
  minPh?: number;
  maxPh?: number;
  minTemp?: number;
  maxTemp?: number;
  description?: string;
}

export interface Fish {
  id: number;
  name: string;
  fishType: FishType;
  createdAt?: string;
}

export interface WaterParameters {
  targetPh: number;
  targetTemperature: number;
  ph: number;
  temperature: number;
}

export interface Tank {
  id: number;
  name: string;
  sizeLiters: number;
  fish: Fish[];
  waterParameters: WaterParameters;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  contactNumber: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, '_password'>;
}

export interface TemperatureReading {
  id: number;
  tankId: string;
  temperature: number | string;
  deviceTimestamp?: string | null;
  serverTimestamp: string;
}

export interface TurbidityReading {
  id: number;
  tankId: string;
  rawAdc: number;
  ntu: number | string;
  serverTimestamp: string;
}

export interface PhReading {
  id: number;
  tankId: string;
  ph: number | string;
  deviceTimestamp?: string | null;
  serverTimestamp: string;
}

export interface DeviceInfoSnapshot {
  id: number;
  deviceId: string;
  firmwareVersion?: string;
  cpuMhz?: number;
  freeHeap?: number;
  heapTotal?: number;
  macAddress?: string;
  ipAddress?: string;
  wifiSsid?: string;
  rssiDbm?: number;
  uptimeMs?: number;
  chipId?: string;
  serverTimestamp: string;
}

export type TelemetryKind = 'temperature' | 'turbidity' | 'ph';

export interface SensorReading {
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'stable' | 'rising' | 'falling';
}

export interface SensorData {
  labels: string[];
  values: number[];
  target?: number;
  min?: number;
  max?: number;
  currentValue?: number;
}

export interface SensorDataResponse {
  temperature: SensorData;
  ph: SensorData;
  turbidity: SensorData;
  multiParam?: {
    labels: string[];
    temperature: number[];
    ph: number[];
    turbidity: number[];
  };
  summary?: {
    optimal: number;
    warning: number;
    critical: number;
  };
  currentReadings: {
    temperature: SensorReading;
    ph: SensorReading;
    turbidity: SensorReading;
  };
  lastUpdated: string;
}

export interface AlertThresholds {
  globalAlertsEnabled: boolean;
  emailAlertsEnabled: boolean;
  inAppAlertsEnabled: boolean;
  temperature: {
    enabled: boolean;
    min: number;
    max: number;
  };
  ph: {
    enabled: boolean;
    min: number;
    max: number;
  };
  turbidity: {
    enabled: boolean;
    max: number;
  };
}

export interface DeviceInfo {
  id: number;
  name: string;
  status: 'online' | 'offline';
  firmwareVersion: string;
  wifiNetwork: string;
  ipAddress: string;
  macAddress: string;
  signalStrength: number;
  cpuSpeed: number;
  freeMemory: number;
  totalMemory: number;
  sensorInterval: number;
  lastSync: string;
  uptime: number;
  connectedTankId: number;
  connectedTankName: string;
  features: {
    temperatureSensor: boolean;
    phSensor: boolean;
    turbiditySensor: boolean;
    autoFeeder: boolean;
    waterLevelSensor: boolean;
  };
}

export interface FeedingSchedule {
  id: number;
  time: string;
  portionSize: 'small' | 'medium' | 'large';
  enabled: boolean;
  daysOfWeek: number[];
  label: string;
}

export interface FeedingHistoryEntry {
  id: number;
  time: string;
  portionSize: 'small' | 'medium' | 'large';
  status: 'completed' | 'skipped';
  type: 'scheduled' | 'manual';
  scheduleName: string | null;
}

export type HistoryEventType = 'parameter' | 'alert' | 'maintenance' | 'feeding' | 'system';

export type HistoryEventStatus = 'success' | 'warning' | 'info' | 'critical';

export interface HistoryEvent {
  id: string;
  tankId: number | string;
  type: HistoryEventType;
  status: HistoryEventStatus;
  title: string;
  description: string;
  timestamp: string;
  source: 'history' | 'feeding' | 'telemetry';
}

export interface LearningSubsection {
  id: string;
  title: string;
  description: string;
  images: Array<{
    src: string;
    caption: string;
  }>;
}

export interface LearningSection {
  id: string;
  title: string;
  icon: string;
  sensorImage: string;
  summary: string;
  subsections: LearningSubsection[];
}

export interface LearningSectionPreview {
  id: string;
  title: string;
  icon: string;
  sensorImage: string;
  summary: string;
  subsectionCount: number;
  level: string;
  description: string;
  lessonsCount: number;
  durationMin: number;
}

export interface LearningProgress {
  viewedSectionIds: string[];
  lastViewedSection: string | null;
  totalSections: number;
  viewedCount: number;
  completionRate: number;
}

export interface ApiRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  includeAuth?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}
