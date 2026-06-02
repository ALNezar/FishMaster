import { apiRequest } from './client';

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export const subscribeToPush = async (payload: PushSubscriptionPayload): Promise<{ message: string }> => {
  return apiRequest('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const unsubscribeFromPush = async (endpoint: string): Promise<{ message: string }> => {
  return apiRequest('/api/push/unsubscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
};

export interface VapidPublicKeyResponse {
  configured: boolean;
  publicKey: string;
}

export const getVapidPublicKey = async (): Promise<VapidPublicKeyResponse> => {
  return apiRequest('/api/push/vapid-public-key');
};
