/**
 * WebSocket hook for real-time communication with the game server.
 * Handles connection management, auto-reconnection, and message queuing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientMessage, ServerMessage } from '../types';
import { getWebSocketUrl, isValidServerMessage } from '../utils/websocket';

/**
 * Connection state of the WebSocket.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Options for the useWebSocket hook.
 */
export interface UseWebSocketOptions {
  /** Room ID to connect to */
  roomId: string;
  /** Callback invoked when a message is received from the server */
  onMessage: (message: ServerMessage) => void;
  /** Whether to connect automatically on mount (default: true) */
  autoConnect?: boolean;
  /** Maximum delay between reconnection attempts in ms (default: 30000) */
  maxReconnectDelay?: number;
}

/**
 * Return value from the useWebSocket hook.
 */
export interface UseWebSocketReturn {
  /** Current connection state */
  connectionState: ConnectionState;
  /** Send a message to the server */
  sendMessage: (message: ClientMessage) => void;
  /** Manually initiate connection */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Convenience flag: true if connected */
  isConnected: boolean;
  /** Connection error message, if any */
  connectionError: string | null;
}

const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_MESSAGE_QUEUE_SIZE = 50;
const CONNECTION_TIMEOUT = 10000; // 10 seconds

/**
 * Custom hook for managing WebSocket connections with auto-reconnection.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing when offline
 * - Type-safe message handling
 * - Connection state management
 *
 * @param options - Configuration options for the WebSocket connection
 * @returns WebSocket connection interface
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { roomId, onMessage, autoConnect = true, maxReconnectDelay = 30000 } = options;

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refs - values that don't trigger re-renders
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY);
  const intentionalDisconnectRef = useRef<boolean>(false);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage callback up to date without recreating handlers
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  /**
   * Clear any pending reconnection timeout.
   */
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Clear any pending connection timeout.
   */
  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current !== null) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Flush all queued messages to the server.
   */
  const flushMessageQueue = useCallback(() => {
    const ws = websocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      if (message) {
        try {
          ws.send(JSON.stringify(message));
          console.log('📤 Sent queued message:', message.type);
        } catch (error) {
          console.error('Failed to send queued message:', error);
          // Put it back at the front if send failed
          messageQueueRef.current.unshift(message);
          break;
        }
      }
    }
  }, []);

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  const scheduleReconnect = useCallback(() => {
    // Don't reconnect if user explicitly disconnected
    if (intentionalDisconnectRef.current) {
      return;
    }

    clearReconnectTimeout();

    const delay = reconnectDelayRef.current;
    console.log(`🔄 Scheduling reconnection in ${delay}ms...`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      connect();

      // Increase delay for next attempt (exponential backoff)
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, maxReconnectDelay);
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearReconnectTimeout, maxReconnectDelay]);

  /**
   * Establish WebSocket connection.
   */
  const connect = useCallback(() => {
    // Close existing connection if any
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Clear any pending timeouts
    clearReconnectTimeout();
    clearConnectionTimeout();

    const url = getWebSocketUrl(roomId);
    console.log(`🔌 Connecting to WebSocket: ${url}`);

    setConnectionState('connecting');
    setConnectionError(null);
    intentionalDisconnectRef.current = false;

    // Set connection timeout
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        console.error('⏱️ Connection timeout');
        const errorMsg = 'Connection timeout. Unable to reach server.';
        setConnectionError(errorMsg);
        setConnectionState('error');
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }
        scheduleReconnect();
      }
    }, CONNECTION_TIMEOUT);

    try {
      const ws = new WebSocket(url);
      websocketRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        clearConnectionTimeout();
        setConnectionState('connected');
        setConnectionError(null);

        // Reset reconnection delay on successful connection
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

        // Flush any queued messages
        flushMessageQueue();
      };

      // Message received
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (isValidServerMessage(data)) {
            console.log('📥 Received message:', data.type);
            onMessageRef.current(data);
          } else {
            console.warn('⚠️ Received invalid message format:', data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      // Connection closed
      ws.onclose = (event) => {
        clearConnectionTimeout();
        console.log(`🔌 WebSocket closed (code: ${event.code}, clean: ${event.wasClean})`);

        // Generate helpful error message based on close code
        if (!event.wasClean && event.code !== 1000) {
          let errorMsg = 'Connection closed unexpectedly';
          if (event.code === 1006) {
            errorMsg = 'Connection failed. Check if the server is running and accessible.';
          } else if (event.code === 1001) {
            errorMsg = 'Server disconnected';
          } else if (event.code === 1002) {
            errorMsg = 'Protocol error';
          } else if (event.code === 1003) {
            errorMsg = 'Invalid data received';
          }
          setConnectionError(errorMsg);
        }

        websocketRef.current = null;

        if (intentionalDisconnectRef.current) {
          // User disconnected manually
          setConnectionState('disconnected');
        } else {
          // Unexpected disconnect - try to reconnect
          setConnectionState('error');
          scheduleReconnect();
        }
      };

      // Connection error
      ws.onerror = (error) => {
        clearConnectionTimeout();
        console.error('❌ WebSocket error:', error);
        setConnectionError('Failed to connect to server. Check your network connection.');
        setConnectionState('error');
      };
    } catch (error) {
      clearConnectionTimeout();
      console.error('Failed to create WebSocket:', error);
      const errorMsg = `Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setConnectionError(errorMsg);
      setConnectionState('error');
      scheduleReconnect();
    }
  }, [roomId, clearReconnectTimeout, clearConnectionTimeout, flushMessageQueue, scheduleReconnect]);

  /**
   * Manually disconnect from WebSocket.
   */
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');

    intentionalDisconnectRef.current = true;
    clearReconnectTimeout();
    clearConnectionTimeout();

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Clear message queue on manual disconnect
    messageQueueRef.current = [];
    setConnectionError(null);

    setConnectionState('disconnected');
  }, [clearReconnectTimeout, clearConnectionTimeout]);

  /**
   * Send a message to the server.
   * Messages are queued if not connected and sent when connection is established.
   */
  const sendMessage = useCallback((message: ClientMessage) => {
    const ws = websocketRef.current;

    if (ws && ws.readyState === WebSocket.OPEN) {
      // Connected - send immediately
      try {
        ws.send(JSON.stringify(message));
        console.log('📤 Sent message:', message.type);
      } catch (error) {
        console.error('Failed to send message:', error);
        // Queue the message if send failed
        queueMessage(message);
      }
    } else {
      // Not connected - queue the message
      queueMessage(message);
    }

    function queueMessage(msg: ClientMessage) {
      // Add to queue
      messageQueueRef.current.push(msg);

      // Enforce queue size limit (drop oldest messages)
      if (messageQueueRef.current.length > MAX_MESSAGE_QUEUE_SIZE) {
        const dropped = messageQueueRef.current.shift();
        console.warn('⚠️ Message queue full, dropped oldest message:', dropped?.type);
      }

      console.log(`📦 Message queued (${messageQueueRef.current.length} in queue):`, msg.type);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      intentionalDisconnectRef.current = true;
      clearReconnectTimeout();
      clearConnectionTimeout();

      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [autoConnect, connect, clearReconnectTimeout, clearConnectionTimeout]);

  // Reconnect when roomId changes
  useEffect(() => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      console.log('🔄 Room ID changed, reconnecting...');
      disconnect();
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only depend on roomId, not on the functions to avoid loops

  return {
    connectionState,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionState === 'connected',
    connectionError,
  };
}
