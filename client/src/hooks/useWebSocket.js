import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '../store/marketStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const MAX_RECONNECT_DELAY = 30_000;

export function useWebSocket() {
  const wsRef            = useRef(null);
  const reconnectDelay   = useRef(1000);
  const reconnectTimer   = useRef(null);
  const pingTimer        = useRef(null);
  const pingTimestamp    = useRef(null);
  const isMounted        = useRef(true);

  const setAssets      = useMarketStore(s => s.setAssets);
  const setOrderbook   = useMarketStore(s => s.setOrderbook);
  const setWsConnected = useMarketStore(s => s.setWsConnected);
  const setWsLatency   = useMarketStore(s => s.setWsLatency);

  const connect = useCallback(() => {
    if (!isMounted.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      setWsConnected(true);
      reconnectDelay.current = 1000;

      // Subscribe to ticker and default order books
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        channels: ['ticker', 'orderbook:bitcoin', 'orderbook:ethereum', 'orderbook:solana', 'orderbook:binancecoin', 'orderbook:ripple'],
      }));

      // Latency ping every 30s
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          pingTimestamp.current = Date.now();
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30_000);
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'TICKER_BATCH':
            setAssets(msg.data);
            break;
          case 'ORDERBOOK':
            setOrderbook(msg.data);
            break;
          case 'PONG':
            if (pingTimestamp.current) {
              setWsLatency(Date.now() - pingTimestamp.current);
              pingTimestamp.current = null;
            }
            break;
          default:
            break;
        }
      } catch { /* ignore malformed messages */ }
    };

    ws.onclose = () => {
      clearInterval(pingTimer.current);
      setWsConnected(false);
      if (!isMounted.current) return;
      // Exponential backoff reconnect
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => ws.close();
  }, [setAssets, setOrderbook, setWsConnected, setWsLatency]);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      clearInterval(pingTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
