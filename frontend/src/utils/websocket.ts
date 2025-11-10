/**
 * WebSocket utility functions for Flooded Island.
 * Handles URL construction and message validation.
 */

import { ServerMessage } from '../types';

/**
 * Check if a hostname is an IP address (IPv4 or IPv6).
 * @param hostname - The hostname to check
 * @returns True if hostname is an IP address, false otherwise
 */
function isIPAddress(hostname: string): boolean {
  // IPv4 pattern: 4 groups of 1-3 digits separated by dots
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;

  // IPv6 pattern: groups of hex digits separated by colons
  // This is a simplified check - full IPv6 validation is more complex
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}$/;

  // Also check for IPv6 with brackets (e.g., [::1] or [2001:db8::1])
  const ipv6BracketedPattern = /^\[([0-9a-fA-F:]+)\]$/;

  if (ipv4Pattern.test(hostname)) {
    return true;
  }

  if (ipv6Pattern.test(hostname)) {
    return true;
  }

  if (ipv6BracketedPattern.test(hostname)) {
    return true;
  }

  return false;
}

/**
 * Determine if the hostname refers to the local machine.
 * @param hostname - Hostname to check
 * @returns True when hostname is localhost or loopback
 */
function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Get the backend URL from environment variables or detect from current host.
 * Works for both desktop (localhost) and mobile/server deployments.
 *
 * Priority:
 * 1. VITE_BACKEND_URL environment variable (if set) - recommended for server deployments
 * 2. If localhost → use http://localhost:8000
 * 3. If IP address → use same hostname with port 8000 (for mobile access)
 * 4. Otherwise → same origin (for production/reverse proxy setups)
 *
 * @returns The backend base URL (http/https)
 */
export function getBackendUrl(): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // If explicitly set in environment, use it (recommended for production)
  const envUrlRaw = import.meta.env.VITE_BACKEND_URL?.trim();
  if (envUrlRaw) {
    try {
      return new URL(envUrlRaw, `${protocol}//${hostname}`).toString();
    } catch (error) {
      console.warn(
        'Invalid VITE_BACKEND_URL provided; falling back to automatic detection.',
        error
      );
    }
  }

  // Auto-detect based on current hostname
  // If accessing via localhost, use localhost backend
  if (isLocalHostname(hostname)) {
    return 'http://localhost:8000';
  }

  // If accessing via IP address (mobile scenario), use same hostname with port 8000
  if (isIPAddress(hostname)) {
    return `${protocol}//${hostname}:8000`;
  }

  // For server deployments (hostnames/domains), assume backend is on same origin
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
