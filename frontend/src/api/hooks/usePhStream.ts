// React hook for pH streaming

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { PhReading } from '../types';

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

    const record = payload as Record<string, unknown>;
    const candidate =
      record.ph ??
      record.ph_value ??
      record.value ??
      record.reading?.ph ??
      record.reading?.ph_value ??
      record.reading?.value;

    const value = Number(candidate);
    if (!Number.isFinite(value)) return null;

    return {
      id: typeof record.id === 'number' ? record.id : 0,
      tankId: typeof record.tankId === 'string' ? record.tankId : 'tank1',
      ph: value,
      deviceTimestamp: typeof record.deviceTimestamp === 'string' ? record.deviceTimestamp : null,
      serverTimestamp: typeof record.serverTimestamp === 'string'
        ? record.serverTimestamp
        : new Date().toISOString(),
    };
  };

  useEffect(() => {
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
    es.addEventListener('ph', (evt: Event) => handleEvent(evt as MessageEvent));
    es.onmessage = (evt) => handleEvent(evt as MessageEvent);

    return () => {
      es.close();
    };
  }, []);

  return { lastReading, connected };
}