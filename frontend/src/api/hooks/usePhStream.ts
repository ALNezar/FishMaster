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

  useEffect(() => {
    const url = `${API_BASE_URL}/api/telemetry/ph/stream`;
    const es = new EventSource(url, { withCredentials: false });
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener('ph', (evt: Event) => {
      try {
        const messageEvent = evt as MessageEvent;
        const data = JSON.parse(messageEvent.data) as PhReading;
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