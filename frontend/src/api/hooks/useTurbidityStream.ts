// React hook for turbidity streaming

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { TurbidityReading } from '../types';
import { isAuthenticated } from '../utils/token';

export interface UseTurbidityStreamResult {
  lastReading: TurbidityReading | null;
  connected: boolean;
}

/**
 * React hook to subscribe to live turbidity from backend SSE stream.
 * Usage: const { lastReading, connected } = useTurbidityStream();
 */
export function useTurbidityStream(): UseTurbidityStreamResult {
  const [lastReading, setLastReading] = useState<TurbidityReading | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const normalizeTurbidityReading = (payload: unknown): TurbidityReading | null => {
    const readField = (obj: unknown, key: string): unknown => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    };

    if (payload == null) return null;

    if (typeof payload === 'number' || typeof payload === 'string') {
      const value = Number(payload);
      return Number.isFinite(value)
        ? {
            id: 0,
            tankId: 'tank1',
            ntu: value,
            rawAdc: 0,
            serverTimestamp: new Date().toISOString(),
          }
        : null;
    }

    if (typeof payload !== 'object') return null;

    const reading = readField(payload, 'reading');
    const candidate =
      readField(payload, 'ntu') ??
      readField(payload, 'value') ??
      readField(reading, 'ntu') ??
      readField(reading, 'value');

    const value = Number(candidate);
    if (!Number.isFinite(value)) return null;

    return {
      id: typeof readField(payload, 'id') === 'number' ? (readField(payload, 'id') as number) : 0,
      tankId: typeof readField(payload, 'tankId') === 'string'
        ? (readField(payload, 'tankId') as string)
        : 'tank1',
      ntu: value,
      rawAdc: typeof readField(payload, 'rawAdc') === 'number' ? (readField(payload, 'rawAdc') as number) : 0,
      deviceTimestamp: typeof readField(payload, 'deviceTimestamp') === 'string'
        ? (readField(payload, 'deviceTimestamp') as string)
        : null,
      serverTimestamp: typeof readField(payload, 'serverTimestamp') === 'string'
        ? (readField(payload, 'serverTimestamp') as string)
        : new Date().toISOString(),
    };
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      setConnected(false);
      return () => {};
    }

    const url = `${API_BASE_URL}/api/telemetry/turbidity/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => {
      console.debug('[SSE][turbidity] open', url);
      setConnected(true);
    };

    es.onerror = (err) => {
      console.debug('[SSE][turbidity] error', err);
      setConnected(false);
    };

    const handleEvent = (evt: MessageEvent) => {
      try {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
        const reading = normalizeTurbidityReading(data);
        if (reading) {
          setLastReading(reading);
        }
      } catch (e) {
        console.warn('[SSE][turbidity] Bad payload', e, evt.data);
      }
    };

    // Listen for named 'turbidity' events and fallback to generic messages
    const onTurbidity = (evt: Event) => handleEvent(evt as MessageEvent);
    es.addEventListener('turbidity', onTurbidity);
    es.onmessage = (evt) => handleEvent(evt as MessageEvent);

    return () => {
      es.removeEventListener('turbidity', onTurbidity);
      es.onmessage = null;
      es.onerror = null;
      es.onopen = null;
      es.close();
    };
  }, []);

  return { lastReading, connected };
}
