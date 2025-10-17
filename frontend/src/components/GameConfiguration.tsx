/**
 * Game Configuration Screen Component
 * Allows Journeyman to configure grid size with visual preview.
 * Weather player sees read-only view while waiting.
 */

import { useState } from 'react';
import { PlayerRole } from '../types';

interface GameConfigurationProps {
  myRole: PlayerRole | null;
  canConfigureGrid: boolean;
  onConfigureGrid: (width: number, height: number) => void;
}

interface GridPreviewProps {
  width: number;
  height: number;
}

/**
 * Visual grid preview component
 * Shows width×height grid of placeholder squares
 */
function GridPreview({ width, height }: GridPreviewProps) {
  // Calculate square size based on grid dimensions (smaller squares for larger grids)
  const getSquareSize = (w: number, h: number): number => {
    const maxDim = Math.max(w, h);
    if (maxDim <= 5) return 40;
    if (maxDim <= 7) return 30;
    return 24;
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
}: GameConfigurationProps) {
  // Local state for selected grid dimensions (default: 10x10)
  const [selectedWidth, setSelectedWidth] = useState<number>(10);
  const [selectedHeight, setSelectedHeight] = useState<number>(10);

  // Determine if current player is Journeyman
  const isJourneyman = myRole === PlayerRole.JOURNEYMAN;

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

  // Handle start game button click
  const handleStartGame = () => {
    if (
      canConfigureGrid &&
      selectedWidth >= 3 &&
      selectedWidth <= 10 &&
      selectedHeight >= 3 &&
      selectedHeight <= 10
    ) {
      onConfigureGrid(selectedWidth, selectedHeight);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">Flooding Islands</h1>
          <h2 className="text-3xl font-semibold text-white/90 mb-3">Game Configuration</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {isJourneyman
              ? 'Configure the game board size and start the game.'
              : 'The Journeyman is configuring the game board.'}
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

          {/* Visual Grid Preview */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Preview</h3>
            <GridPreview width={selectedWidth} height={selectedHeight} />
            <p className="text-white/60 text-sm text-center mt-4">
              All fields start as dry. Journeyman starts at the top-left corner.
            </p>
          </div>

          {/* Action Section */}
          <div className="border-t border-white/20 pt-6">
            {isJourneyman ? (
              // Journeyman: Start Game Button
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
                  Click "Start Game" to begin with a {selectedWidth}×{selectedHeight} grid
                </p>
              </div>
            ) : (
              // Weather: Waiting State
              <div className="text-center">
                <div className="animate-pulse">
                  <p className="text-white text-xl mb-3">
                    Waiting for Journeyman to configure game...
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
                  Current selection: {selectedWidth}×{selectedHeight}
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
