/**
 * Game Configuration Screen Component for Flooded Island
 *
 * Allows the Adventurer player to configure grid dimensions with a visual
 * preview before starting the game. Weather player sees a read-only waiting
 * view while the Adventurer configures the grid.
 *
 * Features:
 * - Interactive grid size configuration (3-10 range)
 * - Real-time visual preview of grid dimensions
 * - Quick selection buttons for common sizes
 * - Role-specific UI (active vs waiting)
 * - Input validation and clamping
 * - Responsive layout with glass morphism design
 */

import { useState } from 'react';
import { PlayerRole, GameState } from '../types';
import { ConnectionStatus } from './ConnectionStatus';

/**
 * Props for the GameConfiguration component
 */
interface GameConfigurationProps {
  /** Player's assigned role (ADVENTURER, WEATHER, or null) */
  myRole: PlayerRole | null;
  /** Whether the player can configure the grid (adventurer only) */
  canConfigureGrid: boolean;
  /** Function to configure grid with specified dimensions */
  onConfigureGrid: (width: number, height: number, maxFloodCount: number) => void;
  /** Current WebSocket connection state */
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Current game state */
  gameState: GameState | null;
  /** Last error message received from server */
  lastError: string | null;
  /** Function to clear the current error state */
  onClearError: () => void;
  /** Whether the opponent player is currently disconnected */
  opponentDisconnected: boolean;
}

/**
 * Props for the GridPreview component
 */
interface GridPreviewProps {
  /** Width of the grid to preview */
  width: number;
  /** Height of the grid to preview */
  height: number;
}

/**
 * Visual grid preview component
 *
 * Shows a width×height grid of placeholder squares to give players
 * a visual representation of the grid size before starting the game.
 *
 * @param props - Component props
 * @returns JSX element representing the grid preview
 */
function GridPreview({ width, height }: GridPreviewProps) {
  /**
   * Calculate appropriate square size for grid preview based on dimensions
   *
   * Uses the maximum dimension to determine square size for optimal visibility.
   * Larger grids get smaller squares to fit within the preview area.
   * Preview size is increased by 1.5x to match the actual game board.
   *
   * @param w - Grid width
   * @param h - Grid height
   * @returns Square size in pixels (36-60px range)
   */
  const getSquareSize = (w: number, h: number): number => {
    const maxDim = Math.max(w, h);
    let baseSize;
    if (maxDim <= 5) baseSize = 40;
    else if (maxDim <= 7) baseSize = 30;
    else baseSize = 24;

    // Increase preview size by 1.5x to match game board
    return Math.round(baseSize * 1.5);
  };

  const squareSize = getSquareSize(width, height);

  // Generate grid cells
  const cells = Array.from({ length: width * height }, (_, index) => index);

  return (
    <div className="flex items-center justify-center p-6 min-h-[400px]">
      <div
        className="inline-grid gap-1 bg-indigo-900/30 p-4 rounded-lg border-2 border-white/20"
        style={{
          gridTemplateColumns: `repeat(${width}, ${squareSize}px)`,
        }}
      >
        {cells.map((index) => (
          <div
            key={index}
            className="bg-yellow-200 border border-yellow-400 rounded-sm transition-all duration-200"
            style={{
              width: `${squareSize}px`,
              height: `${squareSize}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Main Game Configuration component
 */
export function GameConfiguration({
  myRole,
  canConfigureGrid,
  onConfigureGrid,
  connectionState,
  gameState,
  lastError,
  onClearError,
  opponentDisconnected,
}: GameConfigurationProps) {
  // Local state for selected grid dimensions (default: 10x10)
  const [selectedWidth, setSelectedWidth] = useState<number>(10);
  const [selectedHeight, setSelectedHeight] = useState<number>(10);
  const [selectedMaxFlood, setSelectedMaxFlood] = useState<number>(2);

  // Determine if current player is Adventurer
  const isAdventurer = myRole === PlayerRole.ADVENTURER;

  // Quick selection sizes (square grids)
  const quickSizes = [5, 7, 10];

  // Handle size change for quick selection (square grids)
  const handleQuickSizeChange = (size: number) => {
    setSelectedWidth(size);
    setSelectedHeight(size);
  };

  // Handle width change from input
  const handleWidthChange = (newWidth: number) => {
    // Clamp between 3 and 10
    const clampedWidth = Math.max(3, Math.min(10, newWidth));
    setSelectedWidth(clampedWidth);
  };

  // Handle height change from input
  const handleHeightChange = (newHeight: number) => {
    // Clamp between 3 and 10
    const clampedHeight = Math.max(3, Math.min(10, newHeight));
    setSelectedHeight(clampedHeight);
  };

  // Handle max flood count change
  const handleMaxFloodChange = (newMaxFlood: number) => {
    // Clamp between 1 and 3
    const clampedMaxFlood = Math.max(1, Math.min(3, newMaxFlood));
    setSelectedMaxFlood(clampedMaxFlood);
  };

  // Handle start game button click
  const handleStartGame = () => {
    if (
      canConfigureGrid &&
      selectedWidth >= 3 &&
      selectedWidth <= 10 &&
      selectedHeight >= 3 &&
      selectedHeight <= 10 &&
      selectedMaxFlood >= 1 &&
      selectedMaxFlood <= 3
    ) {
      onConfigureGrid(selectedWidth, selectedHeight, selectedMaxFlood);
    }
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

      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Flooded Island</h1>
          <h2 className="text-3xl font-semibold text-white/90 mb-3">Game Configuration</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {isAdventurer
              ? 'Configure the game board size and start the game.'
              : 'The Adventurer is configuring the game board.'}
          </p>
        </div>

        {/* Main Configuration Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          {/* Grid Size Selector */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">Grid Size</h3>

            {/* Current Size Display */}
            <div className="text-center mb-6">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4">
                <p className="text-white/70 text-sm mb-1">Selected Size</p>
                <p className="text-5xl font-bold text-white">
                  {selectedWidth} × {selectedHeight}
                </p>
              </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              {quickSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleQuickSizeChange(size)}
                  disabled={!canConfigureGrid}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedWidth === size && selectedHeight === size
                      ? 'bg-yellow-400 text-indigo-900 scale-105 ring-2 ring-yellow-300'
                      : canConfigureGrid
                        ? 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
            </div>

            {/* Number Inputs */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <label htmlFor="grid-width" className="text-white font-semibold">
                  Width (3-10):
                </label>
                <input
                  id="grid-width"
                  type="number"
                  min="3"
                  max="10"
                  value={selectedWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 3)}
                  disabled={!canConfigureGrid}
                  className={`w-20 px-4 py-2 rounded-lg text-center font-bold text-lg ${
                    canConfigureGrid
                      ? 'bg-white/90 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      : 'bg-white/20 text-white/50 cursor-not-allowed'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="grid-height" className="text-white font-semibold">
                  Height (3-10):
                </label>
                <input
                  id="grid-height"
                  type="number"
                  min="3"
                  max="10"
                  value={selectedHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 3)}
                  disabled={!canConfigureGrid}
                  className={`w-20 px-4 py-2 rounded-lg text-center font-bold text-lg ${
                    canConfigureGrid
                      ? 'bg-white/90 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-yellow-400'
                      : 'bg-white/20 text-white/50 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Max Flood Count Selector */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center">
              Maximum Floods Per Turn
            </h3>

            {/* Current Max Flood Display */}
            <div className="text-center mb-6">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4">
                <p className="text-white/70 text-sm mb-1">Weather Can Flood</p>
                <p className="text-5xl font-bold text-white">
                  {selectedMaxFlood} field{selectedMaxFlood !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  onClick={() => handleMaxFloodChange(count)}
                  disabled={!canConfigureGrid}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedMaxFlood === count
                      ? 'bg-blue-400 text-indigo-900 scale-105 ring-2 ring-blue-300'
                      : canConfigureGrid
                        ? 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
                  {count} field{count !== 1 ? 's' : ''}
                </button>
              ))}
            </div>

            {/* Number Input */}
            <div className="flex items-center justify-center gap-2">
              <label htmlFor="max-flood" className="text-white font-semibold">
                Max Floods (1-3):
              </label>
              <input
                id="max-flood"
                type="number"
                min="1"
                max="3"
                value={selectedMaxFlood}
                onChange={(e) => handleMaxFloodChange(parseInt(e.target.value) || 1)}
                disabled={!canConfigureGrid}
                className={`w-20 px-4 py-2 rounded-lg text-center font-bold text-lg ${
                  canConfigureGrid
                    ? 'bg-white/90 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-blue-400'
                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Visual Grid Preview */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Preview</h3>
            <GridPreview width={selectedWidth} height={selectedHeight} />
            <p className="text-white/60 text-sm text-center mt-4">
              All fields start as dry. Adventurer starts at the top-left corner. Weather can flood
              up to {selectedMaxFlood} field{selectedMaxFlood !== 1 ? 's' : ''} per turn.
            </p>
          </div>

          {/* Action Section */}
          <div className="border-t border-white/20 pt-6">
            {isAdventurer ? (
              // Adventurer: Start Game Button
              <div className="text-center">
                <button
                  onClick={handleStartGame}
                  disabled={!canConfigureGrid}
                  className={`px-12 py-4 rounded-xl font-bold text-xl transition-all duration-200 ${
                    canConfigureGrid
                      ? 'bg-yellow-400 text-indigo-900 hover:bg-yellow-500 hover:scale-105 shadow-lg hover:shadow-xl'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Start Game
                </button>
                <p className="text-white/60 text-sm mt-4">
                  Click "Start Game" to begin with a {selectedWidth}×{selectedHeight} grid and{' '}
                  {selectedMaxFlood} max flood{selectedMaxFlood !== 1 ? 's' : ''} per turn
                </p>
              </div>
            ) : (
              // Weather: Waiting State
              <div className="text-center">
                <div className="animate-pulse">
                  <p className="text-white text-xl mb-3">
                    Waiting for Adventurer to configure game...
                  </p>
                  <div className="flex justify-center gap-2">
                    <div
                      className="w-3 h-3 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">
                  Current selection: {selectedWidth}×{selectedHeight} grid, {selectedMaxFlood} max
                  flood{selectedMaxFlood !== 1 ? 's' : ''} per turn
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Game Info Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Your Role: <span className="font-semibold text-white/70">{myRole || 'Unknown'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
