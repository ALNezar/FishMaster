// Device API endpoints

import { apiRequest } from './client';
import { DeviceInfo, DeviceInfoSnapshot } from './types';

const normalizeSnapshot = (snapshot: DeviceInfoSnapshot | null): DeviceInfo => {
  if (!snapshot) {
    return {
      id: 0,
      name: 'Unknown Device',
      status: 'offline',
      firmwareVersion: 'Unknown',
      wifiNetwork: 'Unknown',
      ipAddress: '',
      macAddress: '',
      signalStrength: -80,
      cpuSpeed: 0,
      freeMemory: 0,
      totalMemory: 0,
      sensorInterval: 0,
      lastSync: new Date(0).toISOString(),
      uptime: 0,
      connectedTankId: 0,
      connectedTankName: 'Unknown Tank',
      features: {
        temperatureSensor: false,
        phSensor: false,
        turbiditySensor: false,
        autoFeeder: false,
        waterLevelSensor: false,
      },
    };
  }

  return {
    id: snapshot.id,
    name: snapshot.deviceId,
    status: 'online',
    firmwareVersion: snapshot.firmwareVersion || 'Unknown',
    wifiNetwork: snapshot.wifiSsid || 'Unknown',
    ipAddress: snapshot.ipAddress || '',
    macAddress: snapshot.macAddress || '',
    signalStrength: snapshot.rssiDbm ?? -80,
    cpuSpeed: snapshot.cpuMhz ?? 0,
    freeMemory: snapshot.freeHeap ?? 0,
    totalMemory: snapshot.heapTotal ?? 0,
    sensorInterval: 0,
    lastSync: snapshot.serverTimestamp,
    uptime: Math.floor((snapshot.uptimeMs ?? 0) / 1000),
    connectedTankId: 0,
    connectedTankName: 'Connected Tank',
    features: {
      temperatureSensor: true,
      phSensor: true,
      turbiditySensor: true,
      autoFeeder: false,
      waterLevelSensor: false,
    },
  };
};

export const getDeviceInfo = async (deviceId: string = 'FM-Tankie_1'): Promise<DeviceInfo> => {
  const snapshot = await fetchLatestDeviceInfo(deviceId);
  return normalizeSnapshot(snapshot);
};

export const updateDeviceInfo = async (updates: Partial<DeviceInfo>): Promise<DeviceInfo> => {
  return apiRequest('/device/info', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const reconnectDevice = async (): Promise<{ success: boolean; status: string }> => {
  return apiRequest('/device/reconnect', {
    method: 'POST',
  });
};

export const fetchLatestDeviceInfo = async (
  deviceId: string = 'FM-Tankie_1'
): Promise<DeviceInfoSnapshot> => {
  return apiRequest(`/api/devices/${encodeURIComponent(deviceId)}/info/latest`);
};
