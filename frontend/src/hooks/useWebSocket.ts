// WebSocket hook for real-time cluster events

import { useEffect, useRef, useCallback, useState } from 'react';
import { config } from '../config';
import type { ApiClusterEvent } from '../services/api.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketOptions {
  clusterId: string | null;
  onEvent?: (event: ApiClusterEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  includeHistory?: boolean;
  autoReconnect?: boolean;
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  lastEvent: ApiClusterEvent | null;
  events: ApiClusterEvent[];
  send: (message: Record<string, unknown>) => void;
  connect: () => void;
  disconnect: () => void;
  clearEvents: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    clusterId,
    onEvent,
    onConnect,
    onDisconnect,
    onError,
    includeHistory = false,
    autoReconnect = true,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<ApiClusterEvent | null>(null);
  const [events, setEvents] = useState<ApiClusterEvent[]>([]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (!clusterId || !config.useBackend) {
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus('connecting');

    const params = includeHistory ? '?include_history=true' : '';
    const wsUrl = `${config.wsUrl}/ws/clusters/${clusterId}/events${params}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ApiClusterEvent;
          
          // Skip heartbeat events from the event list
          if (data.type === 'connection.heartbeat') {
            return;
          }

          setLastEvent(data);
          setEvents((prev) => [data, ...prev].slice(0, 100));
          onEvent?.(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;
        onDisconnect?.();

        // Auto-reconnect logic
        if (autoReconnect && reconnectAttemptsRef.current < config.wsMaxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, config.wsReconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus('error');
        onError?.(error);
      };
    } catch (e) {
      setStatus('error');
      console.error('Failed to create WebSocket:', e);
    }
  }, [clusterId, includeHistory, autoReconnect, onConnect, onDisconnect, onError, onEvent]);

  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect when clusterId changes
  useEffect(() => {
    if (clusterId && config.useBackend) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [clusterId, connect, disconnect]);

  return {
    status,
    lastEvent,
    events,
    send,
    connect,
    disconnect,
    clearEvents,
  };
}

export default useWebSocket;
