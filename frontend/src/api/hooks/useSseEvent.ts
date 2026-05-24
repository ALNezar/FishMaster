import { useEffect, useRef, useState } from 'react';

export function useSseEvent(baseUrl: string, path: string, eventName: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`${baseUrl}${path}`);
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    const handler = (evt: MessageEvent<string>) => {
      try {
        setData(JSON.parse(evt.data));
      } catch (error) {
        console.warn('Bad SSE payload', error);
      }
    };

    es.addEventListener(eventName, handler);

    return () => {
      es.removeEventListener(eventName, handler);
      es.close();
    };
  }, [baseUrl, path, eventName]);

  return { data, connected };
}