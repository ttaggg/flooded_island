/**
 * Game state management hook for Flooded Island.
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
  gameStats: Record<string, unknown> | null;

  // Connection
  connectionState: ConnectionState;
  isConnected: boolean;
  connectionError: string | null;

  // Computed convenience values
  isMyTurn: boolean;
  canSelectRole: boolean;
  canConfigureGrid: boolean;
  canMove: boolean;
  canFlood: boolean;
  availableRoles: PlayerRole[];

  // Weather flood selection tracking
  selectedFloodPositions: Position[];

  // Opponent connection status
  opponentDisconnected: boolean;

  // Action methods
  selectRole: (role: PlayerRole) => void;
  configureGrid: (width: number, height: number, maxFloodCount: number) => void;
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
  const [gameStats, setGameStats] = useState<Record<string, unknown> | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState<boolean>(false);

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

        // Clear flood selection when turn changes to adventurer
        if (message.state.currentRole === PlayerRole.ADVENTURER) {
          setSelectedFloodPositions([]);
        }
        break;

      case 'game_over':
        // Game ended
        console.log(`🏁 Game over! Winner: ${message.winner}`);
        setGameStats(message.stats);
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
        setOpponentDisconnected(true);
        break;

      case 'player_reconnected':
        // Another player reconnected
        console.log(`🔌 Player reconnected: ${message.role}`);
        setOpponentDisconnected(false);
        break;

      default: {
        // TypeScript exhaustiveness check
        const _exhaustive: never = message;
        console.warn('Unknown message type:', _exhaustive);
      }
    }
  }, []);

  // WebSocket integration
  const { connectionState, isConnected, sendMessage, connectionError } = useWebSocket({
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
   * During SETUP: creator can configure before role selection (no role check needed)
   */
  const canConfigureGrid = useMemo(() => {
    if (!gameState) return false;

    // SETUP status: configuration before role selection
    // Allow configuration if grid is not yet configured
    return (
      gameState.gameStatus === GameStatus.SETUP &&
      (gameState.gridWidth === null || gameState.gridHeight === null)
    );
  }, [gameState]);

  /**
   * Check if player can move (adventurer's turn).
   */
  const canMove = useMemo(() => {
    return (
      isMyTurn && myRole === PlayerRole.ADVENTURER && gameState?.gameStatus === GameStatus.ACTIVE
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

    if (!gameState.players.adventurer) {
      roles.push(PlayerRole.ADVENTURER);
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

      // Store role locally and in localStorage for reconnection
      setMyRole(role);
      localStorage.setItem(`flooding-islands-role-${roomId}`, role);

      // Send to server
      sendMessage({
        type: 'select_role',
        role,
      });
    },
    [sendMessage, roomId]
  );

  // Auto-restore role on reconnection
  useEffect(() => {
    if (isConnected && !myRole && gameState?.gameStatus === GameStatus.WAITING) {
      const storedRole = localStorage.getItem(`flooding-islands-role-${roomId}`) as PlayerRole;
      if (storedRole && availableRoles.includes(storedRole)) {
        console.log(`🔄 Auto-restoring role: ${storedRole}`);
        selectRole(storedRole);
      }
    }
  }, [isConnected, myRole, gameState?.gameStatus, availableRoles, selectRole, roomId]);

  // Auto-restore role for active games (reconnection to ongoing game)
  useEffect(() => {
    if (isConnected && !myRole && gameState?.gameStatus === GameStatus.ACTIVE) {
      const storedRole = localStorage.getItem(`flooding-islands-role-${roomId}`) as PlayerRole;
      if (storedRole) {
        console.log(`🔄 Reconnecting to active game with role: ${storedRole}`);
        // For active games, we need to tell the server we're reconnecting with this role
        setMyRole(storedRole);
        sendMessage({
          type: 'select_role',
          role: storedRole,
        });
      }
    }
  }, [isConnected, myRole, gameState?.gameStatus, sendMessage, roomId]);

  /**
   * Configure the grid dimensions (adventurer only).
   */
  const configureGrid = useCallback(
    (width: number, height: number, maxFloodCount: number) => {
      // Validate dimensions locally
      if (width < 3 || width > 10) {
        const errorMsg = `Invalid grid width: ${width}. Must be between 3 and 10.`;
        console.error(errorMsg);
        setLastError(errorMsg);
        if (onErrorRef.current) {
          onErrorRef.current(errorMsg);
        }
        return;
      }
      if (height < 3 || height > 10) {
        const errorMsg = `Invalid grid height: ${height}. Must be between 3 and 10.`;
        console.error(errorMsg);
        setLastError(errorMsg);
        if (onErrorRef.current) {
          onErrorRef.current(errorMsg);
        }
        return;
      }
      if (maxFloodCount < 1 || maxFloodCount > 3) {
        const errorMsg = `Invalid max flood count: ${maxFloodCount}. Must be between 1 and 3.`;
        console.error(errorMsg);
        setLastError(errorMsg);
        if (onErrorRef.current) {
          onErrorRef.current(errorMsg);
        }
        return;
      }

      console.log(`📐 Configuring grid: ${width}x${height}, max flood: ${maxFloodCount}`);

      sendMessage({
        type: 'configure_grid',
        width,
        height,
        maxFloodCount,
      });
    },
    [sendMessage]
  );

  /**
   * Move adventurer to a position.
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
   * Add a position to flood selection (max based on configured limit).
   * Auto-submits when maximum number of positions are selected.
   */
  const addFloodPosition = useCallback(
    (position: Position) => {
      setSelectedFloodPositions((prev) => {
        // Check if already selected
        const alreadySelected = prev.some((p) => p.x === position.x && p.y === position.y);

        if (alreadySelected) {
          console.log(`⚠️ Position (${position.x}, ${position.y}) already selected`);
          return prev;
        }

        // Get max flood count from game state (fallback to 2 for backward compatibility)
        const maxFlood = gameState?.maxFloodCount || 2;

        // Enforce max selections based on configured limit
        if (prev.length >= maxFlood) {
          console.log(`⚠️ Maximum ${maxFlood} flood positions allowed`);
          return prev;
        }

        console.log(`➕ Added flood position (${position.x}, ${position.y})`);
        const newPositions = [...prev, position];

        // Auto-submit if we now have the maximum number of positions
        if (newPositions.length === maxFlood) {
          console.log(`🎯 Auto-submitting flood with ${maxFlood} positions`);
          // Use setTimeout to avoid state update conflicts
          setTimeout(() => {
            sendMessage({
              type: 'flood',
              positions: newPositions,
            });
            // Clear selection after submitting
            setSelectedFloodPositions([]);
          }, 0);
        }

        return newPositions;
      });
    },
    [gameState?.maxFloodCount, sendMessage]
  );

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
    gameStats,

    // Connection
    connectionState,
    isConnected,
    connectionError,

    // Computed convenience values
    isMyTurn,
    canSelectRole,
    canConfigureGrid,
    canMove,
    canFlood,
    availableRoles,

    // Weather flood selection tracking
    selectedFloodPositions,

    // Opponent connection status
    opponentDisconnected,

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
