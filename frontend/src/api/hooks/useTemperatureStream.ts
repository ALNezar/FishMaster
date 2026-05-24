// React hook for temperature streaming

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { TemperatureReading } from '../types';

export interface UseTemperatureStreamResult {
  lastReading: TemperatureReading | null;
  connected: boolean;
}

/**
 * React hook to subscribe to live temperature from backend SSE stream.
 * Usage: const { lastReading, connected } = useTemperatureStream();
 */
export function useTemperatureStream(): UseTemperatureStreamResult {
  const [lastReading, setLastReading] = useState<TemperatureReading | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {

    const url = `${API_BASE_URL}/api/telemetry/temperature/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener('temperature', (evt: Event) => {
      try {
        const messageEvent = evt as MessageEvent;
        const data = JSON.parse(messageEvent.data) as TemperatureReading;
        setLastReading(data);
      } catch (e) {
        console.warn('Bad SSE payload', e);
      }
    });

    return () => {
      es.close();
    };
  }, []);

  return { lastReading, connected };
}
