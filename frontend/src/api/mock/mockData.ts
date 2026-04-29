// Mock data for development/fallback mode

import { User, Tank, Fish, FeedingSchedule, DeviceInfo, AlertThresholds } from '../types';

// Mock user
export const defaultMockUser: User = {
  id: 1,
  username: 'devuser',
  name: 'Dev User',
  email: 'dev@fishmaster.app',
  contactNumber: '',
  emailNotifications: false,
  smsNotifications: false,
};

export let mockUser = { ...defaultMockUser };

// Mock password (for dev testing only)
export const mockUserPassword = 'password';

// Mock tanks database
export let mockTanks: Tank[] = [
  {
    id: 1,
    name: 'Living Room Tank',
    sizeLiters: 120,
    fish: [
      {
        id: 1,
        name: 'Goldie',
        fishType: { id: 1, name: 'Goldfish', careLevel: 'Easy', phMin: 6.5, phMax: 7.5, temperatureMin: 18, temperatureMax: 24, minTankSize: 75 },
      },
      {
        id: 2,
        name: 'Finn',
        fishType: { id: 3, name: 'Guppy', careLevel: 'Easy', phMin: 6.8, phMax: 7.8, temperatureMin: 22, temperatureMax: 28, minTankSize: 20 },
      },
    ],
    waterParameters: {
      targetPh: 7.0,
      targetTemperature: 25,
      ph: 7.1,
      temperature: 25.2,
    },
  },
  {
    id: 2,
    name: 'Betta Bowl',
    sizeLiters: 20,
    fish: [
      {
        id: 3,
        name: 'Blue',
        fishType: { id: 2, name: 'Betta', careLevel: 'Easy', phMin: 6.5, phMax: 7.5, temperatureMin: 24, temperatureMax: 28, minTankSize: 10 },
      },
    ],
    waterParameters: {
      targetPh: 7.2,
      targetTemperature: 26,
      ph: 7.2,
      temperature: 26.1,
    },
  },
];

export let nextFishId = 4;

// Return and increment the next fish id in a safe way for consumers.
export function consumeNextFishId() {
  const id = nextFishId;
  nextFishId += 1;
  return id;
}

// Mock alert thresholds
export const defaultAlertThresholds: AlertThresholds = {
  globalAlertsEnabled: true,
  emailAlertsEnabled: true,
  inAppAlertsEnabled: true,
  temperature: { enabled: true, min: 22, max: 28 },
  ph: { enabled: true, min: 6.5, max: 7.5 },
  turbidity: { enabled: true, max: 5 },
};

export let mockAlertThresholds: Record<number, AlertThresholds> = {
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

// Live sensor state for simulation
export const liveSensorState = {
  temperature: 25.2,
  ph: 7.1,
  turbidity: 3.8,
  trend: {
    temperature: 'stable' as const,
    ph: 'rising' as const,
    turbidity: 'stable' as const,
  },
};

// Mock device info
export let mockDeviceInfo: DeviceInfo = {
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
    autoFeeder: true,
    waterLevelSensor: true,
  },
};

// Mock feeding schedules
export let mockFeedingSchedules: FeedingSchedule[] = [
  {
    id: 1,
    time: '08:00',
    portionSize: 'small',
    enabled: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Morning Feed',
  },
  {
    id: 2,
    time: '13:00',
    portionSize: 'small',
    enabled: false,
    daysOfWeek: [0, 6],
    label: 'Weekend Lunch',
  },
  {
    id: 3,
    time: '18:30',
    portionSize: 'medium',
    enabled: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    label: 'Evening Feed',
  },
];

export let nextScheduleId = 4;

// Mock feeding history
export const mockFeedingHistory = [
  {
    id: 1,
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    portionSize: 'medium' as const,
    status: 'completed' as const,
    type: 'scheduled' as const,
    scheduleName: 'Evening Feed',
  },
  {
    id: 2,
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    portionSize: 'small' as const,
    status: 'completed' as const,
    type: 'manual' as const,
    scheduleName: null,
  },
  {
    id: 3,
    time: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    portionSize: 'small' as const,
    status: 'completed' as const,
    type: 'scheduled' as const,
    scheduleName: 'Morning Feed',
  },
  {
    id: 4,
    time: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    portionSize: 'medium' as const,
    status: 'completed' as const,
    type: 'scheduled' as const,
    scheduleName: 'Evening Feed',
  },
  {
    id: 5,
    time: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    portionSize: 'small' as const,
    status: 'skipped' as const,
    type: 'scheduled' as const,
    scheduleName: 'Morning Feed',
  },
  {
    id: 6,
    time: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    portionSize: 'medium' as const,
    status: 'completed' as const,
    type: 'scheduled' as const,
    scheduleName: 'Evening Feed',
  },
  {
    id: 7,
    time: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    portionSize: 'small' as const,
    status: 'completed' as const,
    type: 'scheduled' as const,
    scheduleName: 'Morning Feed',
  },
  {
    id: 8,
    time: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(),
    portionSize: 'large' as const,
    status: 'completed' as const,
    type: 'manual' as const,
    scheduleName: null,
  },
];

// Fish type master list
export const mockFishTypes = [
  { id: 1, name: 'Goldfish', careLevel: 'beginner', minPh: 6.5, maxPh: 7.5, minTemp: 18, maxTemp: 24 },
  { id: 2, name: 'Betta', careLevel: 'beginner', minPh: 6.5, maxPh: 7.5, minTemp: 24, maxTemp: 28 },
  { id: 3, name: 'Guppy', careLevel: 'beginner', minPh: 6.8, maxPh: 7.8, minTemp: 22, maxTemp: 28 },
  {
    id: 4,
    name: 'Neon Tetra',
    careLevel: 'intermediate',
    minPh: 6.0,
    maxPh: 7.0,
    minTemp: 20,
    maxTemp: 26,
  },
  {
    id: 5,
    name: 'Angelfish',
    careLevel: 'intermediate',
    minPh: 6.0,
    maxPh: 7.5,
    minTemp: 24,
    maxTemp: 28,
  },
];
