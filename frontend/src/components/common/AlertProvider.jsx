import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './toast/ToastProvider';
import { API_BASE_URL } from '../../api';
import { getToken } from '../../api/utils/token';

const AlertContext = createContext(null);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return undefined;
    }

    const streamUrl = `${API_BASE_URL}/api/alerts/stream?access_token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      console.log('[SSE] Alert stream connected');
    };

    eventSource.addEventListener('alert', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] New alert received:', data);

        if (data.severity === 'CRITICAL') {
          toast.error(data.message, { duration: 10000 });
        } else if (data.severity === 'WARNING') {
          toast.warning(data.message, { duration: 8000 });
        } else {
          toast.info(data.message);
        }

        setUnreadCount((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to parse alert SSE data:', err);
      }
    });

    eventSource.addEventListener('alert-resolved', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Alert resolved:', data);
        toast.success(`Alert resolved: ${data.metric} is back to normal.`);
      } catch (err) {
        console.error('Failed to parse alert-resolved SSE data:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('[SSE] Stream error, it will attempt to reconnect.', err);
    };

    return () => {
      eventSource.close();
      console.log('[SSE] Alert stream disconnected');
    };
  }, [toast]);

  const decrementUnread = () => setUnreadCount((prev) => Math.max(0, prev - 1));
  const clearUnread = () => setUnreadCount(0);

  return (
    <AlertContext.Provider value={{ unreadCount, decrementUnread, clearUnread }}>
      {children}
    </AlertContext.Provider>
  );
};
