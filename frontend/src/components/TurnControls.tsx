/**
 * Turn Controls Component
 *
 * Displays turn information and provides action controls for players during
 * active gameplay. Shows current day, turn status, and role-specific controls
 * for executing game actions.
 *
 * Features:
 * - Day counter and turn information display
 * - Role-specific action buttons (End Turn, Clear Selection)
 * - Weather player flood selection counter
 * - Turn status indicators with visual feedback
 * - Responsive layout with glass morphism styling
 */

import { GameState, PlayerRole, Position } from '../types';

/**
 * Props for the TurnControls component
 */
interface TurnControlsProps {
  /** Current game state including turn and role information */
  gameState: GameState;
  /** Player's assigned role (JOURNEYMAN, WEATHER, or null) */
  myRole: PlayerRole | null;
  /** Whether it's currently the player's turn */
  isMyTurn: boolean;
  /** Whether the player can currently flood fields (weather's turn) */
  canFlood: boolean;
  /** Currently selected positions for weather flooding (0-2 positions) */
  selectedFloodPositions: Position[];
  /** Function to submit weather's flood action and end turn */
  submitFlood: () => void;
  /** Function to clear weather's flood selection */
  clearFloodSelection: () => void;
}

/**
 * TurnControls component - provides turn information and action buttons
 *
 * Renders turn status information and role-specific controls for player actions.
 * Weather players see flood selection controls, while journeyman players see
 * movement instructions.
 *
 * @param props - Component props
 * @returns JSX element representing turn controls
 */
export function TurnControls({
  gameState,
  myRole,
  isMyTurn,
  canFlood,
  selectedFloodPositions,
  submitFlood,
  clearFloodSelection,
}: TurnControlsProps) {
  const { currentTurn, currentRole } = gameState;

  // Count selected flood positions
  const selectionCount = selectedFloodPositions.length;
  const hasSelection = selectionCount > 0;

  /**
   * Handle End Turn button click for weather player
   *
   * Submits the current flood selection and ends the turn.
   */
  const handleEndTurn = () => {
    if (canFlood) {
      submitFlood();
    }
  };

  /**
   * Handle Clear Selection button click for weather player
   *
   * Clears all currently selected flood positions.
   */
  const handleClearSelection = () => {
    clearFloodSelection();
  };

  return (
    <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
      <div className="flex flex-col gap-4">
        {/* Turn Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-white">
              <span className="text-white/70 text-sm">Day:</span>{' '}
              <span className="font-bold text-2xl">{currentTurn}</span>
              <span className="text-white/70 text-sm">/365</span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="text-white">
              <span className="text-white/70 text-sm">Current Turn:</span>{' '}
              <span className="font-bold text-lg capitalize">{currentRole}</span>
            </div>
          </div>

          {/* Role indicator */}
          <div
            className={`px-4 py-2 rounded-lg ${
              isMyTurn
                ? 'bg-yellow-400/30 ring-2 ring-yellow-400 text-yellow-200'
                : 'bg-white/10 text-white/70'
            }`}
          >
            <span className="text-sm font-medium">
              You: <span className="font-bold capitalize">{myRole || 'Spectator'}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          {/* Weather Player Controls */}
          {canFlood && isMyTurn && myRole === PlayerRole.WEATHER && (
            <div className="flex items-center gap-4 w-full">
              {/* Selection Counter */}
              <div className="flex-1">
                <div className="text-white">
                  <span className="text-white/70 text-sm">Selected:</span>{' '}
                  <span className="font-bold text-xl">{selectionCount}/2 fields</span>
                </div>
                <p className="text-white/60 text-xs mt-1">Select up to 2 dry fields to flood</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Clear Selection Button */}
                <button
                  onClick={handleClearSelection}
                  disabled={!hasSelection}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    hasSelection
                      ? 'bg-white/20 hover:bg-white/30 text-white shadow-md hover:shadow-lg'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  title={hasSelection ? 'Clear selection' : 'No fields selected'}
                >
                  Clear Selection
                </button>

                {/* End Turn Button */}
                <button
                  onClick={handleEndTurn}
                  className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-indigo-900 shadow-lg hover:shadow-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105"
                  title={`Flood ${selectionCount} field${selectionCount !== 1 ? 's' : ''} and end turn`}
                >
                  End Turn
                </button>
              </div>
            </div>
          )}

          {/* Journeyman Player Controls */}
          {isMyTurn && myRole === PlayerRole.JOURNEYMAN && (
            <div className="w-full">
              <div className="text-yellow-400 font-medium text-lg">
                🎯 Your Turn - Click an adjacent field to move
              </div>
              <p className="text-white/60 text-sm mt-1">
                Move to a dry field. Adjacent fields (N/S/E/W) will be automatically dried.
              </p>
            </div>
          )}

          {/* Waiting for Other Player */}
          {!isMyTurn && (
            <div className="w-full text-center">
              <div className="text-white/70 text-lg">
                Waiting for <span className="font-bold capitalize text-white">{currentRole}</span>{' '}
                to play...
              </div>
              <p className="text-white/50 text-sm mt-1">
                {currentRole === PlayerRole.JOURNEYMAN
                  ? 'Journeyman is choosing where to move'
                  : 'Weather is selecting fields to flood'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
