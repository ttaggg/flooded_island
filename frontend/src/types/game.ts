/**
 * Core game type definitions for Flooding Islands.
 * Mirrors the backend models from backend/models/game.py
 */

/**
 * State of a field on the game grid.
 */
export enum FieldState {
  DRY = "dry",
  FLOODED = "flooded",
}

/**
 * Player role in the game.
 */
export enum PlayerRole {
  JOURNEYMAN = "journeyman",
  WEATHER = "weather",
}

/**
 * Current status of the game.
 */
export enum GameStatus {
  WAITING = "waiting",         // Waiting for players to join/select roles
  CONFIGURING = "configuring", // Both roles filled, configuring grid
  ACTIVE = "active",           // Game in progress
  ENDED = "ended",             // Game finished
}

/**
 * Coordinates on the game grid.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Complete game room state.
 */
export interface GameState {
  /** Unique room identifier */
  roomId: string;
  
  /** Grid size (3-10), null until configured */
  gridSize: number | null;
  
  /** 2D grid of field states, null until game starts */
  grid: FieldState[][] | null;
  
  /** Current position of journeyman, null until game starts */
  journeymanPosition: Position | null;
  
  /** Current turn number (1-365) */
  currentTurn: number;
  
  /** Which player's turn it is */
  currentRole: PlayerRole;
  
  /** Which roles are filled */
  players: {
    journeyman: boolean;
    weather: boolean;
  };
  
  /** Current game status */
  gameStatus: GameStatus;
  
  /** Winner of the game, null if not ended */
  winner: PlayerRole | null;
  
  /** Room creation timestamp (ISO format) */
  createdAt: string;
  
  /** Game end timestamp (ISO format), null if not ended */
  endedAt: string | null;
}

