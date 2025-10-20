import { useEffect, useRef, useState } from 'react';

const getDefaultWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname || 'localhost';
  const port = window.location.port || '5173';
  const backendPort = port === '5173' ? '4000' : port;
  return `${protocol}://${host}:${backendPort}/ws`;
};

export function useLiveAssets() {
  const [state, setState] = useState({
    assets: [],
    lastUpdated: null,
    status: 'connecting',
    source: null,
    warning: null,
    error: null,
  });
  const reconnectTimeout = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || getDefaultWsUrl();
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setState((prev) => ({ ...prev, status: 'connected' }));
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'snapshot' || payload.type === 'update') {
            setState((prev) => {
              const source = payload.data.source || prev.source;
              const isSynthetic = source === 'synthetic';
              const warningMessage = isSynthetic
                ? payload.data.usedFallback
                  ? 'Live API unreachable — serving bundled dataset'
                  : prev.warning
                : null;

              return {
                assets: payload.data.assets || prev.assets,
                lastUpdated: payload.data.lastUpdated || prev.lastUpdated,
                status: isSynthetic ? 'degraded' : 'connected',
                source,
                warning: warningMessage,
                error: null,
              };
            });
          } else if (payload.type === 'warning') {
            setState((prev) => {
              const source = payload.data.source || prev.source;
              const isSynthetic = source === 'synthetic';
              return {
                ...prev,
                status: isSynthetic ? 'degraded' : prev.status,
                warning: payload.data.message || prev.warning,
                source,
              };
            });
          } else if (payload.type === 'error') {
            setState((prev) => ({ ...prev, status: 'error', error: payload.data.message }));
          }
        } catch (error) {
          console.error('Failed to parse websocket payload', error);
        }
      });

      socket.addEventListener('close', () => {
        setState((prev) => ({ ...prev, status: 'disconnected' }));
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 4000);
      });

      socket.addEventListener('error', () => {
        socket.close();
      });
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return state;
}
