/**
 * Barrel export for all type definitions.
 * Allows convenient imports like: import { GameState, PlayerRole } from '@/types'
 */

// Re-export all game types
export {
  FieldState,
  PlayerRole,
  GameStatus,
  type Position,
  type GameState,
} from "./game";

// Re-export all message types
export {
  type SelectRoleMessage,
  type ConfigureGridMessage,
  type MoveMessage,
  type FloodMessage,
  type EndTurnMessage,
  type ClientMessage,
  type RoomStateMessage,
  type GameUpdateMessage,
  type GameOverMessage,
  type ErrorMessage,
  type PlayerDisconnectedMessage,
  type PlayerReconnectedMessage,
  type ServerMessage,
} from "./messages";

