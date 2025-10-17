/**
 * Game state management hook for Flooding Islands.
 * Wraps useWebSocket to manage game state, player role, selections, and actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameState, PlayerRole, Position, GameStatus, ServerMessage } from '../types';
import { useWebSocket, ConnectionState } from './useWebSocket';

/**
 * Options for the useGameState hook.
 */
export interface UseGameStateOptions {
  /** Room ID to connect to */
  roomId: string;
  /** Optional callback invoked when an error occurs */
  onError?: (message: string) => void;
}

/**
 * Return value from the useGameState hook.
 */
export interface UseGameStateReturn {
  // Game state
  gameState: GameState | null;
  myRole: PlayerRole | null;
  lastError: string | null;

  // Connection
  connectionState: ConnectionState;
  isConnected: boolean;

  // Computed convenience values
  isMyTurn: boolean;
  canSelectRole: boolean;
  canConfigureGrid: boolean;
  canMove: boolean;
  canFlood: boolean;
  availableRoles: PlayerRole[];

  // Weather flood selection tracking
  selectedFloodPositions: Position[];

  // Action methods
  selectRole: (role: PlayerRole) => void;
  configureGrid: (size: number) => void;
  move: (position: Position) => void;
  addFloodPosition: (position: Position) => void;
  removeFloodPosition: (position: Position) => void;
  clearFloodSelection: () => void;
  submitFlood: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing complete game state with WebSocket synchronization.
 *
 * Features:
 * - Manages local game state synced with server
 * - Tracks player role and permissions
 * - Handles flood field selection (Weather player)
 * - Provides computed convenience values
 * - Type-safe action methods
 * - Error handling with state and callback
 *
 * @param options - Configuration options
 * @returns Complete game state interface
 */
export function useGameState(options: UseGameStateOptions): UseGameStateReturn {
  const { roomId, onError } = options;

  // State
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myRole, setMyRole] = useState<PlayerRole | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [selectedFloodPositions, setSelectedFloodPositions] = useState<Position[]>([]);

  // Refs - stable references that don't trigger re-renders
  const onErrorRef = useRef(onError);

  // Keep onError callback up to date
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Handle incoming WebSocket messages from the server.
   */
  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'room_state':
        // Initial room state or reconnection
        console.log('🎮 Received room state');
        setGameState(message.state);
        break;

      case 'game_update':
        // Game state update (after moves, floods, etc.)
        console.log('🔄 Game state updated');
        setGameState(message.state);

        // Clear flood selection when turn changes to journeyman
        if (message.state.currentRole === PlayerRole.JOURNEYMAN) {
          setSelectedFloodPositions([]);
        }
        break;

      case 'game_over':
        // Game ended
        console.log(`🏁 Game over! Winner: ${message.winner}`);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            gameStatus: GameStatus.ENDED,
            winner: message.winner,
          };
        });
        break;

      case 'error':
        // Server error
        console.error('❌ Server error:', message.message);
        setLastError(message.message);

        // Call error callback if provided
        if (onErrorRef.current) {
          onErrorRef.current(message.message);
        }
        break;

      case 'player_disconnected':
        // Another player disconnected
        console.log(`👋 Player disconnected: ${message.role}`);
        // Could update UI state here if needed
        break;

      case 'player_reconnected':
        // Another player reconnected
        console.log(`🔌 Player reconnected: ${message.role}`);
        // Could update UI state here if needed
        break;

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = message;
        console.warn('Unknown message type:', _exhaustive);
      }
    }
  }, []);

  // WebSocket integration
  const { connectionState, isConnected, sendMessage } = useWebSocket({
    roomId,
    onMessage: handleMessage,
    autoConnect: true,
  });

  // ============================================================================
  // Computed Convenience Values
  // ============================================================================

  /**
   * Check if it's currently this player's turn.
   */
  const isMyTurn = useMemo(() => {
    return myRole !== null && gameState?.currentRole === myRole;
  }, [myRole, gameState?.currentRole]);

  /**
   * Check if player can select a role.
   */
  const canSelectRole = useMemo(() => {
    return gameState?.gameStatus === GameStatus.WAITING && myRole === null;
  }, [gameState?.gameStatus, myRole]);

  /**
   * Check if player can configure grid.
   * Only journeyman can configure grid during configuring phase.
   */
  const canConfigureGrid = useMemo(() => {
    return myRole === PlayerRole.JOURNEYMAN && gameState?.gameStatus === GameStatus.CONFIGURING;
  }, [myRole, gameState?.gameStatus]);

  /**
   * Check if player can move (journeyman's turn).
   */
  const canMove = useMemo(() => {
    return (
      isMyTurn && myRole === PlayerRole.JOURNEYMAN && gameState?.gameStatus === GameStatus.ACTIVE
    );
  }, [isMyTurn, myRole, gameState?.gameStatus]);

  /**
   * Check if player can flood fields (weather's turn).
   */
  const canFlood = useMemo(() => {
    return isMyTurn && myRole === PlayerRole.WEATHER && gameState?.gameStatus === GameStatus.ACTIVE;
  }, [isMyTurn, myRole, gameState?.gameStatus]);

  /**
   * Get list of available roles (not yet taken).
   */
  const availableRoles = useMemo(() => {
    if (!gameState) return [];

    const roles: PlayerRole[] = [];

    if (!gameState.players.journeyman) {
      roles.push(PlayerRole.JOURNEYMAN);
    }

    if (!gameState.players.weather) {
      roles.push(PlayerRole.WEATHER);
    }

    return roles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.players]);

  // ============================================================================
  // Action Methods
  // ============================================================================

  /**
   * Select a role for this player.
   */
  const selectRole = useCallback(
    (role: PlayerRole) => {
      console.log(`🎭 Selecting role: ${role}`);

      // Store role locally
      setMyRole(role);

      // Send to server
      sendMessage({
        type: 'select_role',
        role,
      });
    },
    [sendMessage]
  );

  /**
   * Configure the grid size (journeyman only).
   */
  const configureGrid = useCallback(
    (size: number) => {
      // Validate size locally
      if (size < 3 || size > 10) {
        const errorMsg = `Invalid grid size: ${size}. Must be between 3 and 10.`;
        console.error(errorMsg);
        setLastError(errorMsg);
        if (onErrorRef.current) {
          onErrorRef.current(errorMsg);
        }
        return;
      }

      console.log(`📐 Configuring grid: ${size}x${size}`);

      sendMessage({
        type: 'configure_grid',
        size,
      });
    },
    [sendMessage]
  );

  /**
   * Move journeyman to a position.
   */
  const move = useCallback(
    (position: Position) => {
      console.log(`🚶 Moving to (${position.x}, ${position.y})`);

      sendMessage({
        type: 'move',
        position,
      });
    },
    [sendMessage]
  );

  /**
   * Add a position to flood selection (max 2).
   */
  const addFloodPosition = useCallback((position: Position) => {
    setSelectedFloodPositions((prev) => {
      // Check if already selected
      const alreadySelected = prev.some((p) => p.x === position.x && p.y === position.y);

      if (alreadySelected) {
        console.log(`⚠️ Position (${position.x}, ${position.y}) already selected`);
        return prev;
      }

      // Enforce max 2 selections
      if (prev.length >= 2) {
        console.log('⚠️ Maximum 2 flood positions allowed');
        return prev;
      }

      console.log(`➕ Added flood position (${position.x}, ${position.y})`);
      return [...prev, position];
    });
  }, []);

  /**
   * Remove a position from flood selection.
   */
  const removeFloodPosition = useCallback((position: Position) => {
    setSelectedFloodPositions((prev) => {
      const filtered = prev.filter((p) => !(p.x === position.x && p.y === position.y));

      if (filtered.length === prev.length) {
        console.log(`⚠️ Position (${position.x}, ${position.y}) not in selection`);
      } else {
        console.log(`➖ Removed flood position (${position.x}, ${position.y})`);
      }

      return filtered;
    });
  }, []);

  /**
   * Clear all flood selections.
   */
  const clearFloodSelection = useCallback(() => {
    console.log('🧹 Cleared flood selection');
    setSelectedFloodPositions([]);
  }, []);

  /**
   * Submit flood action with selected positions.
   */
  const submitFlood = useCallback(() => {
    console.log(`💧 Flooding ${selectedFloodPositions.length} position(s)`);

    sendMessage({
      type: 'flood',
      positions: selectedFloodPositions,
    });

    // Clear selection after submitting
    setSelectedFloodPositions([]);
  }, [selectedFloodPositions, sendMessage]);

  /**
   * Clear the last error message.
   */
  const clearError = useCallback(() => {
    console.log('✅ Cleared error');
    setLastError(null);
  }, []);

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    // Game state
    gameState,
    myRole,
    lastError,

    // Connection
    connectionState,
    isConnected,

    // Computed convenience values
    isMyTurn,
    canSelectRole,
    canConfigureGrid,
    canMove,
    canFlood,
    availableRoles,

    // Weather flood selection tracking
    selectedFloodPositions,

    // Action methods
    selectRole,
    configureGrid,
    move,
    addFloodPosition,
    removeFloodPosition,
    clearFloodSelection,
    submitFlood,
    clearError,
  };
}
