// React hook for pH streaming

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { PhReading } from '../types';
import { isAuthenticated } from '../utils/token';

export interface UsePhStreamResult {
  lastReading: PhReading | null;
  connected: boolean;
}

/**
 * React hook to subscribe to live pH from backend SSE stream.
 * Usage: const { lastReading, connected } = usePhStream();
 */
export function usePhStream(): UsePhStreamResult {
  const [lastReading, setLastReading] = useState<PhReading | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const normalizePhReading = (payload: unknown): PhReading | null => {
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
            ph: value,
            serverTimestamp: new Date().toISOString(),
          }
        : null;
    }

    if (typeof payload !== 'object') return null;

    const reading = readField(payload, 'reading');
    const candidate =
      readField(payload, 'ph') ??
      readField(payload, 'ph_value') ??
      readField(payload, 'value') ??
      readField(reading, 'ph') ??
      readField(reading, 'ph_value') ??
      readField(reading, 'value');

    const value = Number(candidate);
    if (!Number.isFinite(value)) return null;

    return {
      id: typeof readField(payload, 'id') === 'number' ? (readField(payload, 'id') as number) : 0,
      tankId: typeof readField(payload, 'tankId') === 'string'
        ? (readField(payload, 'tankId') as string)
        : 'tank1',
      ph: value,
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

    const url = `${API_BASE_URL}/api/telemetry/ph/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => {
      console.debug('[SSE][ph] open', url);
      setConnected(true);
    };

    es.onerror = (err) => {
      console.debug('[SSE][ph] error', err);
      setConnected(false);
    };

    const handleEvent = (evt: MessageEvent) => {
      try {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
        const reading = normalizePhReading(data);
        if (reading) {
          setLastReading(reading);
        }
      } catch (e) {
        console.warn('[SSE][ph] Bad payload', e, evt.data);
      }
    };

    // Listen for named 'ph' events and fallback to generic messages
    const onPh = (evt: Event) => handleEvent(evt as MessageEvent);
    es.addEventListener('ph', onPh);
    es.onmessage = (evt) => handleEvent(evt as MessageEvent);

    return () => {
      es.removeEventListener('ph', onPh);
      es.onmessage = null;
      es.onerror = null;
      es.onopen = null;
      es.close();
    };
  }, []);

  return { lastReading, connected };
}