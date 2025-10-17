/**
 * Room ID utilities for Flooded Island
 * Handles generation, validation, and formatting of room codes
 */

/**
 * Character set for room ID generation (excludes confusing characters)
 * No 0/O, 1/I/L to avoid confusion
 */
const ROOM_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random 6-character room ID
 * @returns A 6-character alphanumeric room code
 */
export function generateRoomId(): string {
  return Array.from({ length: 6 }, () =>
    ROOM_ID_CHARS.charAt(Math.floor(Math.random() * ROOM_ID_CHARS.length))
  ).join('');
}

/**
 * Validate if a string is a valid room ID format
 * @param id The string to validate
 * @returns True if valid format (6 characters, alphanumeric)
 */
export function isValidRoomId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check length
  if (id.length !== 6) {
    return false;
  }

  // Check all characters are in valid set
  return Array.from(id).every((char) => ROOM_ID_CHARS.includes(char));
}

/**
 * Format user input for room ID
 * @param input Raw user input
 * @returns Formatted room ID (uppercase, trimmed)
 */
export function formatRoomId(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().toUpperCase();
}
