/**
 * WebSocket utility functions for Flooding Islands.
 * Handles URL construction and message validation.
 */

import { ServerMessage } from '../types';

/**
 * Get the backend URL from environment variables or default.
 * @returns The backend base URL (http/https)
 */
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
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

  return typeof data.type === 'string' && validTypes.includes(data.type);
}
