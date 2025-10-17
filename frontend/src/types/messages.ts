/**
 * WebSocket message type definitions for Flooding Islands.
 * Mirrors the backend models from backend/models/messages.py
 */

import { GameState, PlayerRole, Position } from "./game";

// ============================================================================
// Client → Server Messages
// ============================================================================

/**
 * Message sent when a player selects their role.
 */
export interface SelectRoleMessage {
  type: "select_role";
  role: PlayerRole;
}

/**
 * Message sent to configure the grid size.
 */
export interface ConfigureGridMessage {
  type: "configure_grid";
  size: number; // 3-10
}

/**
 * Message sent when journeyman moves.
 */
export interface MoveMessage {
  type: "move";
  position: Position;
}

/**
 * Message sent when weather floods fields.
 */
export interface FloodMessage {
  type: "flood";
  positions: Position[]; // 0-2 fields
}

/**
 * Message sent to end the current turn.
 */
export interface EndTurnMessage {
  type: "end_turn";
}

/**
 * Union type of all client-to-server messages.
 * The type field acts as a discriminator for type-safe handling.
 */
export type ClientMessage =
  | SelectRoleMessage
  | ConfigureGridMessage
  | MoveMessage
  | FloodMessage
  | EndTurnMessage;

// ============================================================================
// Server → Client Messages
// ============================================================================

/**
 * Message containing the current room state.
 */
export interface RoomStateMessage {
  type: "room_state";
  state: GameState;
}

/**
 * Message containing game state updates.
 */
export interface GameUpdateMessage {
  type: "game_update";
  state: GameState;
}

/**
 * Message sent when the game ends.
 */
export interface GameOverMessage {
  type: "game_over";
  winner: PlayerRole;
  stats: {
    daysSurvived?: number;
    fieldsFlooded?: number;
    [key: string]: any;
  };
}

/**
 * Message sent when an error occurs.
 */
export interface ErrorMessage {
  type: "error";
  message: string;
}

/**
 * Message sent when a player disconnects.
 */
export interface PlayerDisconnectedMessage {
  type: "player_disconnected";
  role: PlayerRole;
}

/**
 * Message sent when a player reconnects.
 */
export interface PlayerReconnectedMessage {
  type: "player_reconnected";
  role: PlayerRole;
}

/**
 * Union type of all server-to-client messages.
 * The type field acts as a discriminator for type-safe handling.
 */
export type ServerMessage =
  | RoomStateMessage
  | GameUpdateMessage
  | GameOverMessage
  | ErrorMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage;

