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

    es.onopen = () => {
      console.debug('[SSE][temperature] open', url);
      setConnected(true);
    };

    es.onerror = (err) => {
      console.debug('[SSE][temperature] error', err);
      setConnected(false);
    };

    const handleEvent = (evt: MessageEvent) => {
      try {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
        const reading = data as TemperatureReading;
        setLastReading(reading);
      } catch (e) {
        console.warn('[SSE][temperature] Bad payload', e, evt.data);
      }
    };

    es.addEventListener('temperature', (evt: Event) => handleEvent(evt as MessageEvent));
    es.onmessage = (evt) => handleEvent(evt as MessageEvent);

    return () => {
      es.close();
    };
  }, []);

  return { lastReading, connected };
}
