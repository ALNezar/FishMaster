// Feeding schedule API endpoints

import { apiRequest } from './client';
import { FeedingSchedule, FeedingHistoryEntry } from '../types';

export const getFeedingSchedules = async (): Promise<FeedingSchedule[]> => {
  return apiRequest('/device/schedules');
};

export const createFeedingSchedule = async (
  schedule: Partial<FeedingSchedule>
): Promise<FeedingSchedule> => {
  return apiRequest('/device/schedules', {
    method: 'POST',
    body: JSON.stringify(schedule),
  });
};

export const updateFeedingSchedule = async (
  scheduleId: number,
  updates: Partial<FeedingSchedule>
): Promise<FeedingSchedule> => {
  return apiRequest(`/device/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteFeedingSchedule = async (
  scheduleId: number
): Promise<{ success: boolean }> => {
  return apiRequest(`/device/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
};

export const triggerManualFeeding = async (
  portionSize: 'small' | 'medium' | 'large' = 'medium'
): Promise<FeedingHistoryEntry> => {
  return apiRequest('/device/feed', {
    method: 'POST',
    body: JSON.stringify({ portionSize }),
  });
};

export const getFeedingHistory = async (
  limit: number = 10
): Promise<FeedingHistoryEntry[]> => {
  return apiRequest(`/device/history?limit=${limit}`);
};
