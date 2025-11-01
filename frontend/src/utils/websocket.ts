/**
 * WebSocket utility functions for Flooded Island.
 * Handles URL construction and message validation.
 */

import { ServerMessage } from '../types';

/**
 * Get the backend URL from environment variables or detect from current host.
 * Works for both desktop (localhost) and mobile/server deployments.
 *
 * Priority:
 * 1. VITE_BACKEND_URL environment variable (if set) - recommended for server deployments
 * 2. Current page's origin (for server deployments with reverse proxy)
 * 3. Default to localhost:8000 (for local development)
 *
 * @returns The backend base URL (http/https)
 */
export function getBackendUrl(): string {
  // If explicitly set in environment, use it (recommended for production)
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl;
  }

  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // If accessing via localhost, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  // For server deployments, assume backend is on same origin
  // This works for reverse proxy setups where backend is proxied to same domain
  // If backend is on different port, set VITE_BACKEND_URL environment variable
  const port = window.location.port;
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

/**
 * Convert backend HTTP URL to WebSocket URL and append room path.
 * @param roomId - The room identifier to connect to
 * @returns Full WebSocket URL for the room
 */
export function getWebSocketUrl(roomId: string): string {
  const backendUrl = getBackendUrl();

  // Convert http(s) to ws(s)
  const wsUrl = backendUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

  // Remove trailing slash if present and append room path
  const baseUrl = wsUrl.replace(/\/$/, '');
  return `${baseUrl}/ws/${roomId}`;
}

/**
 * Type guard to validate if data is a valid ServerMessage.
 * Checks for the presence of a 'type' field with valid message types.
 * @param data - Data to validate
 * @returns True if data is a valid ServerMessage structure
 */
export function isValidServerMessage(data: unknown): data is ServerMessage {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const validTypes = [
    'room_state',
    'game_update',
    'game_over',
    'error',
    'player_disconnected',
    'player_reconnected',
  ];

  const obj = data as Record<string, unknown>;
  return typeof obj.type === 'string' && validTypes.includes(obj.type);
}
