import { useEffect, useRef } from 'react';
import useDashboardStore from '../state/useDashboardStore.js';

const buildWsUrl = () => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:4000/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
};

const useRealtimeFeed = () => {
  const socketRef = useRef(null);
  const queueRef = useRef([]);
  const symbolRef = useRef(null);
  const setConnectionStatus = useDashboardStore((state) => state.setConnectionStatus);
  const selectedSymbol = useDashboardStore((state) => state.selectedSymbol);
  const upsertSnapshot = useDashboardStore((state) => state.upsertSnapshot);
  const setGlobalMetrics = useDashboardStore((state) => state.setGlobalMetrics);

  const sendMessage = (payload) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      queueRef.current.push(payload);
      return;
    }
    socketRef.current.send(JSON.stringify(payload));
  };

  useEffect(() => {
    const socket = new WebSocket(buildWsUrl());
    socketRef.current = socket;
    setConnectionStatus('connecting');

    socket.addEventListener('open', () => {
      setConnectionStatus('connected');
      queueRef.current.forEach((message) => socket.send(JSON.stringify(message)));
      queueRef.current = [];
      if (selectedSymbol) {
        sendMessage({ type: 'subscribe', symbol: selectedSymbol });
        sendMessage({ type: 'snapshot', symbol: selectedSymbol });
        symbolRef.current = selectedSymbol;
      }
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'market:update') {
          upsertSnapshot(payload.symbol, payload.data);
        } else if (payload.type === 'global:metrics') {
          setGlobalMetrics(payload.data);
        } else if (payload.type === 'snapshot') {
          upsertSnapshot(payload.symbol, payload.data);
        }
      } catch (error) {
        // ignore malformed messages
      }
    });

    socket.addEventListener('close', () => {
      setConnectionStatus('disconnected');
      socketRef.current = null;
    });

    socket.addEventListener('error', () => {
      setConnectionStatus('error');
    });

    return () => {
      socket.close(1000, 'component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSymbol) {
      return;
    }

    if (symbolRef.current === selectedSymbol) {
      return;
    }

    if (symbolRef.current) {
      sendMessage({ type: 'unsubscribe', symbol: symbolRef.current });
    }

    sendMessage({ type: 'subscribe', symbol: selectedSymbol });
    sendMessage({ type: 'snapshot', symbol: selectedSymbol });
    symbolRef.current = selectedSymbol;
  }, [selectedSymbol]);
};

export default useRealtimeFeed;
