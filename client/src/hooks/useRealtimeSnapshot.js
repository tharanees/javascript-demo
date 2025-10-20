import { useEffect, useRef, useState } from 'react';
import { RealtimeClient } from '../services/websocketClient';

export const useRealtimeSnapshot = (url) => {
  const clientRef = useRef();
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!url) {
      return undefined;
    }

    clientRef.current = new RealtimeClient({
      url,
      onSnapshot: setSnapshot,
      onStatusChange: setStatus
    });

    return () => {
      clientRef.current?.disconnect();
    };
  }, [url]);

  return { snapshot, status };
};
