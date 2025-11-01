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
  // If explicitly set in environment, use it (recommended for production)
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    console.log(`🔧 Using backend URL from environment: ${envUrl}`);
    return envUrl;
  }

  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // If accessing via localhost, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:8000';
    console.log(`🔧 Detected localhost, using: ${url}`);
    return url;
  }

  // If accessing via IP address (mobile scenario), use same hostname with port 8000
  if (isIPAddress(hostname)) {
    const url = `${protocol}//${hostname}:8000`;
    console.log(`🔧 Detected IP address, using: ${url}`);
    return url;
  }

  // For server deployments (hostnames/domains), assume backend is on same origin
  // This works for reverse proxy setups where backend is proxied to same domain
  // For HTTPS/WSS, don't include port (standard ports 443/80)
  // For HTTP/WS, include port if specified
  let url: string;
  if (protocol === 'https:') {
    // HTTPS: Standard port 443, don't include port in URL
    url = `${protocol}//${hostname}`;
  } else {
    // HTTP: Include port if specified, otherwise no port
    url = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  console.log(`🔧 Detected domain (${hostname}), using same origin: ${url}`);
  return url;
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
  const fullUrl = `${baseUrl}/ws/${roomId}`;

  console.log(`🔌 Constructed WebSocket URL: ${fullUrl}`);
  return fullUrl;
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
