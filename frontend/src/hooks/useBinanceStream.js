import { useEffect, useRef } from 'react';
import { useDashboardStore } from '../state/dashboardStore.js';

const RECONNECT_DELAY = 4000;

const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws`;
};

export const useBinanceStream = () => {
  const { selectedSymbols, primarySymbol, upsertTicker, setDepth, addTrade } = useDashboardStore((state) => ({
    selectedSymbols: state.selectedSymbols,
    primarySymbol: state.primarySymbol,
    upsertTicker: state.upsertTicker,
    setDepth: state.setDepth,
    addTrade: state.addTrade,
  }));

  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  useEffect(() => {
    const connect = () => {
      const url = getWebSocketUrl();
      if (!url) return;

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        const uniqueSymbols = Array.from(new Set(selectedSymbols.map((symbol) => symbol.toUpperCase())));
        uniqueSymbols.forEach((symbol) => {
          ws.send(JSON.stringify({ type: 'subscribe', channel: 'ticker', symbol }));
        });

        if (primarySymbol) {
          ['depth', 'aggTrade'].forEach((channel) => {
            ws.send(JSON.stringify({ type: 'subscribe', channel, symbol: primarySymbol }));
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'data') {
            const { channel, symbol, payload } = message;
            if (channel === 'ticker') {
              upsertTicker(symbol, payload);
            } else if (channel === 'depth') {
              const depth = {
                lastUpdateId: payload.lastUpdateId,
                bids: (payload.bids || []).map(([price, quantity]) => ({
                  price: Number(price),
                  quantity: Number(quantity),
                })),
                asks: (payload.asks || []).map(([price, quantity]) => ({
                  price: Number(price),
                  quantity: Number(quantity),
                })),
              };
              setDepth(symbol, depth);
            } else if (channel === 'aggTrade') {
              addTrade(symbol, payload);
            }
          } else if (message.type === 'error') {
            console.error('Stream error', message.error);
          } else if (message.type === 'warning') {
            console.warn('Stream warning', message.message);
          }
        } catch (error) {
          console.error('Failed to parse websocket message', error);
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'component unmount');
      }
    };
  }, [selectedSymbols, primarySymbol, upsertTicker, setDepth, addTrade]);
};
