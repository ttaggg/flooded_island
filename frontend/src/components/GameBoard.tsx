/**
 * Game Board Component for Flooded Island
 *
 * Displays the interactive game grid with field states, journeyman position,
 * and handles all player interactions during active gameplay. Provides visual
 * feedback for selectable fields, hover states, and drying previews.
 *
 * Features:
 * - Responsive grid rendering based on game dimensions
 * - Interactive field selection for both player roles
 * - Visual feedback for valid moves and flood selections
 * - Drying preview on hover for journeyman movement
 * - Turn controls and game status display
 * - Connection status monitoring
 */

import { useState } from 'react';
import { GameState, PlayerRole, FieldState, Position } from '../types';
import { Field } from './Field';
import { TurnControls } from './TurnControls';
import { ConnectionStatus } from './ConnectionStatus';

/**
 * Props for the GameBoard component
 */
interface GameBoardProps {
  /** Current game state including grid, positions, and turn info */
  gameState: GameState;
  /** Player's assigned role (JOURNEYMAN, WEATHER, or null) */
  myRole: PlayerRole | null;
  /** Function to execute journeyman movement to a position */
  move: (position: Position) => void;
  /** Function to add a position to weather's flood selection */
  addFloodPosition: (position: Position) => void;
  /** Function to remove a position from weather's flood selection */
  removeFloodPosition: (position: Position) => void;
  /** Currently selected positions for weather flooding (0-2 positions) */
  selectedFloodPositions: Position[];
  /** Whether the player can currently move (journeyman's turn) */
  canMove: boolean;
  /** Whether the player can currently flood fields (weather's turn) */
  canFlood: boolean;
  /** Whether it's currently the player's turn */
  isMyTurn: boolean;
  /** Function to submit weather's flood action and end turn */
  submitFlood: () => void;
  /** Function to clear weather's flood selection */
  clearFloodSelection: () => void;
  /** Current WebSocket connection state */
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Last error message received from server */
  lastError: string | null;
  /** Function to clear the current error state */
  onClearError: () => void;
  /** Whether the opponent player is currently disconnected */
  opponentDisconnected: boolean;
}

/**
 * Main GameBoard component for active gameplay
 *
 * Renders the complete game interface including:
 * - Game header with day counter and turn information
 * - Interactive grid with field states and journeyman position
 * - Visual feedback for selectable fields and hover states
 * - Drying preview for journeyman movement
 * - Turn controls for player actions
 * - Connection status monitoring
 *
 * @param props - Component props
 * @returns JSX element representing the game board
 */
export function GameBoard({
  gameState,
  myRole,
  move,
  addFloodPosition,
  removeFloodPosition,
  selectedFloodPositions,
  canMove,
  canFlood,
  isMyTurn,
  submitFlood,
  clearFloodSelection,
  connectionState,
  lastError,
  onClearError,
  opponentDisconnected,
}: GameBoardProps) {
  const { grid, gridWidth, gridHeight, journeymanPosition, currentTurn, currentRole } = gameState;

  // Hover tracking state
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [dryingPreviewPositions, setDryingPreviewPositions] = useState<Position[]>([]);

  // Early return if grid is not initialized
  if (!grid || !gridWidth || !gridHeight || !journeymanPosition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-white text-2xl">Initializing game board...</div>
        </div>
      </div>
    );
  }

  /**
   * Calculate appropriate cell size based on grid dimensions
   *
   * Uses the maximum dimension to determine cell size for optimal visibility.
   * Smaller grids get larger cells for better interaction.
   * Board size is increased by 1.5x for better visibility.
   *
   * @param width - Grid width
   * @param height - Grid height
   * @returns Cell size in pixels (60-90px range)
   */
  const getCellSize = (width: number, height: number): number => {
    const maxDim = Math.max(width, height);
    let baseSize;
    if (maxDim <= 5) baseSize = 60;
    else if (maxDim <= 7) baseSize = 50;
    else baseSize = 40;

    // Increase board size by 1.5x
    return Math.round(baseSize * 1.5);
  };

  const cellSize = getCellSize(gridWidth, gridHeight);

  /**
   * Get cardinal adjacent positions (N/S/E/W only) for drying preview
   *
   * Returns the four cardinal directions from a position, filtering out
   * positions that are outside the grid bounds. Used specifically for
   * showing which fields will be dried when journeyman moves.
   *
   * @param position - Center position to find adjacents for
   * @returns Array of valid adjacent positions in cardinal directions
   */
  const getCardinalAdjacent = (position: Position): Position[] => {
    const positions: Position[] = [];
    const directions = [
      { x: 0, y: -1 }, // N
      { x: 1, y: 0 }, // E
      { x: 0, y: 1 }, // S
      { x: -1, y: 0 }, // W
    ];

    for (const dir of directions) {
      const newX = position.x + dir.x;
      const newY = position.y + dir.y;
      if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
        positions.push({ x: newX, y: newY });
      }
    }
    return positions;
  };

  /**
   * Check if the journeyman is positioned at the given coordinates
   *
   * @param row - Row index to check
   * @param col - Column index to check
   * @returns True if journeyman is at the specified position
   */
  const isJourneymanAt = (row: number, col: number): boolean => {
    return journeymanPosition.y === row && journeymanPosition.x === col;
  };

  /**
   * Determine if a field is selectable based on current game state and player role
   *
   * For Journeyman: Can move to adjacent dry fields (8 directions)
   * For Weather: Can select any dry field except journeyman's position (max 2)
   *
   * @param row - Row index of the field
   * @param col - Column index of the field
   * @returns True if the field can be selected by the current player
   */
  const isFieldSelectable = (row: number, col: number): boolean => {
    const fieldState = grid[row][col];

    // Can't select flooded fields
    if (fieldState === FieldState.FLOODED) {
      return false;
    }

    // Journeyman's turn - can move to adjacent dry fields
    if (canMove) {
      // Can't move to current position
      if (isJourneymanAt(row, col)) {
        return false;
      }

      // Check if adjacent (8 directions)
      const rowDiff = Math.abs(row - journeymanPosition.y);
      const colDiff = Math.abs(col - journeymanPosition.x);
      return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
    }

    // Weather's turn - can flood any dry field except journeyman's position
    if (canFlood) {
      // Can't flood journeyman's position
      if (isJourneymanAt(row, col)) {
        return false;
      }

      // Can't select more than 2 positions
      const isAlreadySelected = selectedFloodPositions.some((p) => p.x === col && p.y === row);
      if (!isAlreadySelected && selectedFloodPositions.length >= 2) {
        return false;
      }

      return true;
    }

    return false;
  };

  /**
   * Check if a field is currently selected by the weather player
   *
   * @param row - Row index of the field
   * @param col - Column index of the field
   * @returns True if the field is in the weather's flood selection
   */
  const isFieldSelected = (row: number, col: number): boolean => {
    return selectedFloodPositions.some((p) => p.x === col && p.y === row);
  };

  /**
   * Handle field click events for both player roles
   *
   * Journeyman: Immediately moves to the clicked field
   * Weather: Toggles the field in/out of flood selection
   *
   * @param row - Row index of clicked field
   * @param col - Column index of clicked field
   */
  const handleFieldClick = (row: number, col: number) => {
    const position: Position = { x: col, y: row };

    if (canMove) {
      // Journeyman: Move immediately
      move(position);
    } else if (canFlood) {
      // Weather: Toggle selection
      if (isFieldSelected(row, col)) {
        removeFloodPosition(position);
      } else {
        addFloodPosition(position);
      }
    }
  };

  /**
   * Handle mouse enter events for hover effects and drying preview
   *
   * Sets the hovered cell state and calculates drying preview positions
   * for journeyman movement (shows which fields will be dried).
   *
   * @param row - Row index of hovered field
   * @param col - Column index of hovered field
   */
  const handleMouseEnter = (row: number, col: number) => {
    const position = { x: col, y: row };
    setHoveredCell(position);

    // Calculate drying preview for journeyman movement
    if (canMove && isFieldSelectable(row, col)) {
      const adjacentPositions = getCardinalAdjacent(position);
      setDryingPreviewPositions(adjacentPositions);
    }
  };

  /**
   * Handle mouse leave events to clear hover states and previews
   */
  const handleMouseLeave = () => {
    setHoveredCell(null);
    setDryingPreviewPositions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center px-4 py-8">
      {/* Connection Status Component */}
      <ConnectionStatus
        connectionState={connectionState}
        gameState={gameState}
        myRole={myRole}
        lastError={lastError}
        onClearError={onClearError}
        opponentDisconnected={opponentDisconnected}
      />

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Flooded Island</h1>
          <div className="flex items-center justify-center gap-8 text-white/90">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-2">
              <span className="text-sm text-white/70">Day:</span>{' '}
              <span className="font-bold text-xl">{currentTurn}</span>
              <span className="text-sm text-white/70">/365</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-2">
              <span className="text-sm text-white/70">Current Turn:</span>{' '}
              <span className="font-bold text-xl capitalize">{currentRole}</span>
            </div>
            <div
              className={`backdrop-blur-sm rounded-lg px-6 py-2 ${
                isMyTurn ? 'bg-yellow-400/30 ring-2 ring-yellow-400' : 'bg-white/10'
              }`}
            >
              <span className="text-sm text-white/70">Your Role:</span>{' '}
              <span className="font-bold text-xl capitalize">{myRole || 'Spectator'}</span>
            </div>
          </div>
        </div>

        {/* Main Game Board Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          {/* Turn Indicator */}
          <div className="text-center mb-4">
            {isMyTurn ? (
              <p className="text-yellow-400 font-bold text-xl animate-pulse">
                🎯 Your Turn - Make Your Move
              </p>
            ) : (
              <p className="text-white/70 text-lg">
                Waiting for {currentRole === PlayerRole.JOURNEYMAN ? 'Journeyman' : 'Weather'} to
                move...
              </p>
            )}
          </div>

          {/* Grid Container */}
          <div className="flex items-center justify-center">
            <div className="bg-indigo-900/30 p-4 rounded-lg border-2 border-white/20 inline-block">
              <div
                className="inline-grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
                }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((fieldState, colIndex) => {
                    const hasJourneyman = isJourneymanAt(rowIndex, colIndex);
                    const isSelectable = isFieldSelectable(rowIndex, colIndex);
                    const isSelected = isFieldSelected(rowIndex, colIndex);
                    const isHovered =
                      hoveredCell !== null &&
                      hoveredCell.x === colIndex &&
                      hoveredCell.y === rowIndex;
                    const isDryingPreview = dryingPreviewPositions.some(
                      (p) => p.x === colIndex && p.y === rowIndex
                    );

                    return (
                      <Field
                        key={`${rowIndex}-${colIndex}`}
                        row={rowIndex}
                        col={colIndex}
                        fieldState={fieldState}
                        hasJourneyman={hasJourneyman}
                        cellSize={cellSize}
                        isSelectable={isSelectable}
                        isSelected={isSelected}
                        isHovered={isHovered}
                        isDryingPreview={isDryingPreview}
                        onClick={handleFieldClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 border-2 border-yellow-400 rounded"></div>
              <span className="text-white/80 text-sm font-medium">Dry Field</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-400 border-2 border-blue-600 rounded"></div>
              <span className="text-white/80 text-sm font-medium">Flooded Field</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 border-2 border-yellow-400 rounded flex items-center justify-center">
                <span className="text-xs">🧙‍♂️</span>
              </div>
              <span className="text-white/80 text-sm font-medium">Journeyman</span>
            </div>
          </div>
        </div>

        {/* Turn Controls */}
        <TurnControls
          gameState={gameState}
          myRole={myRole}
          isMyTurn={isMyTurn}
          canFlood={canFlood}
          selectedFloodPositions={selectedFloodPositions}
          submitFlood={submitFlood}
          clearFloodSelection={clearFloodSelection}
        />

        {/* Game Info Footer */}
        <div className="mt-4 text-center">
          <p className="text-white/50 text-sm">
            Grid Size: {gridWidth}×{gridHeight} • Room ID: {gameState.roomId}
          </p>
        </div>
      </div>
    </div>
  );
}
