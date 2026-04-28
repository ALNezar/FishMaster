// Device control API endpoints

import { apiRequest } from './client';
import { DeviceInfo } from './types';

export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  return apiRequest('/device/info');
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
