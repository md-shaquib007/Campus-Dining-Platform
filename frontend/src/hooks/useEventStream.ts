import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function useEventStream(enabled = true) {
  const queryClient = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }

    const token = localStorage.getItem('accessToken');
    if (!token || !enabled) return;

    const url = `${API_URL}/events/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MENU_PUBLISHED') {
          toast.success('New menu published!');
          queryClient.invalidateQueries({ queryKey: ['menu'] });
        } else if (data.type === 'COMPLAINT_RESOLVED') {
          toast.success('Your complaint was resolved');
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
        } else if (data.type === 'COMPLAINT_NEW') {
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } catch {
        // ignore parse errors
      }
    };

    source.onerror = () => {
      source.close();
      sourceRef.current = null;
      timerRef.current = setTimeout(connect, 10000);
    };

    sourceRef.current = source;
  }, [enabled, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sourceRef.current?.close();
    };
  }, [connect]);
}
