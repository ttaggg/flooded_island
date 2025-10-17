/**
 * Game Board Component
 * Displays the N×N game grid with field states and journeyman position
 */

import { GameState, PlayerRole, FieldState } from '../types';

interface GameBoardProps {
  gameState: GameState;
  myRole: PlayerRole | null;
}

/**
 * Main GameBoard component
 */
export function GameBoard({ gameState, myRole }: GameBoardProps) {
  const { grid, gridWidth, gridHeight, journeymanPosition, currentTurn, currentRole } = gameState;

  // Early return if grid is not initialized
  if (!grid || !gridWidth || !gridHeight || !journeymanPosition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-white text-2xl">Initializing game board...</div>
        </div>
      </div>
    );
  }

  // Calculate cell size based on grid dimensions (using the max dimension)
  const getCellSize = (width: number, height: number): number => {
    const maxDim = Math.max(width, height);
    if (maxDim <= 5) return 60;
    if (maxDim <= 7) return 50;
    return 40;
  };

  const cellSize = getCellSize(gridWidth, gridHeight);

  // Helper function to check if journeyman is at a position
  const isJourneymanAt = (row: number, col: number): boolean => {
    return journeymanPosition.y === row && journeymanPosition.x === col;
  };

  // Get field color classes based on state
  const getFieldClasses = (fieldState: FieldState): string => {
    if (fieldState === FieldState.DRY) {
      return 'bg-yellow-200 border-yellow-400';
    } else {
      return 'bg-blue-400 border-blue-600';
    }
  };

  // Determine if it's the player's turn
  const isMyTurn = myRole === currentRole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Flooding Islands</h1>
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
                    const fieldClasses = getFieldClasses(fieldState);

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`${fieldClasses} border-2 rounded transition-all duration-200 flex items-center justify-center relative`}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                        }}
                      >
                        {hasJourneyman && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="text-2xl drop-shadow-lg"
                              style={{ fontSize: `${cellSize * 0.6}px` }}
                            >
                              🧙‍♂️
                            </span>
                          </div>
                        )}
                      </div>
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
