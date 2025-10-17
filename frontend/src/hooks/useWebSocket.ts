/**
 * WebSocket hook for real-time communication with the game server.
 * Handles connection management, auto-reconnection, and message queuing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ClientMessage, ServerMessage } from "../types";
import { getWebSocketUrl, isValidServerMessage } from "../utils/websocket";

/**
 * Connection state of the WebSocket.
 */
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

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
}

const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_MESSAGE_QUEUE_SIZE = 50;

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
  const {
    roomId,
    onMessage,
    autoConnect = true,
    maxReconnectDelay = 30000,
  } = options;

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");

  // Refs - values that don't trigger re-renders
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
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
          console.log("📤 Sent queued message:", message.type);
        } catch (error) {
          console.error("Failed to send queued message:", error);
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
      console.log("🔄 Attempting to reconnect...");
      connect();
      
      // Increase delay for next attempt (exponential backoff)
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        maxReconnectDelay
      );
    }, delay);
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

    // Clear any pending reconnection
    clearReconnectTimeout();

    const url = getWebSocketUrl(roomId);
    console.log(`🔌 Connecting to WebSocket: ${url}`);
    
    setConnectionState("connecting");
    intentionalDisconnectRef.current = false;

    try {
      const ws = new WebSocket(url);
      websocketRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setConnectionState("connected");
        
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
            console.log("📥 Received message:", data.type);
            onMessageRef.current(data);
          } else {
            console.warn("⚠️ Received invalid message format:", data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      // Connection closed
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed (code: ${event.code}, clean: ${event.wasClean})`);
        websocketRef.current = null;

        if (intentionalDisconnectRef.current) {
          // User disconnected manually
          setConnectionState("disconnected");
        } else {
          // Unexpected disconnect - try to reconnect
          setConnectionState("error");
          scheduleReconnect();
        }
      };

      // Connection error
      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setConnectionState("error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnectionState("error");
      scheduleReconnect();
    }
  }, [roomId, clearReconnectTimeout, flushMessageQueue, scheduleReconnect]);

  /**
   * Manually disconnect from WebSocket.
   */
  const disconnect = useCallback(() => {
    console.log("🔌 Disconnecting WebSocket...");
    
    intentionalDisconnectRef.current = true;
    clearReconnectTimeout();
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Clear message queue on manual disconnect
    messageQueueRef.current = [];
    
    setConnectionState("disconnected");
  }, [clearReconnectTimeout]);

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
        console.log("📤 Sent message:", message.type);
      } catch (error) {
        console.error("Failed to send message:", error);
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
        console.warn("⚠️ Message queue full, dropped oldest message:", dropped?.type);
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
      
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [autoConnect, connect, clearReconnectTimeout]);

  // Reconnect when roomId changes
  useEffect(() => {
    if (connectionState === "connected" || connectionState === "connecting") {
      console.log("🔄 Room ID changed, reconnecting...");
      disconnect();
      connect();
    }
  }, [roomId]); // Only depend on roomId, not on the functions to avoid loops

  return {
    connectionState,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionState === "connected",
  };
}

